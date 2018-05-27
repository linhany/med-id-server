const express = require('express');
const app = express();
const db = require('./db');
const port = process.env.PORT || 3000;
const Web3 = require('web3');
const truffle_connect = require('./connection/app.js');
const bodyParser = require('body-parser');
const crypto = require('./crypto')
const Doctor = require('./Doctor');
const HealthRecord = require('./HealthRecord');

let accounts;
let contract_manager;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use('/', express.static('public_static'));

// creates a doctor
app.post('/doctor', (req, res) => {
  console.log("**** POST /doctor ****");
  console.log(req.body)
  let { publicKey, privateKey } = crypto.generateKeys();

  Doctor.create({
    _id: publicKey,
    private_key: privateKey,
    authorized_healthrecords: req.body.authorized_healthrecords
  }, 
  function (err, doctor) {
      if (err) return res.status(500).send("There was a problem adding the information to the database.");
      res.status(200).send(doctor);
  });
});

// return all the doctors
app.get('/doctor', (req, res) => {
  console.log("**** GET /doctor ****");

  Doctor.find({}, function(err, doctors) {
    if (err) return res.status(500).send("There was a problem finding the doctors.");
    res.status(200).send(doctors);
  });
});

// return the public key + authorized HR ids of a doctor
app.get('/doctor/:id', (req, res) => {
  console.log("**** GET /doctor/:id ****");

  Doctor.findById(req.params.id, 'authorized_healthrecords', function(err, doctor) {
    if (err) return res.status(500).send("There was a problem finding the doctor.");
    if (doctor == null) return res.status(404).send("No such doctor exists.");
    res.status(200).send(doctor);
  });
});

// authorizes a doctor to be able to view/edit a particular healthrecord
app.post('/doctor/:id/authorize', (req, res) => {
  console.log("**** POST /doctor/:id/authorize ****");
  console.log(req.body);

  let healthrecord = req.body.healthrecord; // the encrypted healthrecord
  let key = req.body.key; // the encrypted symmetric key

  let patientID = req.body.patient_id; // the unique identifier of the patient

  // retrieve by id, doctor from db
  Doctor.findById(req.params.id, function(err, doctor) {
    if (err) return res.status(500).send("There was a problem finding the doctor.");
    if (doctor == null) return res.status(404).send("No such doctor exists.");

    let privateKey = doctor.private_key;
    console.debug("Healthrecord: " + healthrecord);
    console.debug("Key: " + key);
    console.debug("Doctor's private key: " + privateKey);
    console.debug("Doctor's public key: " + req.params.id);
    console.debug("Patient Identifier: " + patientID);

    console.log("------------------ TEMPORARY STEP (Mobile App will do this) ------------------")
    console.log("Healthrecord is currently: " + healthrecord);
    console.log("Simulating an encrypted healthrecord - doing encryption");
    healthrecord = crypto.encryptStringWithSymmetricKey(healthrecord, key)
    console.log("The encrypted healthrecord: " + healthrecord);

    console.log("Key is currently: " + key);
    console.log("Simulating an encrypted key - doing encryption");
    key = crypto.encryptStringWithPublicKey(key, req.params.id);
    console.log("The encrypted key: " + key);
    console.log("------------------------------------------------------------------------------")

    // decrypt key with doctor's private key
    console.log("Decrypting key");
    let decryptedKey = crypto.decryptStringWithPrivateKey(key, privateKey);
    console.log ("The decrypted key: " + decryptedKey);

    // use decryptedKey to decrypt healthrecord
    console.log("Decrypting healthrecord");
    let decryptedHR = crypto.decryptStringWithSymmetricKey(healthrecord, decryptedKey);
    console.log ("The decrypted healthrecord: " + decryptedHR);

    // hash the decryptedHR, verify with the one on ETH blockchain (it should already be there!)
    let recordHash = crypto.computeStringHash(decryptedHR);

    truffle_connect.getRecordHash(patientID, contract_manager, (answer) => {
      let storedHash = answer;

      if (answer === "ERROR 404") {
        console.log("ETH_WARNING: Skipping verification: Encountered internal error when trying to get record hash from ethereum");
      } else if (storedHash === '') {
        console.log("ETH_WARNING: Skipping verification: Record hash not found on ethereum")
      } else if (recordHash !== storedHash) {
        console.log("ETH_WARNING: MedicalRecords tempered with: Healthrecord hash is " + recordHash + ", and blockchain hash is " + storedHash);
        return res.status(404).send("ERROR: Hash of healthrecord: " + recordHash + " does not equate to hash on blockchain: " + storedHash);
      } else {
        console.debug("Healthrecord hash is " + recordHash + ", and blockchain hash is " + storedHash);
        console.log("Hashes are equal - verified healthrecord with blockchain successfully.");
      }

      // cache HR in db
      HealthRecord.findByIdAndUpdate(patientID, {'_id': patientID, 'healthrecord': decryptedHR}, 
      { upsert: true, new: true, setDefaultsOnInsert: true }, function(error, result) {
        if (err) return res.status(500).send("There was a problem adding the healthrecord to the database.");
        console.log("Healthrecord successfully cached in the database.");

          // grant access to decryptedHR to doctor in the DB
          let authorizedHRs = doctor.authorized_healthrecords;
          let authorizedHRArr = authorizedHRs.split(',');
          if (authorizedHRArr.indexOf(patientID) === -1) { // if not already authorized
            console.log("Healthrecord not yet authorized, authorizing..")
            if (authorizedHRs === "") {
              authorizedHRs = '' + patientID;
            } else {
              authorizedHRs += ',' + patientID;
            }
            console.log("New authorizedHRs: " + authorizedHRs);
            // update authorizedHRs in the db
            Doctor.update({_id: doctor._id}, {
              authorized_healthrecords: authorizedHRs
            }, function(err, update, resp) {
              if (err) return res.status(500).send("There was a problem updating the authorized_healthrecords for doctor in the database.");
              console.log("Authorization successfully updated in the database");
              res.status(200).send("Successfully authorized healthrecord for access by doctor"); 
            });
          } else {
            console.log("Healthrecord already authorized for this doctor.");
            res.status(200).send("Successfully authorized healthrecord for access by doctor"); 
          }
      });
    });
  });
});

// add record hash into blockchain
app.get('/recordhash/:id', (req, res) => {
  console.log("**** GET /recordhash/:id ****");
  console.log(req.body);
  patientID = req.params.id;

  if (!patientID) res.status(404).send("There must be a patient_id specified in the params.");

  truffle_connect.getRecordHash(patientID, contractManager, (answer) => {
    if (answer === "ERROR 404") {
      console.log("ETH_WARNING: Encountered error when trying to get record hash from ethereum");
      return res.status(500).send("There was a problem finding the healthrecord hash.");
    }
    res.status(200).send(answer);
  });
});

// add record hash into blockchain
app.post('/recordhash', (req, res) => {
  console.log("**** POST /recordhash ****");
  console.log(req.body);
  patientID = req.body.patient_id;
  healthrecord = req.body.healthrecord;

  if (!patientID) res.status(404).send("There must be a patient_id specified in the body.");
  if (!healthrecord) res.status(404).send("There must be a healthrecord specified in the body.");

  let recordHash = crypto.computeStringHash(healthrecord);

  truffle_connect.setRecordHash(patientID, recordHash, contractManager, (answer) => {
    if (answer === "ERROR 404") {
      console.log("ETH_WARNING: Encountered error when trying to set record hash in ethereum");
      return res.status(500).send("There was a problem setting the healthrecord hash.");
    }
    res.status(200).send("Successfully added hash into blockchain");
  });
});

app.get('/contractmanager', (req, res) => {
  console.log("**** GET /contractmanager ****");

  truffle_connect.getContractManager((answer) => {
    if (answer === "ERROR 404") {
      console.log("ETH_WARNING: Encountered error when trying to get contract manager from ethereum");
      if (err) return res.status(500).send("There was a problem getting the contract manager.");
    }
    res.status(200).send(answer);
  });
});


// fetches all HRs
app.get('/healthrecord', (req, res) => {
  console.log("**** GET /healthrecord ****");

  HealthRecord.find({}, function(err, healthrecords) {
    if (err) return res.status(500).send("There was a problem finding the healthrecords.");
    res.status(200).send(healthrecords);
  });
});

// fetches a HR
app.get('/healthrecord/:id', (req, res) => {
  console.log("**** GET /healthrecord/:id ****");

  HealthRecord.findById(req.params.id, 'healthrecord', function(err, healthrecord) {
    if (err) return res.status(500).send("There was a problem finding the healthrecord.");
    if (healthrecord == null) return res.status(404).send("No such healthrecord exists.");
    res.status(200).send(healthrecord);
  });
});

// inserts a HR
app.post('/healthrecord', (req, res) => {
  console.log("**** POST /healthrecord ****");
  console.log(req.body);
  patientID = req.body.patient_id;
  healthrecord = req.body.healthrecord;

  if (!patientID) res.status(404).send("There must be a patient_id specified in the body.");
  if (!healthrecord) res.status(404).send("There must be a healthrecord specified in the body.");

  HealthRecord.create({
    _id: patientID,
    healthrecord: healthrecord
  }, 
  function (err, healthrecord) {
      if (err) return res.status(500).send("There was a problem adding the information to the database.");
      res.status(200).send(healthrecord);
  });
});

// updates a HR
app.post('/healthrecord/:id', (req, res) => {
  console.log("**** POST /healthrecord/:id ****");
  console.log(req.body)

  // update hash of HR on blockchain
  console.log("Checking hash of HR on blockchain - to see if update of hash is necessary")

  console.log("Healthrecord is not in blockchain - no update necessary.")

  // store updated HR on db
  HealthRecord.update({_id: req.params.id}, req.body, function(err, update, resp) {
    if (err) return res.status(500).send("There was a problem updating the healthrecord in the database.");
    res.status(200).send("Successfully updated.");
  });
});

app.listen(port, () => {

  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    truffle_connect.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    truffle_connect.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }
  console.log("Express Listening at http://localhost:" + port);
  truffle_connect.start(function (answer) {
    accounts = answer;
    contractManager = accounts[0];
    console.log("Contract Manager: " + contractManager);
    console.log("Accounts: " + accounts);
  })
});
