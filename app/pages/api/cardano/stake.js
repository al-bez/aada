import _ from 'underscore';
import nami from '../../../server/wallet.api';
import axios from 'axios';

export default async function handler(req, res) {
  try {
    const { amount, months, walletAddresses, collateral } = req.body;
    if (process.env.NEXT_PUBLIC_IS_LOCALHOST) {
    } else if (amount < 25) {
      throw Error("Invalid staking amount, min 25 ADA");
    }

    const pythonAPI = process.env.LOCKING_TX_GENERATION_API;
    const tokenPolocy = process.env.NEXT_PUBLIC_STAKE_TOKEN_POLICY;
    const isOneYear = months === 12;

    const inputData = {
      wallet_address: [...walletAddresses],
      token_name: tokenPolocy,
      token_balance: amount * 1000000,
      length_in_days: isOneYear ? 365 : 182.5,
      interest_rate: isOneYear ? 0.2 : 0.12,
      collateral,
    };

    const { data } = await axios.post(pythonAPI, inputData, { headers: { 'Content-Type': 'application/json' } });
    if (!data.error && data.cborHex) {
      const payload = {
        cborHex: data.cborHex,
        walletAddress: walletAddresses[0],
      };
      const { txHex, policyWitnessHex, walletWitnessHex } = await nami.stake(payload);
      const resData = { success: !!txHex, txHex, policyWitnessHex, walletWitnessHex };
      res.json(resData);
      return;
    }

    console.log({ data });
    if (data.error) {
      res.json({ success: false, info: data.error });
    }
    return;
  } catch (err) {
    if (err.toJSON) {
      const errJson = err.toJSON();
      console.log({ errJson });
      res.status(errJson.status).json({ info: errJson.message });
      return;
    }
    console.log({ err });
  }
  res.status(400).json({});
}