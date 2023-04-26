const ethers = require("ethers");

const connection = "https://mainnet.infura.io/v3/e5e1f07bbce3486598aeee1d006b7c91";
// console.log('connection', connection)

module.exports = new ethers.providers.JsonRpcProvider(connection);
