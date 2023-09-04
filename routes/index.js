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

module.exports = router;