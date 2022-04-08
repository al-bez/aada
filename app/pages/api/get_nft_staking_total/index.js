import db from '../../../server/db/db';
import _ from 'underscore';

function _requestIsValid(req, res) {
  if (req.method === 'GET') {
    return true;
  }
}

export default async function handler(req, res) {
  if (_requestIsValid(req, res)) {
    const data = await db.getNftStakingTotal();
    if (data) {
      res.status(200).json({ success: true, data });
      return;
    }
  }

  res.status(400).json({});
}
