const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  objectDocId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "userType",
  },
  token: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
  expired_at: {
    type: Date,
    expires: 3600,
    
  },
});

module.exports = mongoose.model("Token", tokenSchema);
