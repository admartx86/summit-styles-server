const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
        id: String,
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