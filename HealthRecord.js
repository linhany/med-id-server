const mongoose = require('mongoose');  
let HealthRecordSchema = new mongoose.Schema({
    _id: String,
    healthrecord: String
});
mongoose.model('HealthRecord', HealthRecordSchema);
module.exports = mongoose.model('HealthRecord');
