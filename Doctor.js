const mongoose = require('mongoose');  
let DoctorSchema = new mongoose.Schema({
    _id: String,
    private_key: String,
    authorized_healthrecords: String
});
mongoose.model('Doctor', DoctorSchema);
module.exports = mongoose.model('Doctor');
