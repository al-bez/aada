import db from '../../../server/db/db';
import _ from 'underscore';

function _requestIsValid(req) {
  if (req.method === 'POST' && !_.isEmpty(req.body.policies)) {
    return true;
  }
}

export default async function handler(req, res) {
  if (_requestIsValid(req)) {
    const { policies } = req.body;
    const data = await db.getStakingNftBonds(policies);
    if (data) {
      res.status(200).json({ success: true, data });
      return;
    }
  }

  res.status(400).json({});
}
