import _ from 'underscore';
import db from '../../../server/db/db';

function _requestIsValid(req, res) {
  const { nftTokenName } = req.query;
  if (req.method === 'GET' && !_.isEmpty(nftTokenName)) {
    return true;
  }
}

export default async function handler(req, res) {
  if (_requestIsValid(req, res)) {
    const { nftTokenName } = req.query;
    const utxos = await db.getInsertedReceipt(nftTokenName);
    if (utxos) {
      res.status(200).json({ success: true, utxos });
      return;
    }
  }
  res.status(400).json({});
}
