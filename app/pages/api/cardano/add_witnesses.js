import _ from 'underscore';
import walletApi from '../../../server/wallet.api';

export default async function handler(req, res) {
  try {
    const { witnesses, txHex, walletWitnessHex } = req.body;
    const txHexResponse = await walletApi.addWitnesses({ witnesses, txHex, walletWitnessHex });
    res.json({ success: !!txHexResponse, txHex: txHexResponse });
    return;
  } catch (err) {
    console.error(err);
  }

  res.status(400).json({});
}