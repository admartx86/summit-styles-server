const router = require('express').Router();
const passport = require('passport');
const { generatePassword } = require('../lib/passwordUtils');
const User = require('../models/user');
const Product = require('../models/product');

router.post('/login', (req, res, next) => {
  passport.authenticate('local', { keepSessionInfo: true }, async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed', info });
    }
    if (req.session.cart && req.session.cart.length > 0) {
      const loggedInUser = await User.findById(user._id);
      req.session.cart.forEach(sessionItem => {
        const itemIndex = loggedInUser.cart.findIndex(cartItem => cartItem.id === sessionItem.id && cartItem.size === sessionItem.size);
        if (itemIndex > -1) {
          loggedInUser.cart[itemIndex].quantity += sessionItem.quantity;
        } else {
        loggedInUser.cart.push(sessionItem);
        }
      });
      await loggedInUser.save();
      req.session.cart = [];
    }
    req.login(user, async (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      return res.status(200).json({ message: 'Authentication successful', user });
    });
  })(req, res, next);
});

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
    res.json({ message: 'Registration successful', user });  // Sending response back
  })
  .catch((error) => {
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
    if (!product) {
      console.error(`Product with ID ${productId} not found in database`);
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } 
  catch (error) {
    console.error("An error occurred while fetching product:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post("/add-to-cart", async (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  const idAsNumber = Number(req.body.item.productId);
  const newItem = {
    id: idAsNumber,
    quantity: req.body.item.quantity,
    name: req.body.item.productName,
    image: req.body.item.productImage,
    size: req.body.item.selectedSize,
    color: req.body.item.selectedColor,
    description: null,
    category: null,
    price: req.body.item.productPrice
  };
  req.session.cart.push(newItem);
  req.session.save((err) => {
    if (err) {
      return res.status(500).send("Failed to save to session");
    }
  });
  if (req.isAuthenticated()) {
    try {
      const user = await User.findById(req.user._id);
      user.cart.push(newItem);
      await user.save();
    }
    catch (err) {
      return res.status(500).send("Failed to add to user's cart");
    }
  }
  return res.status(200).send("Item added to cart");
});

router.get("/get-cart", async (req, res) => { 
  if (req.isAuthenticated()) {
    try {
      const user = await User.findById(req.user._id).populate('cart._id');
      return res.status(200).json({ cart: user.cart });
    }
    catch (err) {
      return res.status(500).send("Failed to get cart");
    }
  }
  else {
    const sessionCart = req.session.cart || [];
    return res.status(200).json({ cart: sessionCart });
  }
});

module.exports = router;