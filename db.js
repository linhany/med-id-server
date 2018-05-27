let MONGOOSE_URL = process.env.MONGOOSE_URL;
const fs = require('fs');
if (fs.existsSync('./secrets.js')) {
  const secrets = require('./secrets');
  MONGOOSE_URL = secrets.MONGOOSE_URL;
}

let mongoose = require('mongoose');
mongoose.connect(MONGOOSE_URL);
