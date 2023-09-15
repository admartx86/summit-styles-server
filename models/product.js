const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        id: Number,
        category: Array,
        image: String, 
        name: String,
        description: String,
        color: Array,
        size: Array,
        quantity: Number,
        price: Number
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;