const mongoose = require('mongoose');
const TokenSpecsSchema = mongoose.Schema({
    // demos: { type: Array}
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    decimals: { type: Number, required: true},
    address: { type: String, required: true },
    logoURI: { type: String },
    platform: { type: String }
    // data: {type: Object}
});
// inbox: { type: mongoose.Schema.Types.ObjectId, ref: 'Inbox', required: true },
module.exports = mongoose.model('TokenSpecs', TokenSpecsSchema);
 