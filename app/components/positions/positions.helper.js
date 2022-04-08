import cardanoService from '../../client/services/cardano.service';

const policiesDummy = [
  "299d4a2924dacfe26cd1fa3d897a633a29ed5ee8c36920073d95c22e",
  "b443a4e8244c6f514cd75da85db27ae422ed62414c7b1a2bdfda97ad",
  "616a4cb56ae7f986b4306dd5a5bf0cf2387b695584d3b626cc8520b9",
  "44ca3a28f7a6fc19b7f8d270d50af1b430fe259fe9937ac5aadd2828",
  "9e74e13c048d62047b2f3ff154746563e949df1f5f957dff6125f3b2",
  "3dbf126233b3ea4cf582443bb1693bd9b837db14e772824ef7818bf2",
  "72b3a66d5778171bcd7b20d108b0b6758187d90c6954fcfd1fd58e2a",
  "57bd278625a88ae15ba9a06e8e66ea6606038a3934cfa03ed59706d1",
  "33caec0dda6ef4f61ad7bb3baaeda75899cbf856ab23bcd2de3f7318",
  "4a2b3b082ab59f800875241508f1584f16dca6596cf9c60828f8bc1d",
  "af054e7a1e75b883c31506cd9a7a248d3dc3ccfd9199b963fb99a96d",
];

class PositionsHelper {
  get cardano() {
    return window.cardanoApi;
  }

  get connected() {
    return !!window.cardanoApi;
  }

  async getStakingNftBonds() {
    const assets = await this.cardano.getUserAssets('AadaBond');
    const policies = assets.map(x => x.amount).reduce((a, b) => [...a, ...b], []).map(x => x.policy);
    const data = await cardanoService.getStakingNftBonds(policies);
    // const data = await cardanoService.getStakingNftBonds(policiesDummy);
    return data;
  }
}

export default new PositionsHelper();