const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  hash: String,
  salt: String,
  cart: [
    {
      _id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product'  // assuming 'Product' is your product model name
      },
      quantity: Number,
      price: Number,
      name: String,     
      image: String,
      size: String,
      color: String,
      description: String,
      category: String,
      id: Number
      // Adding the ref lets you populate product details later
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
      