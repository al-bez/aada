import Loader from "./loader";
import { Buffer } from "buffer";
import AssetFingerprint from "@emurgo/cip14-js";
import axios from "axios";
import cardanoService from "./services/cardano.service";

import CoinSelection from "./coinSelection";
import { throwError } from "./utils";
import storageService from './services/storage.service';
import blockfrostApiKey from './config';
import { showError } from './services/notification.service';

export async function Cardano() {
  await Loader.load();
  return Loader.Cardano;
}

export const languageViews =
  "a141005901d59f1a000302590001011a00060bc719026d00011a000249f01903e800011a000249f018201a0025cea81971f70419744d186419744d186419744d186419744d186419744d186419744d18641864186419744d18641a000249f018201a000249f018201a000249f018201a000249f01903e800011a000249f018201a000249f01903e800081a000242201a00067e2318760001011a000249f01903e800081a000249f01a0001b79818f7011a000249f0192710011a0002155e19052e011903e81a000249f01903e8011a000249f018201a000249f018201a000249f0182001011a000249f0011a000249f0041a000194af18f8011a000194af18f8011a0002377c190556011a0002bdea1901f1011a000249f018201a000249f018201a000249f018201a000249f018201a000249f018201a000249f018201a000242201a00067e23187600010119f04c192bd200011a000249f018201a000242201a00067e2318760001011a000242201a00067e2318760001011a0025cea81971f704001a000141bb041a000249f019138800011a000249f018201a000302590001011a000249f018201a000249f018201a000249f018201a000249f018201a000249f018201a000249f018201a000249f018201a00330da70101ff";

const ERROR = {
  FAILED_PROTOCOL_PARAMETER:
    "Couldnt fetch protocol parameters from blockfrost",
  TX_TOO_BIG: "Transaction too big",
};

class CardanoApi {
  detailUtxoToAssets(utxo) {
    const value = utxo.output().amount();
    const assets = [];
    assets.push({ unit: "lovelace", quantity: value.coin().to_str() });

    if (value.multiasset()) {
      const multiAssets = value.multiasset().keys();
      for (let j = 0; j < multiAssets.len(); j++) {
        const policy = multiAssets.get(j);
        const policyAssets = value.multiasset().get(policy);
        const assetNames = policyAssets.keys();
        for (let k = 0; k < assetNames.len(); k++) {
          const policyAsset = assetNames.get(k);
          const quantity = policyAssets.get(policyAsset);
          const asset = Buffer.from(policy.to_bytes()).toString("hex") + Buffer.from(policyAsset.name()).toString("hex");
          const _policy = asset.slice(0, 56);
          const _name = asset.slice(56);
          const fingerprint = new AssetFingerprint(Buffer.from(_policy, "hex"), Buffer.from(_name, "hex")).fingerprint();
          assets.push({
            unit: asset,
            quantity: quantity.to_str(),
            policy: _policy,
            name: HexToAscii(_name),
            fingerprint,
          });
        }
      }
    }
    return assets;
  }

  async getUserTokenAssets(tokenPolicy) {
    const assets = await this.getUserAssets();
    const utxoWithToken = assets.map(utxo => {
      const assets = utxo.amount;
      for (let asset of assets) {
        if (asset.unit && asset.unit === tokenPolicy) {
          return {
            utxo: utxo.txHash,
            name: asset.name,
            txId: utxo.txId,
            assets: utxo.amount,
            quantity: asset.quantity,
          };
        }
      }
      return null;
    }).filter(utxo => utxo);

    return utxoWithToken;
  }

  async getUserAssets(assetName = null) {
    let utxosHex = await this.walletApi.getUtxos();
    const utxos = utxosHex.map((utxo) => this.sl.TransactionUnspentOutput.from_bytes(Buffer.from(utxo, "hex")));
    const assets = utxos.map(utxo => {
      const assets = this.detailUtxoToAssets(utxo);
      const result = {
        txHash: Buffer.from(utxo.input().transaction_id().to_bytes(), "hex").toString("hex"),
        txId: utxo.input().index(),
        amount: assetName ? assets.filter(a => a.name === assetName) : assets,
      };

      return result;
    });
    return assets;
  }

  constructor(walletName) {
    this.apiKey = blockfrostApiKey;
    this.walletName = walletName;
    this.walletProvider = window.cardano[walletName];;
  }

  async init() {
    this.sl = await Cardano();
    this.walletApi = await this.walletProvider.enable();
    const isEnabled = await this.walletProvider.isEnabled();
    if (isEnabled && this.walletApi) {
      storageService.setWalletName(this.walletName);
      window.cardanoApi = this;
      try {
        const address = await this.getAddress();
        return address;
      } catch(err){
        showError({message: "Your wallet is empty, can't connect!"});
      }
    }
  }

  disconnect() {
    window.cardanoApi = null;
    storageService.clearWalletName();
  }

  async isInstalled() {
    return !!this.walletProvider;
  }

  async isEnabled() {
    try {
      const res = await this.walletProvider.isEnabled();
      return res;
    } catch (err) {
      return false;
    }
  }

  async getCollateralUtxo() {
    return await this.walletApi.experimental.getCollateral();
  }

  async getCollateral() {
    try {
      const collateralBytes = (await this.walletApi.experimental.getCollateral())[0];
      if (collateralBytes == undefined) {
        console.log("getCollateral(): No collateral");
        return {};
      }
      const collateral = this.sl.TransactionUnspentOutput.from_bytes(
        Buffer.from(collateralBytes, "hex")
      );

      let transaction_id = Buffer.from(
        collateral.input().transaction_id().to_bytes(),
        "hex"
      ).toString("hex");

      return {
        collateral: collateral.output().amount().coin().to_str(),
        transaction_id,
      };
    } catch (err) {
      console.log("error in getCollateral method:", err);
      return {};
    }
  }

  async blockFrostReq(URL) {
    try {
      const configBuilder = {
        headers: {
          project_id: process.env.NEXT_PUBLIC_REACT_BLOCKFRST_API,
        },
      };
      const response = await axios.get(URL, configBuilder);
      return response.data;
    } catch (error) {
      return error;
    }
  }

  // detailUtxoToAssets(utxo) {
  //   let value = utxo.output().amount();
  //   const assets = [];
  //   assets.push({
  //     unit: "lovelace",
  //     quantity: value.coin().to_str(),
  //   });
  //   if (value.multiasset()) {
  //     const multiAssets = value.multiasset().keys();
  //     for (let j = 0; j < multiAssets.len(); j++) {
  //       const policy = multiAssets.get(j);
  //       const policyAssets = value.multiasset().get(policy);
  //       const assetNames = policyAssets.keys();
  //       for (let k = 0; k < assetNames.len(); k++) {
  //         const policyAsset = assetNames.get(k);
  //         const quantity = policyAssets.get(policyAsset);
  //         const asset =
  //           Buffer.from(policy.to_bytes()).toString("hex") +
  //           Buffer.from(policyAsset.name()).toString("hex");
  //         const _policy = asset.slice(0, 56);
  //         const _name = asset.slice(56);
  //         const fingerprint = new AssetFingerprint(
  //           Buffer.from(_policy, "hex"),
  //           Buffer.from(_name, "hex")
  //         ).fingerprint();
  //         assets.push({
  //           unit: asset,
  //           quantity: quantity.to_str(),
  //           policy: _policy,
  //           name: HexToAscii(_name),
  //           fingerprint,
  //         });
  //       }
  //     }
  //   }

  //   return assets;
  // }

  async getUtxoOfToken(token_policy) {
    let utxo_with_token = [];
    const all_utxos = await this.walletApi.getUtxos();
    let Utxos = all_utxos.map((u) =>
      this.sl.TransactionUnspentOutput.from_bytes(Buffer.from(u, "hex"))
    );
    let UTXOS = [];
    for (let utxo of Utxos) {
      let assets = this.detailUtxoToAssets(utxo);

      UTXOS.push({
        txHash: Buffer.from(
          utxo.input().transaction_id().to_bytes(),
          "hex"
        ).toString("hex"),
        txId: utxo.input().index(),
        amount: assets,
      });
    }

    for (let utxo of UTXOS) {
      let assets = utxo["amount"];
      let lovelace_quantity = 0;
      for (let asset of assets) {
        if (asset["unit"] === "lovelace") {
          lovelace_quantity = asset["quantity"];
        }
        if (asset.hasOwnProperty("policy")) {
          if (asset["policy"] === token_policy) {
            utxo_with_token.push({
              utxo: utxo["txHash"],
              name: asset["name"],
              txId: utxo["txId"],
              assets: utxo["amount"],
              lovelace: lovelace_quantity,
            });
          }
        }
      }
    }
    console.log({ utxo_with_token });
    const result = [];
    const map = new Map();
    for (const item of utxo_with_token) {
      if (!map.has(item.utxo)) {
        map.set(item.utxo, true);
        result.push(item);
      }
    }
    console.log({ result });
    const data = result[0];

    if (data) {
      return data;
    }
    throwError(`You don't have any tickets in the wallet.`);
  }

  async initTx(protocolParameters) {
    const cfg = this.sl.TransactionBuilderConfigBuilder.new()
      .fee_algo(
        this.sl.LinearFee.new(
          this.sl.BigNum.from_str(protocolParameters.linearFee.minFeeA),
          this.sl.BigNum.from_str(protocolParameters.linearFee.minFeeB)
        )
      )
      .pool_deposit(this.sl.BigNum.from_str(protocolParameters.poolDeposit))
      .key_deposit(this.sl.BigNum.from_str(protocolParameters.keyDeposit))
      .max_tx_size(protocolParameters.maxTxSize)
      .max_value_size(protocolParameters.maxValSize)
      .coins_per_utxo_word(
        this.sl.BigNum.from_str(protocolParameters.coinsPerUtxoWord)
      )
      .build();

    const txBuilder = this.sl.TransactionBuilder.new(cfg);
    const datums = this.sl.PlutusList.new();
    const outputs = this.sl.TransactionOutputs.new();
    return { txBuilder, datums, outputs };
  }
  getUtxosdetail = async (utxo) => {
    try {
      const latestURL = `https://cardano-${process.env.NEXT_PUBLIC_REACT_NETWORK}.blockfrost.io/api/v0/txs/${utxo}#0/utxos`;
      const l = await this.blockFrostReq(latestURL);
      return l;
    } catch (e) {
      console.log(e);
    }
  };
  getParams = async () => {
    try {
      const latestURL = `https://cardano-${process.env.NEXT_PUBLIC_REACT_NETWORK}.blockfrost.io/api/v0/blocks/latest`;
      const paramsURL = `https://cardano-${process.env.NEXT_PUBLIC_REACT_NETWORK}.blockfrost.io/api/v0/epochs/latest/parameters`;

      const p = await this.blockFrostReq(paramsURL);
      const l = await this.blockFrostReq(latestURL);
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
    } catch (e) { }
  };
  harden(num) {
    return 0x80000000 + num;
  }

  addOutputToTx = async (nftTokenName) => {
    const backend_utxo = await cardanoService.getBackendUtxos(nftTokenName);
    console.log(backend_utxo);
    const assetsValueBackendUtxo = this.sl.Value.new(
      this.sl.BigNum.from_str(backend_utxo.lovelaces)
    );
    const backendAssets = this.sl.Assets.new();
    const assetName = this.sl.AssetName.new(
      Buffer.from(process.env.NEXT_PUBLIC_REACT_BACKEND_UTXO_ASSET_NAME, "hex")
    );
    backendAssets.insert(
      assetName,
      this.sl.BigNum.from_str(backend_utxo.aada_amount)
    );

    const assetsToSendFromBackedUtxo = this.sl.MultiAsset.new();

    assetsToSendFromBackedUtxo.insert(
      this.sl.ScriptHash.from_bytes(
        Buffer.from(process.env.NEXT_PUBLIC_REACT_BACKEND_UTXO_POLICY, "hex")
      ),
      backendAssets
    );
    assetsValueBackendUtxo.set_multiasset(assetsToSendFromBackedUtxo);
    const backendInputUtxo = this.sl.TransactionInput.new(
      this.sl.TransactionHash.from_bytes(
        Buffer.from(String(backend_utxo.utxo_hash), "hex")
      ),
      parseInt(backend_utxo.utxo_index)
    );

    const backendUnspendOutput = this.sl.TransactionUnspentOutput.new(
      backendInputUtxo,
      this.sl.TransactionOutput.new(
        this.sl.Address.from_bech32(
          process.env.NEXT_PUBLIC_REACT_safeWalletAddress
        ),
        assetsValueBackendUtxo
      )
    );

    const output = this.sl.TransactionOutput.new(
      this.sl.Address.from_bech32(await this.getAddress()),
      assetsValueBackendUtxo
    );

    return { backendUnspendOutput, output };
  };

  getAllUtxosDetail = async () => {
    let Utxos = [];
    try {
      const rawUtxos = await this.getUtxosHex();

      for (const rawUtxo of rawUtxos) {
        const utxo = this.sl.TransactionUnspentOutput.from_bytes(
          Buffer.from(rawUtxo, "hex")
        );
        const input = utxo.input();
        const txid = Buffer.from(
          input.transaction_id().to_bytes(),
          "utf8"
        ).toString("hex");
        const txindx = input.index();
        const output = utxo.output();
        const amount = output.amount().coin().to_str(); // ADA amount in lovelace
        const multiasset = output.amount().multiasset();
        let multiAssetStr = "";

        if (multiasset) {
          const keys = multiasset.keys(); // policy Ids of thee multiasset
          const N = keys.len();
          // console.log(`${N} Multiassets in the UTXO`)

          for (let i = 0; i < N; i++) {
            const policyId = keys.get(i);
            const policyIdHex = Buffer.from(
              policyId.to_bytes(),
              "utf8"
            ).toString("hex");
            // console.log(`policyId: ${policyIdHex}`)
            const assets = multiasset.get(policyId);
            const assetNames = assets.keys();
            const K = assetNames.len();
            // console.log(`${K} Assets in the Multiasset`)

            for (let j = 0; j < K; j++) {
              const assetName = assetNames.get(j);
              const assetNameString = Buffer.from(
                assetName.name(),
                "utf8"
              ).toString();
              const assetNameHex = Buffer.from(
                assetName.name(),
                "utf8"
              ).toString("hex");
              // console.log(`Asset Name: ${assetNameHex}`)
              const multiassetAmt = multiasset.get_asset(policyId, assetName);
              multiAssetStr += `+ ${multiassetAmt.to_str()} + ${policyIdHex}.${assetNameHex} (${assetNameString})`;
              // console.log(assetNameString)
            }
          }
        }

        const obj = {
          txid: txid,
          txindx: txindx,
          amount: amount,
          str: `${txid} #${txindx} = ${amount}`,
          multiAssetStr: multiAssetStr,
          TransactionUnspentOutput: utxo,
        };
        Utxos.push(obj);
        // console.log(`utxo: ${str}`)
      }

      return Utxos;
    } catch (err) {
      console.log(err);
    }
  };

  getSWAPTokenQuantity = async (address, tokenName) => {
    // return quantity of token_policy
    try {
      const latestURL = `https://cardano-${process.env.NEXT_PUBLIC_REACT_NETWORK}.blockfrost.io/api/v0/addresses/${address}/extended`;
      // console.log(latestURL, process.env.NEXT_PUBLIC_REACT_BLOCKFRST_API);
      const configBuilder = {
        headers: {
          project_id: process.env.NEXT_PUBLIC_REACT_BLOCKFRST_API,
        },
      };
      const response = await axios.get(latestURL, configBuilder);
      let quantity = "";
      if (response.data.hasOwnProperty("amount")) {
        let amounts = response.data.amount;
        for (let amount of amounts) {
          if (amount.hasOwnProperty("unit")) {
            if (amount.unit.includes(tokenName)) {
              quantity = amount.quantity;
            }
          }
        }
      }
      return quantity;
    } catch (err) {
      console.log(err.response, err.response.status);
      return "";
    }
  };

  async claim_aada() {
    const token_policy = process.env.NEXT_PUBLIC_REACT_NFT_POLICY;
    const safeAddress = process.env.NEXT_PUBLIC_REACT_safeWalletAddress;
    const userAddr = await this.getAddress();
    const protocolParameters = await this.getParams();
    const { txBuilder, datums, outputs } = await this.initTx(
      protocolParameters
    );
    const all_utxo_with_token = await this.getUtxoOfToken(token_policy);
    const nftTokenName = all_utxo_with_token["name"];
    const element = all_utxo_with_token;

    const ts = this.sl.TransactionUnspentOutputs.new();
    const assetsNftsToSend = this.sl.MultiAsset.new();
    const utxoAssets = element["assets"];

    utxoAssets.forEach((element) => {
      if (element.hasOwnProperty("policy")) {
        const assets = this.sl.Assets.new();
        const policyStr = element["policy"];
        const assetName = this.sl.AssetName.new(
          Buffer.from(element["name"], "utf-8")
        );
        assets.insert(assetName, this.sl.BigNum.from_str(element["quantity"]));

        if (policyStr === token_policy && element["name"] === nftTokenName) {
          assetsNftsToSend.insert(
            this.sl.ScriptHash.from_bytes(Buffer.from(policyStr, "hex")),
            assets
          );
        }
      }
    });

    const userOutput = this.sl.TransactionOutputBuilder.new()
      .with_address(this.sl.Address.from_bech32(safeAddress))
      .next()
      .with_asset_and_min_required_coin(
        assetsNftsToSend,
        this.sl.BigNum.from_str(protocolParameters.coinsPerUtxoWord)
      )
      .build();
    outputs.add(userOutput);

    const { backendUnspendOutput, output } = await this.addOutputToTx(
      nftTokenName
    );
    outputs.add(output);

    ts.add(backendUnspendOutput);

    for (let i = 0; i < outputs.len(); i++) {
      txBuilder.add_output(outputs.get(i));
    }

    const all_utxos = await this.getUtxosHex();
    all_utxos.forEach((element) => {
      ts.add(
        this.sl.TransactionUnspentOutput.from_bytes(Buffer.from(element, "hex"))
      );
    });
    txBuilder.add_inputs_from(ts, 3);
    txBuilder.add_change_if_needed(this.sl.Address.from_bech32(userAddr));

    const txBody = txBuilder.build();
    const txBodyString = Buffer.from(txBody.to_bytes()).toString("hex");
    const txWitnessSetString = await cardanoService.vkeyWitness(txBodyString);
    const transactionWitnessSet = this.sl.TransactionWitnessSet.from_bytes(
      Buffer.from(txWitnessSetString, "hex")
    );

    const emptyTransactionWitnessSet = this.sl.TransactionWitnessSet.new();
    const transaction = this.sl.Transaction.new(
      txBody,
      emptyTransactionWitnessSet,
      undefined
    );
    const transaction_ = Buffer.from(transaction.to_bytes()).toString("hex");
    const witnesses = await this.walletApi.signTx(transaction_, true);
    const txWitnesses = transaction.witness_set();
    const txVkeys = txWitnesses.vkeys();
    const addWitnesses = this.sl.TransactionWitnessSet.from_bytes(
      Buffer.from(witnesses, "hex")
    );

    const addVkeys = addWitnesses.vkeys();
    const totalVkeys = this.sl.Vkeywitnesses.new();

    if (txVkeys) {
      for (let i = 0; i < txVkeys.len(); i++) {
        totalVkeys.add(txVkeys.get(i));
      }
    }

    console.log(addVkeys.len());
    if (addVkeys) {
      for (let i = 0; i < addVkeys.len(); i++) {
        totalVkeys.add(addVkeys.get(i));
      }
    }

    const backendVKeys = transactionWitnessSet.vkeys();
    console.log(backendVKeys.len());
    for (let i = 0; i < backendVKeys.len(); i++) {
      totalVkeys.add(backendVKeys.get(i));
    }
    const totalWitnesses = this.sl.TransactionWitnessSet.new();
    totalWitnesses.set_vkeys(totalVkeys);

    const signedTx = await this.sl.Transaction.new(
      transaction.body(),
      totalWitnesses
    );

    const txHex = Buffer.from(signedTx.to_bytes()).toString("hex");

    try {
      const tx_hash = await this.submitTxWallet(txHex);
      console.log("tx_hash :", tx_hash);
      return "Transaction was submitted";
    } catch (e) {
      return { error: JSON.stringify(e) };
    }
  }

  async signCLITx(cborHex) {
    if (!this.isEnabled()) throw ERROR.NOT_CONNECTED;
    try {
      let networkId = await this.getNetworkId();
      const myAddress = await this.getHexAddress();
      const txCli = this.sl.Transaction.from_bytes(Buffer.from(cborHex, "hex"));
      const txBody = txCli.body();
      const witnessSet = txCli.witness_set();
      witnessSet.vkeys()?.free();
      const paymentKeyHash = this.sl.BaseAddress.from_address(
        this.sl.Address.from_bytes(Buffer.from(myAddress, "hex"))
      )
        .payment_cred()
        .to_keyhash();
      const requiredSigners = this.sl.Ed25519KeyHashes.new();
      requiredSigners.add(paymentKeyHash);
      txBody.set_required_signers(requiredSigners);
      const tx = this.sl.Transaction.new(txBody, witnessSet);
      const encodedTx = Buffer.from(tx.to_bytes()).toString("hex");
      const encodedTxVkeyWitnesses = await this.walletApi.signTx(encodedTx, true);
      const txVkeyWitnesses = this.sl.TransactionWitnessSet.from_bytes(
        Buffer.from(encodedTxVkeyWitnesses, "hex")
      );
      witnessSet.set_vkeys(txVkeyWitnesses.vkeys());
      const txSigned = this.sl.Transaction.new(
        tx.body(),
        witnessSet,
        tx.auxiliary_data()
      );
      const encodedSignedTx = Buffer.from(txSigned.to_bytes()).toString("hex");
      const txHash = await this.submitTxWallet(encodedSignedTx);
      return { error: false, tx: txHash };
    } catch (e) {
      return { error: JSON.stringify(e), tx: "" };
    }
  }

  async enable() {
    try {
      // return await this.Nami.enable();
      const api = await this.init();
      return api;
    } catch (error) {
      throw error;
    }
    // if (!(await this.Nami.isEnabled())) {
    // }
  }

  async createSwapTx() {
    const asset = process.env.NEXT_PUBLIC_SWAP_TOKEN_POLICY;
    const _policy = asset.slice(0, 56);
    const _name = asset.slice(56);
    const userAddr = await this.getAddress();
    const protocolParameters = await this.getParams();
    const { txBuilder, outputs } = await this.initTx(protocolParameters);

    // TODO does below line finds unique policy it has to find unique policy+tokenname
    const quantity = await this.getSWAPTokenQuantity(userAddr, asset);
    const assetsNftsToSend = this.sl.MultiAsset.new();
    const assets = this.sl.Assets.new();
    const assetName = this.sl.AssetName.new(
      Buffer.from(_name, "hex") // It will be hex always
    );
    assets.insert(assetName, this.sl.BigNum.from_str(quantity));
    assetsNftsToSend.insert(
      this.sl.ScriptHash.from_bytes(Buffer.from(_policy, "hex")),
      assets
    );

    const userOutput = this.sl.TransactionOutputBuilder.new()
      .with_address(
        this.sl.Address.from_bech32(process.env.NEXT_PUBLIC_SWAP_SENT_ADDRESS)
      )
      .next()
      .with_asset_and_min_required_coin(
        assetsNftsToSend,
        this.sl.BigNum.from_str(protocolParameters.coinsPerUtxoWord)
      )
      .build();

    outputs.add(userOutput);

    for (let i = 0; i < outputs.len(); i++) {
      txBuilder.add_output(outputs.get(i));
    }

    let ts = this.sl.TransactionUnspentOutputs.new();

    let all_utxo = await this.getAllUtxosDetail();
    console.table(all_utxo);
    for (const utxo of all_utxo) {
      ts.add(utxo.TransactionUnspentOutput);
    }

    txBuilder.add_inputs_from(ts, 3);
    console.log("get_total_input:", txBuilder.get_total_input());

    txBuilder.add_change_if_needed(this.sl.Address.from_bech32(userAddr));

    const tx = Loader.Cardano.Transaction.new(
      txBuilder.build(),
      Loader.Cardano.TransactionWitnessSet.new()
    );

    const encodedTx = Buffer.from(tx.to_bytes()).toString("hex");
    try {
      const encodedTxVkeyWitnesses = await this.walletApi.signTx(encodedTx, true);
      const txVkeyWitnesses = this.sl.TransactionWitnessSet.from_bytes(
        Buffer.from(encodedTxVkeyWitnesses, "hex")
      );
      const witnessSet = this.sl.TransactionWitnessSet.new();
      witnessSet.set_vkeys(txVkeyWitnesses.vkeys());
      const txSigned = this.sl.Transaction.new(tx.body(), witnessSet);
      const encodedSignedTx = Buffer.from(txSigned.to_bytes()).toString("hex");
      const txHash = await this.submitTxWallet(encodedSignedTx);;
      let response = { error: false, tx: txHash };
      console.log(response);
      return response;
    } catch (ex) {
      console.log(ex);
      return { error: JSON.stringify(ex), tx: "" };
    }

  }

  async getUsedAddresses() {
    const addresses = await this.walletApi.getUsedAddresses();
    const addressesHex = addresses.map(addr => Buffer.from(addr, "hex"));
    const baseAdresses = addressesHex.map(addrHex => this.sl.BaseAddress.from_address(this.sl.Address.from_bytes(addrHex)));
    const addressesResult = baseAdresses.filter(baseAdresses => baseAdresses).map(baseAddress => baseAddress.to_address().to_bech32());
    return addressesResult;
  }

  async getAddress() {
    if (!this.isEnabled()) {
      throw ERROR.NOT_CONNECTED;
    }
    const addressHex = Buffer.from(
      (await this.walletApi.getUsedAddresses())[0],
      "hex"
    );
    const address = this.sl.BaseAddress.from_address(
      this.sl.Address.from_bytes(addressHex)
    )
      .to_address()
      .to_bech32();

    return address;
  }

  async getHexAddress() {
    const addresses = await this.walletApi.getUsedAddresses();
    const address = addresses[0];
    const addressHex = Buffer.from(address, "hex");
    return addressHex;
  }

  async getNetworkId() {
    if (!this.isEnabled()) throw ERROR.NOT_CONNECTED;
    let networkId = await this.walletApi.getNetworkId();
    return {
      id: networkId,
      network: networkId === 1 ? "mainnet" : "testnet",
    };
  }

  async getBalance() {
    if (!this.isEnabled()) {
      // todo here
      // await this.enable();
    }
    let networkId = await this.getNetworkId();
    let protocolParameter = await this._getProtocolParameter(networkId.id);

    const valueCBOR = await this.walletApi.getBalance();
    const value = this.sl.Value.from_bytes(Buffer.from(valueCBOR, "hex"));

    const utxos = await this.walletApi.getUtxos();
    const parsedUtxos = utxos.map((utxo) =>
      this.sl.TransactionUnspentOutput.from_bytes(Buffer.from(utxo, "hex"))
    );

    let countedValue = this.sl.Value.new(this.sl.BigNum.from_str("0"));
    parsedUtxos.forEach((element) => {
      countedValue = countedValue.checked_add(element.output().amount());
    });

    const minUtxo = this.sl.BigNum.from_str(protocolParameter.minUtxo);
    const minAda = this.sl.min_ada_required(
      countedValue,
      false,
      this.sl.BigNum.from_str(protocolParameter.minUtxo)
    );
    const availableAda = countedValue.coin().checked_sub(minAda);
    const lovelace = availableAda.to_str();
    const assets = [];
    if (value.multiasset()) {
      const multiAssets = value.multiasset().keys();
      for (let j = 0; j < multiAssets.len(); j++) {
        const policy = multiAssets.get(j);
        const policyAssets = value.multiasset().get(policy);
        const assetNames = policyAssets.keys();
        for (let k = 0; k < assetNames.len(); k++) {
          const policyAsset = assetNames.get(k);
          const quantity = policyAssets.get(policyAsset);
          const asset =
            Buffer.from(policy.to_bytes(), "hex").toString("hex") +
            Buffer.from(policyAsset.name(), "hex").toString("hex");
          const _policy = asset.slice(0, 56);
          const _name = asset.slice(56);
          const fingerprint = new AssetFingerprint(
            Buffer.from(_policy, "hex"),
            Buffer.from(_name, "hex")
          ).fingerprint();
          assets.push({
            unit: asset,
            quantity: quantity.to_str(),
            policy: _policy,
            name: HexToAscii(_name),
            fingerprint,
          });
        }
      }
    }
    return { lovelace, assets };
  }

  getApiKey(networkId) {
    if (networkId == 0) {
      return this.apiKey[0];
    } else {
      return this.apiKey[1];
    }
  }

  async registerPolicy(policy) {
    fetch(`https://pool.pm/register/policy/${policy.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "all",
        scripts: [
          {
            keyHash: policy.paymentKeyHash,
            type: "sig",
          },
          { slot: policy.ttl, type: "before" },
        ],
      }),
    })
      .then((res) => res.json())
      .then(console.log);
  }

  async getUtxos(utxos) {
    let Utxos = utxos.map((u) =>
      this.sl.TransactionUnspentOutput.from_bytes(Buffer.from(u, "hex"))
    );
    let UTXOS = [];
    for (let utxo of Utxos) {
      let assets = this._utxoToAssets(utxo);

      UTXOS.push({
        txHash: Buffer.from(
          utxo.input().transaction_id().to_bytes(),
          "hex"
        ).toString("hex"),
        txId: utxo.input().index(),
        amount: assets,
      });
    }
    return UTXOS;
  }

  async getUtxosHex() {
    return await this.walletApi.getUtxos();
  }

  async transaction({
    PaymentAddress = "",
    recipients = [],
    metadata = null,
    metadataHash = null,
    addMetadata = true,
    utxosRaw = [],
    networkId = 0,
    ttl = 3600,
    multiSig = false,
  }) {
    let utxos = utxosRaw.map((u) =>
      this.sl.TransactionUnspentOutput.from_bytes(Buffer.from(u, "hex"))
    );
    let protocolParameter = await this._getProtocolParameter(networkId);
    let mintedAssetsArray = [];
    let outputs = this.sl.TransactionOutputs.new();

    let minting = 0;
    let outputValues = {};
    let costValues = {};
    for (let recipient of recipients) {
      let lovelace = Math.floor((recipient.amount || 0) * 1000000).toString();
      let ReceiveAddress = recipient.address;
      let multiAsset = this._makeMultiAsset(recipient?.assets || []);
      let mintedAssets = this._makeMintedAssets(recipient?.mintedAssets || []);

      let outputValue = this.sl.Value.new(this.sl.BigNum.from_str(lovelace));
      let minAdaMint = this.sl.Value.new(this.sl.BigNum.from_str("0"));

      if ((recipient?.assets || []).length > 0) {
        outputValue.set_multiasset(multiAsset);
        let minAda = this.sl.min_ada_required(
          outputValue,
          false,
          this.sl.BigNum.from_str(protocolParameter.minUtxo)
        );

        if (this.sl.BigNum.from_str(lovelace).compare(minAda) < 0)
          outputValue.set_coin(minAda);
      }
      (recipient?.mintedAssets || []).map((asset) => {
        minting += 1;
        mintedAssetsArray.push({
          ...asset,
          address: recipient.address,
        });
      });

      if (parseInt(outputValue.coin().to_str()) > 0) {
        outputValues[recipient.address] = outputValue;
      }
      if ((recipient.mintedAssets || []).length > 0) {
        minAdaMint = this.sl.min_ada_required(
          mintedAssets,
          false,
          this.sl.BigNum.from_str(protocolParameter.minUtxo)
        );

        let requiredMintAda = this.sl.Value.new(this.sl.BigNum.from_str("0"));
        requiredMintAda.set_coin(minAdaMint);
        if (outputValue.coin().to_str() == 0) {
          outputValue = requiredMintAda;
        } else {
          outputValue = outputValue.checked_add(requiredMintAda);
        }
      }
      if (ReceiveAddress != PaymentAddress)
        costValues[ReceiveAddress] = outputValue;
      outputValues[ReceiveAddress] = outputValue;
      if (parseInt(outputValue.coin().to_str()) > 0) {
        outputs.add(
          this.sl.TransactionOutput.new(
            this.sl.Address.from_bech32(ReceiveAddress),
            outputValue
          )
        );
      }
    }
    let RawTransaction = null;
    if (minting > 0) {
      outputValues[PaymentAddress] = this.sl.Value.new(
        this.sl.BigNum.from_str("0")
      );

      RawTransaction = await this._txBuilderMinting({
        PaymentAddress: PaymentAddress,
        Utxos: utxos,
        Outputs: outputs,
        mintedAssetsArray: mintedAssetsArray,
        outputValues: outputValues,
        ProtocolParameter: protocolParameter,
        metadata: metadata,
        metadataHash: metadataHash,
        addMetadata: addMetadata,
        multiSig: multiSig,
        ttl: ttl,
        costValues: costValues,
      });
    } else {
      RawTransaction = await this._txBuilder({
        PaymentAddress: PaymentAddress,
        Utxos: utxos,
        Outputs: outputs,
        ProtocolParameter: protocolParameter,
        Metadata: metadata,

        Delegation: null,
      });
    }
    return Buffer.from(RawTransaction, "hex").toString("hex");
  }

  async createLockingPolicyScript(address, networkId, expirationTime) {
    var now = new Date();

    const protocolParameters = await this._getProtocolParameter(networkId);

    const slot = parseInt(protocolParameters.slot);
    const duration = expirationTime.getTime() - now.getTime();

    const ttl = slot + duration;

    const paymentKeyHash = this.sl.BaseAddress.from_address(
      this.sl.Address.from_bytes(Buffer.from(address, "hex"))
    )
      .payment_cred()
      .to_keyhash();

    const nativeScripts = this.sl.NativeScripts.new();
    const script = this.sl.ScriptPubkey.new(paymentKeyHash);
    const nativeScript = this.sl.NativeScript.new_script_pubkey(script);
    const lockScript = this.sl.NativeScript.new_timelock_expiry(
      this.sl.TimelockExpiry.new(ttl)
    );
    nativeScripts.add(nativeScript);
    nativeScripts.add(lockScript);
    const finalScript = this.sl.NativeScript.new_script_all(
      this.sl.ScriptAll.new(nativeScripts)
    );
    const policyId = Buffer.from(
      this.sl.ScriptHash.from_bytes(finalScript.hash().to_bytes()).to_bytes(),
      "hex"
    ).toString("hex");
    return {
      id: policyId,
      script: Buffer.from(finalScript.to_bytes()).toString("hex"),
      paymentKeyHash: Buffer.from(paymentKeyHash.to_bytes(), "hex").toString(
        "hex"
      ),
      ttl,
    };
  }

  async signTx(transaction, partialSign = false) {
    if (this.isEnabled()) {
      return await this.walletApi.signTx(transaction, partialSign);
    }
    throw ERROR.NOT_CONNECTED;
  }

  async signData(string) {
    let address = await getAddressHex();
    let coseSign1Hex = await Nami.signData(
      address,
      Buffer.from(string, "ascii").toString("hex")
    );
    return coseSign1Hex;
  }

  hashMetadata(metadata) {
    let aux = this.sl.AuxiliaryData.new();

    const generalMetadata = this.sl.GeneralTransactionMetadata.new();
    Object.entries(metadata).map(([MetadataLabel, Metadata]) => {
      generalMetadata.insert(
        this.sl.BigNum.from_str(MetadataLabel),
        this.sl.encode_json_str_to_metadatum(JSON.stringify(Metadata), 0)
      );
    });

    aux.set_metadata(generalMetadata);

    const metadataHash = this.sl.hash_auxiliary_data(aux);
    return Buffer.from(metadataHash.to_bytes(), "hex").toString("hex");
  }

  _makeMintedAssets(mintedAssets) {
    let AssetsMap = {};

    for (let asset of mintedAssets) {
      let assetName = asset.assetName;
      let quantity = asset.quantity;
      if (!Array.isArray(AssetsMap[asset.policyId])) {
        AssetsMap[asset.policyId] = [];
      }
      AssetsMap[asset.policyId].push({
        unit: Buffer.from(assetName, "ascii").toString("hex"),
        quantity: quantity,
      });
    }
    let multiAsset = this.sl.MultiAsset.new();

    for (const policy in AssetsMap) {
      const ScriptHash = this.sl.ScriptHash.from_bytes(
        Buffer.from(policy, "hex")
      );
      const Assets = this.sl.Assets.new();

      const _assets = AssetsMap[policy];

      for (const asset of _assets) {
        const AssetName = this.sl.AssetName.new(Buffer.from(asset.unit, "hex"));
        const BigNum = this.sl.BigNum.from_str(asset.quantity);

        Assets.insert(AssetName, BigNum);
      }

      multiAsset.insert(ScriptHash, Assets);
    }
    const value = this.sl.Value.new(this.sl.BigNum.from_str("0"));

    value.set_multiasset(multiAsset);
    return value;
  }

  _makeMultiAsset(assets) {
    let AssetsMap = {};
    for (let asset of assets) {
      let [policy, assetName] = asset.unit.split(".");
      let quantity = asset.quantity;
      if (!Array.isArray(AssetsMap[policy])) {
        AssetsMap[policy] = [];
      }
      AssetsMap[policy].push({
        unit: Buffer.from(assetName, "ascii").toString("hex"),
        quantity: quantity,
      });
    }

    let multiAsset = this.sl.MultiAsset.new();

    for (const policy in AssetsMap) {
      const ScriptHash = this.sl.ScriptHash.from_bytes(
        Buffer.from(policy, "hex")
      );
      const Assets = this.sl.Assets.new();

      const _assets = AssetsMap[policy];

      for (const asset of _assets) {
        const AssetName = this.sl.AssetName.new(Buffer.from(asset.unit, "hex"));
        const BigNum = this.sl.BigNum.from_str(asset.quantity.toString());

        Assets.insert(AssetName, BigNum);
      }

      multiAsset.insert(ScriptHash, Assets);
    }

    return multiAsset;
  }

  _utxoToAssets(utxo) {
    let value = utxo.output().amount();
    const assets = [];
    assets.push({
      unit: "lovelace",
      quantity: value.coin().to_str(),
    });
    if (value.multiasset()) {
      const multiAssets = value.multiasset().keys();
      for (let j = 0; j < multiAssets.len(); j++) {
        const policy = multiAssets.get(j);
        const policyAssets = value.multiasset().get(policy);
        const assetNames = policyAssets.keys();
        for (let k = 0; k < assetNames.len(); k++) {
          const policyAsset = assetNames.get(k);
          const quantity = policyAssets.get(policyAsset);
          const asset =
            Buffer.from(policy.to_bytes()).toString("hex") +
            "." +
            Buffer.from(policyAsset.name()).toString("ascii");

          assets.push({
            unit: asset,
            quantity: quantity.to_str(),
          });
        }
      }
    }
    return assets;
  }

  async _txBuilderMinting({
    PaymentAddress,
    Utxos,
    Outputs,
    ProtocolParameter,
    mintedAssetsArray = [],

    outputValues = {},
    metadata = null,
    metadataHash = null,
    addMetadata = true,
    ttl = 3600,
    multiSig = false,
    costValues = {},
  }) {
    const MULTIASSET_SIZE = 5000;
    const VALUE_SIZE = 5000;
    const totalAssets = 0;

    CoinSelection.setProtocolParameters(
      ProtocolParameter.minUtxo.toString(),
      ProtocolParameter.linearFee.minFeeA.toString(),
      ProtocolParameter.linearFee.minFeeB.toString(),
      ProtocolParameter.maxTxSize.toString()
    );
    const selection = await CoinSelection.randomImprove(
      Utxos,
      Outputs,
      20 + totalAssets
    );

    const nativeScripts = this.sl.NativeScripts.new();
    let mint = this.sl.Mint.new();

    let mintedAssetsDict = {};
    let assetsDict = {};
    for (let asset of mintedAssetsArray) {
      if (typeof assetsDict[asset.assetName] == "undefined") {
        assetsDict[asset.assetName] = {};
        assetsDict[asset.assetName].quantity = 0;
        assetsDict[asset.assetName].policyScript = asset.policyScript;
      }
      assetsDict[asset.assetName].quantity =
        assetsDict[asset.assetName].quantity + parseInt(asset.quantity);
    }

    Object.entries(assetsDict).map(([assetName, asset]) => {
      const mintAssets = this.sl.MintAssets.new();
      mintAssets.insert(
        this.sl.AssetName.new(Buffer.from(assetName)),
        this.sl.Int.new(this.sl.BigNum.from_str(asset.quantity.toString()))
      );

      if (typeof mintedAssetsDict[asset.policyScript] == "undefined") {
        mintedAssetsDict[asset.policyScript] = this.sl.MintAssets.new();
      }
      mintedAssetsDict[asset.policyScript].insert(
        this.sl.AssetName.new(Buffer.from(assetName)),
        this.sl.Int.new(this.sl.BigNum.from_str(asset.quantity.toString()))
      );
    });

    for (let asset of mintedAssetsArray) {
      const multiAsset = this.sl.MultiAsset.new();
      const mintedAssets = this.sl.Assets.new();

      const policyScript = this.sl.NativeScript.from_bytes(
        Buffer.from(asset.policyScript, "hex")
      );
      nativeScripts.add(policyScript);

      mintedAssets.insert(
        this.sl.AssetName.new(Buffer.from(asset.assetName)),
        this.sl.BigNum.from_str(asset.quantity.toString())
      );

      multiAsset.insert(
        this.sl.ScriptHash.from_bytes(
          policyScript.hash(this.sl.ScriptHashNamespace.NativeScript).to_bytes()
        ),
        mintedAssets
      );
      const mintedValue = this.sl.Value.new(this.sl.BigNum.from_str("0"));
      mintedValue.set_multiasset(multiAsset);
      if (typeof outputValues[asset.address] == "undefined") {
        outputValues[asset.address] = this.sl.Value.new(
          this.sl.BigNum.from_str("0")
        );
      }
      // if (asset.address != PaymentAddress) {
      //     let minAdaMint = this.S.min_ada_required(
      //         mintedValue,
      //         this.S.BigNum.from_str(ProtocolParameter.minUtxo)
      //     );

      //     mintedValue.set_coin(minAdaMint)
      // }
      outputValues[asset.address] =
        outputValues[asset.address].checked_add(mintedValue);
    }

    Object.entries(mintedAssetsDict).map(([policyScriptHex, mintAssets]) => {
      const policyScript = this.sl.NativeScript.from_bytes(
        Buffer.from(policyScriptHex, "hex")
      );
      mint.insert(
        this.sl.ScriptHash.from_bytes(
          policyScript.hash(this.sl.ScriptHashNamespace.NativeScript).to_bytes()
        ),
        mintAssets
      );
    });

    const inputs = this.sl.TransactionInputs.new();

    selection.input.forEach((utxo) => {
      inputs.add(
        this.sl.TransactionInput.new(
          utxo.input().transaction_id(),
          utxo.input().index()
        )
      );
      outputValues[PaymentAddress] = outputValues[PaymentAddress].checked_add(
        utxo.output().amount()
      );
    });

    const rawOutputs = this.sl.TransactionOutputs.new();

    Object.entries(outputValues).map(([address, value]) => {
      rawOutputs.add(
        this.sl.TransactionOutput.new(this.sl.Address.from_bech32(address), value)
      );
    });

    const fee = this.sl.BigNum.from_str("0");
    const rawTxBody = this.sl.TransactionBody.new(
      inputs,
      rawOutputs,
      fee,
      ttl + ProtocolParameter.slot
    );
    rawTxBody.set_mint(mint);

    let aux = this.sl.AuxiliaryData.new();

    if (metadata) {
      const generalMetadata = this.sl.GeneralTransactionMetadata.new();
      Object.entries(metadata).map(([MetadataLabel, Metadata]) => {
        generalMetadata.insert(
          this.sl.BigNum.from_str(MetadataLabel),
          this.sl.encode_json_str_to_metadatum(JSON.stringify(Metadata), 0)
        );
      });

      aux.set_metadata(generalMetadata);
    }
    if (metadataHash) {
      const auxDataHash = this.sl.AuxiliaryDataHash.from_bytes(
        Buffer.from(metadataHash, "hex")
      );
      console.log(auxDataHash);
      rawTxBody.set_auxiliary_data_hash(auxDataHash);
    } else rawTxBody.set_auxiliary_data_hash(this.sl.hash_auxiliary_data(aux));
    const witnesses = this.sl.TransactionWitnessSet.new();
    witnesses.set_native_scripts(nativeScripts);

    const dummyVkeyWitness =
      "8258208814c250f40bfc74d6c64f02fc75a54e68a9a8b3736e408d9820a6093d5e38b95840f04a036fa56b180af6537b2bba79cec75191dc47419e1fd8a4a892e7d84b7195348b3989c15f1e7b895c5ccee65a1931615b4bdb8bbbd01e6170db7a6831310c";

    const vkeys = this.sl.Vkeywitnesses.new();
    vkeys.add(
      this.sl.Vkeywitness.from_bytes(Buffer.from(dummyVkeyWitness, "hex"))
    );

    vkeys.add(
      this.sl.Vkeywitness.from_bytes(Buffer.from(dummyVkeyWitness, "hex"))
    );
    if (multiSig) {
      vkeys.add(
        this.sl.Vkeywitness.from_bytes(Buffer.from(dummyVkeyWitness, "hex"))
      );
    }
    witnesses.set_vkeys(vkeys);

    const rawTx = this.sl.Transaction.new(rawTxBody, witnesses, aux);

    let minFee = this.sl.min_fee(
      rawTx,
      this.sl.LinearFee.new(
        this.sl.BigNum.from_str(ProtocolParameter.linearFee.minFeeA),
        this.sl.BigNum.from_str(ProtocolParameter.linearFee.minFeeB)
      )
    );

    outputValues[PaymentAddress] = outputValues[PaymentAddress].checked_sub(
      this.sl.Value.new(minFee)
    );
    Object.entries(costValues).map(([address, value]) => {
      outputValues[PaymentAddress] =
        outputValues[PaymentAddress].checked_sub(value);
    });

    const outputs = this.sl.TransactionOutputs.new();
    Object.entries(outputValues).map(([address, value]) => {
      outputs.add(
        this.sl.TransactionOutput.new(this.sl.Address.from_bech32(address), value)
      );
    });

    const finalTxBody = this.sl.TransactionBody.new(
      inputs,
      outputs,
      minFee,
      ttl + ProtocolParameter.slot
    );

    finalTxBody.set_mint(rawTxBody.multiassets());

    finalTxBody.set_auxiliary_data_hash(rawTxBody.auxiliary_data_hash());

    const finalWitnesses = this.sl.TransactionWitnessSet.new();
    finalWitnesses.set_native_scripts(nativeScripts);
    let auxFinal;
    if (addMetadata) auxFinal = rawTx.auxiliary_data();
    else auxFinal = this.sl.AuxiliaryData.new();
    const transaction = this.sl.Transaction.new(
      finalTxBody,
      finalWitnesses,
      auxFinal
    );

    const size = transaction.to_bytes().length * 2;
    if (size > ProtocolParameter.maxTxSize) throw ERROR.TX_TOO_BIG;

    return transaction.to_bytes();
  }

  async _txBuilder({
    PaymentAddress,
    Utxos,
    Outputs,
    ProtocolParameter,

    metadata = null,
  }) {
    const MULTIASSET_SIZE = 5000;
    const VALUE_SIZE = 5000;
    const totalAssets = 0;

    CoinSelection.setProtocolParameters(
      ProtocolParameter.minUtxo.toString(),
      ProtocolParameter.linearFee.minFeeA.toString(),
      ProtocolParameter.linearFee.minFeeB.toString(),
      ProtocolParameter.maxTxSize.toString()
    );

    const selection = await CoinSelection.randomImprove(
      Utxos,
      Outputs,
      20 + totalAssets
    );
    console.log(selection);
    const inputs = selection.input;

    const linearFee = this.sl.LinearFee.new(
      this.sl.BigNum.from_str(ProtocolParameter.linearFee.minFeeA),
      this.sl.BigNum.from_str(ProtocolParameter.linearFee.minFeeB)
    );
    const poolDeposit = this.sl.BigNum.from_str(
      ProtocolParameter.poolDeposit.toString()
    );
    const keyDeposit = this.sl.BigNum.from_str(
      ProtocolParameter.keyDeposit.toString()
    );
    const coinsPerUtxoWord = this.sl.BigNum.from_str(ProtocolParameter.minUtxo);
    const maxValueBytes = ProtocolParameter.maxValSize || 5000;
    const maxTxBytes = ProtocolParameter.maxTxSize;
    console.log({ ProtocolParameter, t: true || maxValueBytes });
    const txConfig = this.sl.TransactionBuilderConfigBuilder.new()
      .fee_algo(linearFee)
      .pool_deposit(poolDeposit)
      .key_deposit(keyDeposit)
      .coins_per_utxo_word(coinsPerUtxoWord)
      .max_value_size(maxValueBytes)
      .max_tx_size(maxTxBytes)
      .build();

    const txBuilder = this.sl.TransactionBuilder.new(txConfig);
    for (let i = 0; i < inputs.length; i++) {
      const utxo = inputs[i];
      txBuilder.add_input(
        utxo.output().address(),
        utxo.input(),
        utxo.output().amount()
      );
    }

    let AUXILIARY_DATA;
    if (metadata) {
      AUXILIARY_DATA = this.sl.AuxiliaryData.new();
      const generalMetadata = this.sl.GeneralTransactionMetadata.new();
      Object.entries(Metadata).map(([MetadataLabel, Metadata]) => {
        generalMetadata.insert(
          this.sl.BigNum.from_str(MetadataLabel),
          this.sl.encode_json_str_to_metadatum(JSON.stringify(Metadata), 0)
        );
      });

      aux.set_metadata(generalMetadata);

      txBuilder.set_auxiliary_data(AUXILIARY_DATA);
    }

    for (let i = 0; i < Outputs.len(); i++) {
      txBuilder.add_output(Outputs.get(i));
    }

    const change = selection.change;
    const changeMultiAssets = change.multiasset();
    // check if change value is too big for single output
    if (changeMultiAssets && change.to_bytes().length * 2 > VALUE_SIZE) {
      const partialChange = this.sl.Value.new(this.sl.BigNum.from_str("0"));

      const partialMultiAssets = this.sl.MultiAsset.new();
      const policies = changeMultiAssets.keys();
      const makeSplit = () => {
        for (let j = 0; j < changeMultiAssets.len(); j++) {
          const policy = policies.get(j);
          const policyAssets = changeMultiAssets.get(policy);
          const assetNames = policyAssets.keys();
          const assets = this.sl.Assets.new();
          for (let k = 0; k < assetNames.len(); k++) {
            const policyAsset = assetNames.get(k);
            const quantity = policyAssets.get(policyAsset);
            assets.insert(policyAsset, quantity);
            //check size
            const checkMultiAssets = this.sl.MultiAsset.from_bytes(
              partialMultiAssets.to_bytes()
            );
            checkMultiAssets.insert(policy, assets);
            const checkValue = this.sl.Value.new(this.sl.BigNum.from_str("0"));
            checkValue.set_multiasset(checkMultiAssets);
            if (checkValue.to_bytes().length * 2 >= VALUE_SIZE) {
              partialMultiAssets.insert(policy, assets);
              return;
            }
          }
          partialMultiAssets.insert(policy, assets);
        }
      };

      makeSplit();
      partialChange.set_multiasset(partialMultiAssets);

      const minAda = this.sl.min_ada_required(
        partialChange,
        false,
        this.sl.BigNum.from_str(ProtocolParameter.minUtxo)
      );
      partialChange.set_coin(minAda);

      txBuilder.add_output(
        this.sl.TransactionOutput.new(
          this.sl.Address.from_bech32(PaymentAddress),
          partialChange
        )
      );
    }
    txBuilder.add_change_if_needed(this.sl.Address.from_bech32(PaymentAddress));
    const transaction = this.sl.Transaction.new(
      txBuilder.build(),
      this.sl.TransactionWitnessSet.new(),
      AUXILIARY_DATA
    );

    const size = transaction.to_bytes().length * 2;
    if (size > ProtocolParameter.maxTxSize) throw ERROR.TX_TOO_BIG;

    return transaction.to_bytes();
  }

  async submitTxWallet(txHex) {
    return await this.walletApi.submitTx(txHex);
  }

  // async submitTx({ transactionRaw, witnesses, scripts, networkId, metadata }) {
  //   let transaction = this.sl.Transaction.from_bytes(
  //     Buffer.from(transactionRaw, "hex")
  //   );

  //   const txWitnesses = transaction.witness_set();
  //   const txVkeys = txWitnesses.vkeys();
  //   const txScripts = txWitnesses.native_scripts();

  //   const addWitnesses = this.sl.TransactionWitnessSet.from_bytes(
  //     Buffer.from(witnesses[0], "hex")
  //   );
  //   const addVkeys = addWitnesses.vkeys();
  //   const addScripts = addWitnesses.native_scripts();

  //   const totalVkeys = this.sl.Vkeywitnesses.new();
  //   const totalScripts = this.sl.NativeScripts.new();

  //   if (txVkeys) {
  //     for (let i = 0; i < txVkeys.len(); i++) {
  //       totalVkeys.add(txVkeys.get(i));
  //     }
  //   }
  //   if (txScripts) {
  //     for (let i = 0; i < txScripts.len(); i++) {
  //       totalScripts.add(txScripts.get(i));
  //     }
  //   }
  //   if (addVkeys) {
  //     for (let i = 0; i < addVkeys.len(); i++) {
  //       totalVkeys.add(addVkeys.get(i));
  //     }
  //   }
  //   if (addScripts) {
  //     for (let i = 0; i < addScripts.len(); i++) {
  //       totalScripts.add(addScripts.get(i));
  //     }
  //   }

  //   const totalWitnesses = this.sl.TransactionWitnessSet.new();
  //   totalWitnesses.set_vkeys(totalVkeys);
  //   totalWitnesses.set_native_scripts(totalScripts);
  //   let aux;
  //   if (metadata) {
  //     aux = this.sl.AuxiliaryData.new();
  //     const generalMetadata = this.sl.GeneralTransactionMetadata.new();
  //     Object.entries(metadata).map(([MetadataLabel, Metadata]) => {
  //       generalMetadata.insert(
  //         this.sl.BigNum.from_str(MetadataLabel),
  //         this.sl.encode_json_str_to_metadatum(JSON.stringify(Metadata), 0)
  //       );
  //     });

  //     aux.set_metadata(generalMetadata);
  //   } else {
  //     aux = transaction.auxiliary_data();
  //   }
  //   const signedTx = await this.sl.Transaction.new(
  //     transaction.body(),
  //     totalWitnesses,
  //     aux
  //   );

  //   const txhash = await this._blockfrostRequest({
  //     endpoint: `/tx/submit`,
  //     headers: {
  //       "Content-Type": "application/cbor",
  //     },
  //     body: Buffer.from(signedTx.to_bytes(), "hex"),
  //     networkId: networkId,
  //     method: "POST",
  //   });

  //   return txhash;
  // }

  async _getProtocolParameter(networkId) {
    let latestBlock = await this._blockfrostRequest({
      endpoint: "/blocks/latest",
      networkId: networkId,
      method: "GET",
    });
    if (!latestBlock) throw ERROR.FAILED_PROTOCOL_PARAMETER;

    let p = await this._blockfrostRequest({
      endpoint: `/epochs/${latestBlock.epoch}/parameters`,
      networkId: networkId,
      method: "GET",
    }); // if(!p) throw ERROR.FAILED_PROTOCOL_PARAMETER

    return {
      linearFee: {
        minFeeA: p.min_fee_a.toString(),
        minFeeB: p.min_fee_b.toString(),
      },
      minUtxo: p.min_utxo, //p.min_utxo, minUTxOValue protocol paramter has been removed since Alonzo HF. Calulation of minADA works differently now, but 1 minADA still sufficient for now
      poolDeposit: p.pool_deposit,
      keyDeposit: p.key_deposit,
      maxTxSize: p.max_tx_size,
      slot: latestBlock.slot,
    };
  }

  async _submitRequest(body) {
    let latestBlock = await this._blockfrostRequest({
      endpoint: "/blocks/latest",
      network: networkId,
    });
    if (!latestBlock) throw ERROR.FAILED_PROTOCOL_PARAMETER;

    let p = await this._blockfrostRequest({
      endpoint: `/epochs/${latestBlock.epoch}/parameters`,
      networkId: networkId,
    }); //
    if (!p) throw ERROR.FAILED_PROTOCOL_PARAMETER;

    return {
      linearFee: {
        minFeeA: p.min_fee_a.toString(),
        minFeeB: p.min_fee_b.toString(),
      },
      minUtxo: p.min_utxo, //p.min_utxo, minUTxOValue protocol paramter has been removed since Alonzo HF. Calulation of minADA works differently now, but 1 minADA still sufficient for now
      poolDeposit: p.pool_deposit,
      keyDeposit: p.key_deposit,
      maxTxSize: p.max_tx_size,
      slot: latestBlock.slot,
    };
  }

  async _blockfrostRequest({
    body,
    endpoint = "",
    networkId = 0,
    headers = {},
    method = "GET",
  }) {
    let networkEndpoint = `https://cardano-${process.env.NEXT_PUBLIC_REACT_APP_REQUIRED_NETWORK}.blockfrost.io/api/v0`;

    try {
      return await (
        await fetch(`${networkEndpoint}${endpoint}`, {
          headers: {
            project_id: process.env.NEXT_PUBLIC_REACT_BLOCKFRST_API,
            ...headers,
          },
          method: method,
          body,
        })
      ).json();
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

// auxiliary
function HexToBuffer(string) {
  return Buffer.from(string, "hex");
}

function HexToAscii(string) {
  return HexToBuffer(string).toString("ascii");
}

export default CardanoApi;
