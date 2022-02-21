const hardhat = require("hardhat");

const METADATA_BASE_URI = 'ipfs://QmVTktJb8VSi4AGeuRrv7eeedRxn8Zsh3VU543ZDwDwMbB/';
const DEFAULT_CONTENT_BASE_URI = 'ipfs://QmYeZHGzfUS4R2wfTi1wYW8Cq9eyK4Rea8QQKtG3ERhKfC/'
const COLLECTION_URI = 'ipfs://QmYeZHGzfUS4R2wfTi1wYW8Cq9eyK4Rea8QQKtG3ERhKfC'
const DEFAULT_TOTAL_MINT_LIMIT = 2000;
const DEFAULT_SINGLE_MINT_LIMIT = 35;
const DEFAULT_USER_MINT_LIMIT = 35;
const DEFAULT_MINT_PRICE = hardhat.ethers.utils.parseEther('0.1');
const DEFAULT_ROYALTY_BASIS_POINTS = 500; // 5%
const ORIGINAL = hardhat.ethers.utils.getAddress('0x8f1F643637046c867675Ca101ce28E2763daC1E2');
const TOKENS_TO_MIGRATE = [1117,1116,1418,1216,1417,1416,1419,3238,6223,6222,6322,6122,3513,3413,3414,3552,3553,3859,5573,5673,5574,5675,5773,5775,1318,1119,1317,1118,1218,1316,1217,1219,1939,1319,3053,3052,3514,5575,5674,5774,6124,6123,6224,6324,6323,3858,4727,3958,3959];

module.exports = [
  DEFAULT_TOTAL_MINT_LIMIT,
  DEFAULT_SINGLE_MINT_LIMIT,
  DEFAULT_USER_MINT_LIMIT,
  DEFAULT_MINT_PRICE,
  METADATA_BASE_URI,
  DEFAULT_CONTENT_BASE_URI,
  COLLECTION_URI,
  DEFAULT_ROYALTY_BASIS_POINTS,
  ORIGINAL,
];