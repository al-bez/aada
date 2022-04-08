import { Cardano } from '../../client/cardano.api';
import _ from 'lodash';
import cardanoService from '../../client/services/cardano.service';
import * as notify from '../../client/services/notification.service';
import AssetFingerprint from '@emurgo/cip14-js';

let _api = {
  get cardano() {
    return window.cardanoApi;
  },

  get connected() {
    return !!window.cardanoApi;
  },
};

async function getBalance() {
  return await _api.cardano.getBalance();
}

async function _getUtxoOfToken(tokenPolicy = null) {
  if (!tokenPolicy) {
    throw Error("Invalid token plicy of getUtxoOfToken()");
  }
  const utxoWithToken = await _api.cardano.getUserTokenAssets(tokenPolicy);
  const totalQty = utxoWithToken.map(utxo => Number(utxo.quantity)).reduce((a, b) => a + b, 0);
  return totalQty;
}

async function _getCollateral() {
  try {
    const collateralArray = await _api.cardano.getCollateralUtxo();
    const collateralBytes = collateralArray[0];
    if (collateralBytes) {
      const sl = await Cardano();
      const utxo = sl.TransactionUnspentOutput.from_bytes(Buffer.from(collateralBytes, "hex"));
      const txInput = utxo.input();
      const txIdBytes = txInput.transaction_id().to_bytes();
      const txIndex = txInput.index();
      const transaction_id = Buffer.from(txIdBytes, "hex").toString("hex");
      return `${transaction_id}#${txIndex}`;
    }
  } catch (err) {
    console.log("error in getCollateral method:", err);
  }
}

async function stake({ amount, months }) {
  try {
    const walletAddresses = await _api.cardano.getUsedAddresses();
    const collateral = await _getCollateral();
    if (!collateral) {
      notify.showError({ message: `Please add Collateral in the wallet` });
      return;
    }
    const stakeInput = { amount, months, walletAddresses, collateral };
    const { success, ...otherProps } = await cardanoService.stake(stakeInput);
    if (success) {
      const { txHex, walletWitnessHex } = otherProps;
      const witnesses = await _api.cardano.signTx(txHex, true);
      const resAddWitness = await cardanoService.addWitnesses({ witnesses, txHex, walletWitnessHex });
      if (resAddWitness.success) {
        const txHash = await _api.cardano.submitTxWallet(resAddWitness.txHex);
        return { success: true, txHash };
      }
    } else {
      notify.showError({ message: otherProps.info });
      return;
    }
  } catch (err) {
    console.log({ err });

    if (err.toJSON) {
      const errJson = err.toJSON();
      notify.showError({ message: errJson.message });
      return { success: false };
    }

    if (err.info) {
      notify.showError({ message: err.info });
      return { success: false, err: err.info };
    }
  }

  notify.showError({ message: 'Unknown error occured' });
  return { success: false };
}

function isConnected() {
  return _api.connected;
}

async function getBalanceStake() {
  const tokenPolicy = process.env.NEXT_PUBLIC_STAKE_TOKEN_POLICY;
  const balance = await _getUtxoOfToken(tokenPolicy);
  return balance;
}

export default {
  stake,
  isConnected,
  getBalance,
  getBalanceStake
};


function _hexToBuffer(string) {
  return Buffer.from(string, "hex");
}

function _hexToAscii(string) {
  return _hexToBuffer(string).toString("ascii");
}