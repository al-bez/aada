import pg from 'pg';
import _, { result } from 'underscore';
import { DbCache } from './db.cache';

// DbCache.init();

const pool = new pg.Pool();
const query = (text, params, callback) =>
  pool.query(text, params, callback);

async function getInsertedReceipt(nftTokenName) {
  // try {
  //   const rows = await DbCache.inserted_receipts();
  //   if (_.isArray(rows)) {
  //     const row = rows.find(r => r.token_name === nftTokenName);
  //     console.log({ Cache_getInsertedReceipt: true });
  //     return row;
  //   }
  // } catch (err) {
  //   console.log('getInsertedReceipt', { err });
  // }

  try {
    if (nftTokenName) {
      const sqlQuery = `
        SELECT aada_amount, lovelaces, token_name, utxo_hash, utxo_index
        FROM inserted_receipts
        WHERE token_name = $1
      `;
      const { rows } = await query(sqlQuery, [nftTokenName]);
      if (_.isArray(rows) && rows[0]) {
        return rows[0];
      }
    }
  } catch (err) {
    console.log({ err });
  }
  return null;
}

async function getNftStakingTotal() {
  // try {
  //   const rows = await DbCache.nft_staking_details();
  //   if (_.isArray(rows)) {
  //     console.log({ Cache_GetNftStakingTotal: true });

  //     return _result(rows);
  //   }
  // } catch (err) {
  //   console.log('getNftStakingTotal', { err });
  // }

  try {
    const sqlQuery = `SELECT * FROM nft_staking_details`;
    const { rows } = await query(sqlQuery);
    return _result(rows);
  } catch (err) {
    console.log({ err });
  }
  return null;

  function _result(rows) {
    if (_.isArray(rows)) {
      let months6 = 0;
      let months12 = 0;

      rows.forEach(r => {
        if (r.is_6_months_lock) {
          months6 += Number(r.aada_locked);
        }
        if (r.is_12_months_lock) {
          months12 += Number(r.aada_locked);
        }
      });

      const totalLimit = 600000 * 1000000;
      return {
        totalLimit,
        months6Remaining: totalLimit - months6,
        months12Remaining: totalLimit - months12,
        months6,
        months12,
      };
    }
  }
}

async function getStakingNftBonds(policies) {
  // try {
  //   const rows = await DbCache.staking_nft_bonds_log();
  //   if (_.isArray(rows)) {
  //     const rowsFiltered = rows.filter(r => policies.includes(r.token_policy));
  //     console.log({ Cache_getStakingNftBonds: true });
  //     return rowsFiltered;
  //   }
  // } catch (err) {
  //   console.log('getStakingNftBonds', { err });
  // }

  try {
    const sqlQuery = `
      SELECT * 
      FROM staking_nft_bonds_log
      WHERE token_policy IN (
        ${policies.map(p => `'${p}'`).join(',')}
      )
    `;
    const { rows } = await query(sqlQuery);
    return rows;
  } catch (err) {
    console.log('getStakingNftBonds', { err });
  }

  return null;
}

export default {
  getInsertedReceipt,
  getNftStakingTotal,
  getStakingNftBonds
};

