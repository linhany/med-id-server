var HealthRecords = artifacts.require("./HealthRecords.sol");

module.exports = function(deployer) {
  deployer.deploy(HealthRecords);
};
