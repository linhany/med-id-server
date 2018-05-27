let {MONGOOSE_URL} = require('./secrets');
MONGOOSE_URL = MONGOOSE_URL || process.env.MONGOOSE_URL;

let mongoose = require('mongoose');
mongoose.connect(MONGOOSE_URL);
