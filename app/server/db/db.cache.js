import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { table } from 'console';
import getConfig from 'next/config';
const { serverRuntimeConfig } = getConfig();

// const dirname = serverRuntimeConfig.PROJECT_ROOT;
const dirname = process.cwd();

console.log({ dirname });
const tenMinutesMilli = 600000;
const oneMinuteMilli = tenMinutesMilli / 10;

const CACHE_PATH = {
  inserted_receipts: 'inserted_receipts',
  nft_staking_details: 'nft_staking_details',
  staking_nft_bonds_log: 'staking_nft_bonds_log',
};

const pool = new pg.Pool();
const query = (text, params, callback) =>
  pool.query(text, params, callback);

export class DbCache {
  static isInitialized = false;

  static async inserted_receipts() {
    return await this.getTable('inserted_receipts', CACHE_PATH.inserted_receipts);
  }

  static async nft_staking_details() {
    return await this.getTable('nft_staking_details', CACHE_PATH.nft_staking_details);
  }

  static async staking_nft_bonds_log() {
    return await this.getTable('staking_nft_bonds_log', CACHE_PATH.staking_nft_bonds_log);
  }


  static async init() {
    const p3 = path.join(dirname, CACHE_PATH.inserted_receipts);
    const p2 = path.join(dirname, CACHE_PATH.nft_staking_details);
    const p1 = path.join(dirname, CACHE_PATH.staking_nft_bonds_log);

    if (
      !fs.existsSync(p1) &&
      !fs.existsSync(p2) &&
      !fs.existsSync(p3)
    ) {
      console.log("Db cache initializing...");
      await this.#loadRows();
    }
  }

  static async #loadTableRows(tableName, cachePath) {
    const sqlQuery = `SELECT * FROM ${tableName}`;
    const { rows } = await query(sqlQuery);
    if (Array.isArray(rows)) {
      fs.writeFileSync(
        path.join(dirname, cachePath),
        JSON.stringify(rows),
        'utf8'
      );
    }
    return rows;
  }

  static async #loadRows() {
    setTimeout(async () => {
      await this.#loadRows();
    }, tenMinutesMilli / 2);
    console.log('Loading DB cache');
    await this.#loadTableRows('inserted_receipts', CACHE_PATH.inserted_receipts);
    await this.#loadTableRows('nft_staking_details', CACHE_PATH.nft_staking_details);
    await this.#loadTableRows('staking_nft_bonds_log', CACHE_PATH.staking_nft_bonds_log);
    console.log('Finish loading DB cache');
  }

  static async getTable(tableName, cachePath) {
    let cachedData;
    try {
      cachedData = JSON.parse(
        fs.readFileSync(path.join(dirname, cachePath), 'utf8')
      );
    } catch (error) {
      console.log(`'${tableName}' cache not initialized!`);
    }
    if (!cachedData) {
      const data = await this.#loadTableRows(tableName, cachePath);
      cachedData = data;
    }
    return cachedData;
  }
}
