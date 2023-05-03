const mongoose = require('mongoose');
const TokenMarketStatsSchema = mongoose.Schema({
    token:{ type: mongoose.Schema.Types.ObjectId, ref: "TokenSpecs",  required: true  },
    totalSupply: { type: String, },
    // circulatingSupply: { type: String,  },
    prices: { type: Array, },
    volumes: { type: Array , },

});
module.exports = mongoose.model('TokenMarketStats', TokenMarketStatsSchema);


