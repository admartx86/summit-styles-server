const router = require('express').Router();
const passport = require('passport');
const { generatePassword } = require('../lib/passwordUtils');
const User = require('../models/user');
const Product = require('../models/product');

router.post(
    '/login',
    passport.authenticate(
        'local',
        {
            failureRedirect: '/login-failure', 
            successRedirect: '/login-success' 
        }
    ), 
    (req, res, next) => {
    }
);

router.post('/register', (req, res, next) => {
    const saltHash = generatePassword(req.body.password);
    const salt = saltHash.salt;
    const hash = saltHash.hash;
    const newUser = new User(
        {
        username: req.body.username,
        hash: hash,
        salt: salt
        }
    );

    newUser.save()
    .then((user) => {
        console.log(user);
        res.json({ message: 'Registration successful', user });  // Sending response back
    })
    .catch((error) => {
        console.log(error);
        res.status(500).json({ message: 'An error occurred' });
    });

});

router.get('/products', (req, res) => {
    Product.find({})
        .then(products => {
            res.json(products);
        })
        .catch(error => {
            res.status(500).json({ error: 'An error occurred' });
        });
});

router.get('/products/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        const product = await Product.findOne({ id: productId });
        // const product = await Product.findOne();

        if (!product) {
            console.error(`Product with ID ${productId} not found in database`);
            return res.status(404).json({ message: 'Product not found' });
        }

        console.log(`Product with ID ${productId} found in database`);
        console.log(`Sending product data: ${JSON.stringify(product)}`);
        res.status(200).json(product);

    } catch (error) {
        console.error("An error occurred while fetching product:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post("/add-to-cart", (req, res) => {
    if (!req.session.cart) {
      req.session.cart = [];
    }
    req.session.cart.push(req.body.item);
    req.session.save((err) => {
      if (err) {
        return res.status(500).send("Failed to save to session");
      }
      console.log("Session:", req.session);
      console.log("Session ID:", req.sessionID);
      console.log("Session Cart:", req.session.cart);
      return res.status(200).send("Item added to cart");
    });
  });

router.get("/get-cart", (req, res) => {
    const cart = req.session.cart || [];
    console.log("Request Headers:", req.headers);
    console.log("Backend Cart:", req.session.cart);
    res.status(200).json({ cart });
});

module.exports = router;