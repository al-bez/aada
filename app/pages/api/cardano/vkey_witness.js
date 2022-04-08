import _ from 'underscore';
import nami from '../../../server/wallet.api';
import * as env from '../../../const/env.const';


function _requestIsValid(req, res) {
  const { txHash } = req.body;
  if (req.method === 'POST' && !_.isEmpty(txHash)) {
    return true;
  }
}

export default async function handler(req, res) {
  try {
    if (_requestIsValid(req, res)) {
      const txWitnessSetString = await nami.vkeyWitness(req.body.txHash);
      if (txWitnessSetString) {
        res.json({ success: true, txWitnessSetString });
        return;
      }
    }
  } catch (err) {
    console.error(err);
  }
  res.status(400).json({});
}
