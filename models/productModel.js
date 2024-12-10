const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema);
