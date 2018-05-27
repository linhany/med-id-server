const {MONGOOSE_URL} = require('./secrets');

let mongoose = require('mongoose');
mongoose.connect(MONGOOSE_URL);
