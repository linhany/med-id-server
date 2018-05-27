const contract = require('truffle-contract');

const healthrecords_artifact = require('../build/contracts/HealthRecords.json');
let HealthRecords = contract(healthrecords_artifact);

module.exports = {
  start: function(callback) {
    let self = this;

    // Bootstrap the HealthRecords abstraction for Use.
    HealthRecords.setProvider(self.web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    self.web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }
      self.accounts = accs;
      self.account = self.accounts[2];

      callback(self.accounts);
    });
  },
  getContractManager: function(callback) {
    let self = this;

    // Bootstrap the HealthRecords abstraction for Use.
    HealthRecords.setProvider(self.web3.currentProvider);

    let records;
    HealthRecords.deployed().then(function(instance) {
      records = instance;
      return records.manager.call();
    }).then(function(value) {
        callback(value.valueOf());
    }).catch(function(e) {
        console.log(e);
        callback("ERROR 404");
    });
  },
  getRecordHash: function(patientId, account, callback) {
    let self = this;

    // Bootstrap the HealthRecords abstraction for Use.
    HealthRecords.setProvider(self.web3.currentProvider);

    let records;
    HealthRecords.deployed().then(function(instance) {
      records = instance;
      return records.getRecordHash.call(patientId, {from: account});
    }).then(function(value) {
        callback(value.valueOf());
    }).catch(function(e) {
        console.log(e);
        callback("ERROR 404");
    });
  },
  setRecordHash: function(patientId, recordHash, account, callback) {
    let self = this;

    // Bootstrap the HealthRecords abstraction for Use.
    HealthRecords.setProvider(self.web3.currentProvider);

    console.debug("setRecordHash(): account used is " + account);

    let records;
    HealthRecords.deployed().then(function(instance) {
      records = instance;
      return records.setRecordHash(patientId, recordHash, {from: account});
    }).then(function(value) {
        callback(value.valueOf());
    }).catch(function(e) {
        console.log(e);
        callback("ERROR 404");
    });
  }
}
