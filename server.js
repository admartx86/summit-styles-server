if (process.env.NODE_ENV != 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();

const connectToDb = require('./config/connectToDb');
const mongooseConnection = connectToDb();

const cors = require('cors');
const corsOptions = {
    origin: /^http:\/\/localhost(:\d+)?$/,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const session = require('express-session');
const MongoStore = require('connect-mongo');
const sessionStore = MongoStore.create({ 
    mongoUrl: process.env.DB_URL,
    collection: 'sessions'
});
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

const passport = require('passport');
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

const routes = require('./routes');
app.use(routes);

app.listen(process.env.PORT);