
const WALLET_NAME_KEY = 'walletName';

function _get(key) {
  return localStorage.getItem(key);
}
function _set(key, val) {
  localStorage.setItem(key, val);
}
function _clear(key) {
  localStorage.removeItem(key);
}
function _clearAll() {
  localStorage.clear();
}

function hasWalletName() {
  return !!_get(WALLET_NAME_KEY);
}
function getWalletName() {
  return _get(WALLET_NAME_KEY);
}
function setWalletName(val) {
  _set(WALLET_NAME_KEY, val);
}
function clearWalletName() {
  _clear(WALLET_NAME_KEY);
}


export default {
  hasWalletName,
  getWalletName,
  setWalletName,
  clearWalletName,
};