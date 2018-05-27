pragma solidity ^0.4.17;

contract HealthRecords {
  address public manager;
  mapping(string => string) patientIdToRecordHash;
    
  modifier restricted() {
    require(msg.sender == manager);
    _;
  }
    
  function HealthRecords() public {
    manager = msg.sender;
  }
    
  function getRecordHash(string patientId) public view returns (string) {
    return patientIdToRecordHash[patientId];
  }
    
  function setRecordHash(string patientId, string recordHash) public restricted {
    patientIdToRecordHash[patientId] = recordHash;
  }
}