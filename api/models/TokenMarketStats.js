const mongoose = require('mongoose');
const TokenMarketStatsSchema = mongoose.Schema({
    token:{ type: mongoose.Schema.Types.ObjectId, ref: "TokenSpecs",  required: true  },
    totalSupply: { type: String, },
    circulatingSupply: { type: String,  },
    price: { type: Number, },
    volume: { type: String, },
    timestamp: { type: String,  }
});
// inbox: { type: mongoose.Schema.Types.ObjectId, ref: 'Inbox', required: true },
module.exports = mongoose.model('TokenMarketStats', TokenMarketStatsSchema);


