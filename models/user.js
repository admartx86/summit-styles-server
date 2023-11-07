const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  hash: String,
  salt: String,
  cart: [
    {
      _id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product'
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
    }
  ],
favorites: [
    {
      _id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product'
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
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
      