const crypto = require('crypto');
const NodeRSA = require('node-rsa');

// symmetric key constants
const algorithm = 'aes256';
const inputEncoding = 'utf8';
const outputEncoding = 'base64';

let generateKeys = () => {
  const key = new NodeRSA({b: 128});
  let privateKey = key.exportKey('pkcs8');
  let publicKey = key.exportKey('pkcs8-public');
  return { publicKey: Buffer.from(publicKey).toString('base64'), privateKey: Buffer.from(privateKey).toString('base64')};
}

let encryptStringWithPublicKey = (toEncrypt, publicKeyB64) => {
  const publicKey = Buffer.from(publicKeyB64, 'base64').toString('utf8');
  return crypto.publicEncrypt(publicKey, Buffer.from(toEncrypt)).toString('base64')
}

let decryptStringWithPrivateKey = (toDecrypt, privateKeyB64) => {
  const privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
  return crypto.privateDecrypt(privateKey, Buffer.from(toDecrypt)).toString('utf8')
}

let encryptStringWithSymmetricKey = (toEncrypt, key) => {
  let cipher = crypto.createCipher(algorithm, key);
  let ciphered = cipher.update(toEncrypt, inputEncoding, outputEncoding);
  ciphered += cipher.final(outputEncoding);
  return ciphered;
}

let decryptStringWithSymmetricKey = (toDecrypt, key) => {
  let decipher = crypto.createDecipher(algorithm, key);
  let deciphered = decipher.update(toDecrypt, outputEncoding, inputEncoding);
  deciphered += decipher.final(inputEncoding);
  return deciphered;
}

let computeStringHash = (toHash) => {
  return crypto.createHash('md5').update(toHash).digest("hex");
}

module.exports = {
  generateKeys: generateKeys,
  encryptStringWithPublicKey: encryptStringWithPublicKey,
  decryptStringWithPrivateKey: decryptStringWithPrivateKey,
  encryptStringWithSymmetricKey: encryptStringWithSymmetricKey,
  decryptStringWithSymmetricKey: decryptStringWithSymmetricKey,
  computeStringHash: computeStringHash
}
