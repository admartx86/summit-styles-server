const router = require('express').Router();
const passport = require('passport');
const { generatePassword } = require('../lib/passwordUtils');
const User = require('../models/user');
const Product = require('../models/product');

router.post('/logout', (req, res) => {
  try {
    console.log("Session before logout:", req.session);

    req.logout(() => {
      console.log("Logged out.");
      
      // Now destroy the session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction failed:", err);
          return res.status(500).json({ message: 'Logout failed' });
        }
        
        console.log("Session after destroy:", req.session);
        
        // Send success response
        res.status(200).json({ message: 'Logout successful' });
      });
    });

  }
  catch (err) {
    console.error("Logout failed:", err);
    res.status(500).json({ message: 'Logout failed' });
  }
});


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
    if (req.session.favorites && req.session.favorites.length > 0) {
      const loggedInUser = await User.findById(user._id);
      req.session.favorites.forEach(sessionItem => {
        const itemIndex = loggedInUser.favorites.findIndex(favoritesItem => favoritesItem.id === sessionItem.id);
        if (itemIndex > -1) {
          loggedInUser.favorites[itemIndex].quantity += sessionItem.quantity;
        } else {
        loggedInUser.favorites.push(sessionItem);
        }
      });
      await loggedInUser.save();
      req.session.favorites = [];
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

router.post("/add-to-favorites", async (req, res) => {
if (!req.session.favorites) {
    req.session.favorites = [];
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
  req.session.favorites.push(newItem);
  req.session.save((err) => {
    if (err) {
      return res.status(500).send("Failed to save to session");
    }
  });
  if (req.isAuthenticated()) {
    try {
      const user = await User.findById(req.user._id);
      user.favorites.push(newItem);
      await user.save();
    }
    catch (err) {
      return res.status(500).send("Failed to add to user's favorites");
    }
  }
  console.log(req.session.favorites);
  return res.status(200).send("Item added to favorites");
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

// router.get("/get-favorites", async (req, res) => { 
//   if (req.isAuthenticated()) {
//     try {
//       const user = await User.findById(req.user._id).populate('favorites._id');
//       return res.status(200).json({ favorites: user.favorites });
//     }
//     catch (err) {
//       return res.status(500).send("Failed to get favorites");
//     }
//   }
//   else {
//     const sessionFavorites = req.session.favorites || [];
//     return res.status(200).json({ favorites: sessionFavorites });
//   }
// });

router.get("/get-favorites", async (req, res) => { 
  if (req.isAuthenticated()) {
    try {
      const user = await User.findById(req.user._id).populate('favorites._id');
      console.log("user.favorites", user.favorites);
      return res.status(200).json({ favorites: user.favorites });
    }
    catch (err) {
      console.log("err", err);
      return res.status(500).send("Failed to get favorites");
    }
  }
  else {
    console.log("req.session.favorites", req.session.favorites);
    const sessionFavorites = req.session.favorites || [];
    return res.status(200).json({ favorites: sessionFavorites });
  }
});

router.delete("/remove-from-favorites/:productId", async (req, res) => {

  const { productId } = req.params;
  console.log("Received productId:", productId); // Debugging
  if (req.isAuthenticated()) {
    try {
      const user = await User.findById(req.user._id);
      const itemIndex = user.favorites.findIndex(favoritesItem => favoritesItem.id === Number(productId));
      if (itemIndex > -1) {
        user.favorites.splice(itemIndex, 1);
        console.log("req.user.favorite", req.user.favorites);
        await user.save();
      }
    }
    catch (err) {
      return res.status(500).send("Failed to remove from favorites");
    }
  }
  else {
    const itemIndex = req.session.favorites.findIndex(favoritesItem => favoritesItem.id === Number(productId));
    if (itemIndex > -1) {
      req.session.favorites.splice(itemIndex, 1);
      console.log("req.session.favorite", req.session.favorites);
    }
  }
  return res.status(200).send("Item removed from favorites");

});

router.delete("/remove-from-cart/:productId/:size", async (req, res) => {
  
    const { productId, size } = req.params;
    console.log("Received productId:", productId); // Debugging
    if (req.isAuthenticated()) {
      try {
        const user = await User.findById(req.user._id);
        const itemIndex = user.cart.findIndex(cartItem => cartItem.id === Number(productId) && cartItem.size === size);
        if (itemIndex > -1) {
          user.cart.splice(itemIndex, 1);
          console.log("req.user.cart", req.user.cart);
          await user.save();
        }
      }
      catch (err) {
        return res.status(500).send("Failed to remove from cart");
      }
    }
    else {
      const itemIndex = req.session.cart.findIndex(cartItem => cartItem.id === Number(productId) && cartItem.size === size);
      if (itemIndex > -1) {
        req.session.cart.splice(itemIndex, 1);
        console.log("req.session.cart", req.session.cart);
      }
    }
    return res.status(200).send("Item removed from cart");
  
  });

module.exports = router;