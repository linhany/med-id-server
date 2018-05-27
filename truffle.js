// Allows us to use ES6 in our migrations and tests.
require('babel-register')

let MNEMONIC = process.env.MNEMONIC;
let RINKEBY_INFURA_URL = process.env.RINKEBY_INFURA_URL;
const fs = require('fs');
if (fs.existsSync('./secrets.js')) {
  const secrets = require('./secrets');
  MNEMONIC = secrets.MNEMONIC;
  RINKEBY_INFURA_URL = secrets.RINKEBY_INFURA_URL;
}
const {CONTRACT_MANAGER} = require('./contractManager');

let HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '666'
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(MNEMONIC, RINKEBY_INFURA_URL)
      },
      from: CONTRACT_MANAGER,
      network_id: 4,
      gas: 4612388
    }   
  }
}
