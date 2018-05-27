import 'babel-polyfill';

var HealthRecords = artifacts.require("./HealthRecords.sol");

contract('HealthRecords', async (accounts) => {

  console.log("accounts: " + accounts);

  it("should set the contract owner correctly", async () => {
    let instance = await HealthRecords.deployed();
    let manager = await instance.manager.call();
    assert.equal(manager, accounts[0]);
  })

  it("should set and get the record hash correctly", async() => {
    let patientId = "some-patient-identifier"
    let recordHash = "3f912ed586852e5826156b8fec88f4b0"
    
    let instance = await HealthRecords.deployed();

    // initially should be empty
    let storedHash = await instance.getRecordHash.call(patientId);
    assert.equal(storedHash, '');

    // should disallow non-contract manager from setting hash
    try {
      await instance.setRecordHash(patientId, recordHash, {from: accounts[1]});
      assert.fail('Expected revert not received');
    } catch (error) {
      const revertFound = error.message.search('revert') >= 0;
      assert(revertFound, `Expected "revert", got ${error} instead`);
    }
    storedHash = await instance.getRecordHash.call(patientId);
    assert.equal(storedHash, '');

    // should allow contract manager to set hash
    await instance.setRecordHash(patientId, recordHash, {from: accounts[0]});
    storedHash = await instance.getRecordHash.call(patientId);
    assert.equal(recordHash, storedHash);
  })
})