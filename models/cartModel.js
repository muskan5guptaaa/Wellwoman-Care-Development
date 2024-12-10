const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', 
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    products: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product", // Reference to the Product model
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            default: 1,
          },
        }
        ]

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Cart', cartSchema);
