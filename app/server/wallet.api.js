import { Buffer } from "buffer";
import sl, {
  ScriptHash,
  TransactionBody,
  Vkeywitnesses,
  PrivateKey,
  TransactionWitnessSet,
  AssetName,
} from "@emurgo/cardano-serialization-lib-nodejs";

import db from "./db/db";
import axios from 'axios';

function _hex2a(hexx) {
  let hex = hexx.toString(); //force conversion
  let str = "";
  for (var i = 0; i < hex.length; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

async function vkeyWitness(TransactionBodyCall) {
  if (TransactionBodyCall) {
    const nftPolicy = ScriptHash.from_bytes(
      Buffer.from(process.env.NEXT_PUBLIC_REACT_NFT_POLICY, "hex")
    );
    const aadaTokenPolicy = ScriptHash.from_bytes(
      Buffer.from(process.env.NEXT_PUBLIC_REACT_APP_REQUIRED_TOKEN, "hex")
    );

    const aadaTokenName = AssetName.new(Buffer.from("41414441", "hex"));
    const apiKey = process.env.signingKeyHexCBOR;
    const signingKey = PrivateKey.from_normal_bytes(Buffer.from(apiKey, "hex"));

    const txBody = TransactionBody.from_bytes(
      Buffer.from(TransactionBodyCall, "hex")
    );
    const vkeysWitnesses = Vkeywitnesses.new();
    const txBodyOutputs = txBody.outputs();
    var aadaTokensAmount = 0;

    if (txBodyOutputs) {
      var nftTokensValue = sl.Value.new(sl.BigNum.from_str("0"));

      for (let i = 0; i < txBodyOutputs.len(); i++) {
        try {
          if (txBodyOutputs.get(i).amount().multiasset().get(nftPolicy)) {
            nftTokensValue = txBodyOutputs
              .get(i)
              .amount()
              .multiasset()
              .get(nftPolicy);
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
    var nftTokenName = "";
    for (let i = 0; i < nftTokensValue.keys().len(); i++) {
      nftTokenName = Buffer.from(
        nftTokensValue.keys().get(i).name(),
        "hex"
      ).toString("hex");
    }

    if (!nftTokenName) {
      return;
    }

    const insertedReceipt = await db.getInsertedReceipt(_hex2a(nftTokenName));
    console.log({ insertedReceipt });

    const aadaTokensPerNftFromDb = insertedReceipt.aada_amount;
    console.log(aadaTokensAmount);

    // Do the check if total AADA in tx matches amount from DB
    if (aadaTokensPerNftFromDb) {
      console.log("We can sign the transaction");

      // Convert transaction body to hash. Since we don't update anything all should be cool.
      const txHashString = sl.hash_transaction(txBody);
      const vkeyWitness = sl.make_vkey_witness(txHashString, signingKey);
      vkeysWitnesses.add(vkeyWitness);

      const txWitnessSet = TransactionWitnessSet.new();
      txWitnessSet.set_vkeys(vkeysWitnesses);

      const txWitnessSetString = Buffer.from(txWitnessSet.to_bytes()).toString(
        "hex"
      );
      return txWitnessSetString;
    } else {
      console.log("Do not sign the transaction");
      return;
    }
  }
}

async function stake({ cborHex, walletAddress }) {
  const txBackend = sl.Transaction.from_bytes(Buffer.from(cborHex, "hex"));
  const txBackendBody = txBackend.body();

  const walletKey = process.env.STAKE_SIGNING_WALLET_KEY;
  const signingWalletKey = sl.PrivateKey.from_normal_bytes(Buffer.from(walletKey, "hex"));

  // Build TX in order to capture auxData
  const protocolParameters = await _getParams();
  const { txBuilder, datums, outputs } = await _initTx(protocolParameters);

  txBuilder.set_auxiliary_data(txBackend.auxiliary_data());
  const tempInput = txBackendBody.inputs().get(0);

  txBuilder.add_input(sl.Address.from_bech32(walletAddress),
    tempInput,
    sl.Value.new(sl.BigNum.from_str("999999999999999999")));

  txBuilder.add_output(txBackendBody.outputs().get(0));
  txBuilder.add_change_if_needed(sl.Address.from_bech32(walletAddress));
  const tmpTransactionForAux = txBuilder.build();

  txBackendBody.set_auxiliary_data_hash(tmpTransactionForAux.auxiliary_data_hash());

  const constructedTx = await sl.Transaction.new(
    txBackendBody,
    txBackend.witness_set(),
    txBackend.auxiliary_data()
  );

  const txHash = sl.hash_transaction(txBackendBody);
  const walletWitness = sl.make_vkey_witness(txHash, signingWalletKey);

  const walletWitnessHex = Buffer.from(walletWitness.to_bytes()).toString('hex');
  const txHex = Buffer.from(constructedTx.to_bytes()).toString("hex");

  return {
    txHex,
    walletWitnessHex,
  };
}

async function addWitnesses({ witnesses, txHex, walletWitnessHex }) {
  const vkeysWitnesses = sl.Vkeywitnesses.new();
  const walletWitness = sl.Vkeywitness.from_bytes(Buffer.from(walletWitnessHex, 'hex'));
  vkeysWitnesses.add(walletWitness);

  const tx = await sl.Transaction.from_bytes(Buffer.from(txHex, 'hex'));
  const walletWitnesses = sl.TransactionWitnessSet.from_bytes(Buffer.from(witnesses, "hex"));
  const totalVkeys = sl.Vkeywitnesses.new();
  const namiVkeys = walletWitnesses.vkeys();

  if (namiVkeys) {
    for (let i = 0; i < namiVkeys.len(); i++) {
      totalVkeys.add(namiVkeys.get(i));
    }
  }

  if (vkeysWitnesses) {
    for (let i = 0; i < vkeysWitnesses.len(); i++) {
      totalVkeys.add(vkeysWitnesses.get(i));
    }
  }

  const txWitnesses = tx.witness_set();
  txWitnesses.vkeys()?.free();
  txWitnesses.set_vkeys(totalVkeys);

  const txBody = tx.body();
  const signedTx = await sl.Transaction.new(txBody, txWitnesses, tx.auxiliary_data());
  const signedTxHex = Buffer.from(signedTx.to_bytes()).toString("hex");
  return signedTxHex;
}

async function _initTx(protocolParameters) {
  const cfg = sl.TransactionBuilderConfigBuilder.new()
    .fee_algo(
      sl.LinearFee.new(
        sl.BigNum.from_str(protocolParameters.linearFee.minFeeA),
        sl.BigNum.from_str(protocolParameters.linearFee.minFeeB)
      )
    )
    .pool_deposit(sl.BigNum.from_str(protocolParameters.poolDeposit))
    .key_deposit(sl.BigNum.from_str(protocolParameters.keyDeposit))
    .max_tx_size(protocolParameters.maxTxSize)
    .max_value_size(protocolParameters.maxValSize)
    .coins_per_utxo_word(
      sl.BigNum.from_str(protocolParameters.coinsPerUtxoWord)
    )
    .build();

  const txBuilder = sl.TransactionBuilder.new(cfg);
  const datums = sl.PlutusList.new();
  const outputs = sl.TransactionOutputs.new();
  return { txBuilder, datums, outputs };
}

async function _getParams() {
  const latestURL = `https://cardano-${process.env.NEXT_PUBLIC_REACT_NETWORK}.blockfrost.io/api/v0/blocks/latest`;
  const paramsURL = `https://cardano-${process.env.NEXT_PUBLIC_REACT_NETWORK}.blockfrost.io/api/v0/epochs/latest/parameters`;
  const l = await _blockFrostReq(latestURL);
  const p = await _blockFrostReq(paramsURL);
  return {
    linearFee: {
      minFeeA: p.min_fee_a.toString(),
      minFeeB: p.min_fee_b.toString(),
    },
    minUtxo: p.min_utxo,
    poolDeposit: p.pool_deposit,
    keyDeposit: p.key_deposit,
    coinsPerUtxoWord: "34482",
    maxValSize: 5000,
    priceMem: 5.77e-2,
    priceStep: 7.21e-5,
    maxTxSize: parseInt(p.max_tx_size),
    slot: parseInt(l.slot),
  };
};

async function _blockFrostReq(url) {
  try {
    const configBuilder = {
      headers: {
        project_id: process.env.NEXT_PUBLIC_REACT_BLOCKFRST_API,
      },
    };
    const response = await axios.get(url, configBuilder);
    return response.data;
  } catch (error) {
    return error;
  }
}

export default { vkeyWitness, stake, addWitnesses };