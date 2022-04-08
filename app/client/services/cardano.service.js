import axios from 'axios';
const apiBaseUrl = `/api`;
const apiCardanoUrl = `${apiBaseUrl}/cardano`;

async function getBackendUtxos(nftTokenName) {
  try {
    const { data } = await axios.get(`${apiBaseUrl}/get_backend_utxos/${nftTokenName}`);
    if (data?.success) {
      return data.utxos;
    }
  } catch (err) {
    console.log({ err });
  }
  throw Error(`Cannot fetch backend utxos for token '${nftTokenName}'`);
}

async function getNftStakingTotal() {
  try {
    const { data } = await axios.get(`${apiBaseUrl}/get_nft_staking_total`);
    if (data?.success) {
      return data.data;
    }
  } catch (err) {
    console.log({ err });
  }

  throw Error(`Cannot get NFT staking amount!`);
}


async function getStakingNftBonds(policies) {
  try {
    const { data } = await axios.post(`${apiBaseUrl}/get_staking_nft_bonds`, { policies });
    if (data?.success) {
      return data.data;
    }
  } catch (err) {
    console.log({ err });
  }

  throw Error(`Cannot get NFT staking amount!`);
}

//

async function vkeyWitness(txHash) {
  try {
    const { data } = await axios.post(`${apiCardanoUrl}/vkey_witness`, { txHash });
    if (data?.success) {
      return data.txWitnessSetString;
    }
    alert(`Server error, reason 'vkeysWitnessesString'`);
  } catch (err) {
    console.log({ err });
  }
  throw Error(`Error in route /vkey_witness for txHash'${txHash}'`);
}

async function stake(input) {
  const res = await axios.post(`${apiCardanoUrl}/stake`, { ...input });
  return res.data;
}

async function addWitnesses(input) {
  try {
    const res = await axios.post(`${apiCardanoUrl}/add_witnesses`, { ...input });
    if (res.data?.success) {
      return res.data;
    }
    console.log({ res });
  } catch (err) {
    console.log({ err });
  }
}

export default {
  getNftStakingTotal,
  getBackendUtxos,
  getStakingNftBonds,
  //
  addWitnesses,
  vkeyWitness,
  stake,
};
