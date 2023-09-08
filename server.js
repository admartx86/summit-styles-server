require('dotenv').config();

const fs = require('fs');
const https = require('https');

const privateKeyPath = process.env.PRIVATE_KEY_PATH;
const certificatePath = process.env.CERTIFICATE_PATH;
const caPath = process.env.CA_PATH;
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const certificate = fs.readFileSync(certificatePath, 'utf8');
const ca = fs.readFileSync(caPath, 'utf8');

const credentials = { key: privateKey, cert: certificate, ca: ca };

const express = require('express');
const app = express();

const connectToDb = require('./config/connectToDb');
const mongooseConnection = connectToDb();

const cors = require('cors');

// const corsOptions = {
//     origin: 'https://summitstyles.dev',
//     credentials: true
// };

const corsOptions = {
    origin: function (origin, callback) {
        const whitelist = [/^https:\/\/summitstyles\.dev$/, /^http:\/\/localhost:(\d+)$/, /^http:\/\/172.233.221.154:8080$/];
        if (origin) {
            if (whitelist.some(allowedOrigin => allowedOrigin.test(origin) || allowedOrigin === origin)) {
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS'))
            }
        } else {
            // Handle the case where origin is null or undefined
            callback(new Error('Origin not provided'), false);
        }
    },
    credentials: true
};

// const corsOptions = {
//     origin: function (origin, callback) {
//         const whitelist = ['https://summitstyles.dev', 'localhost:8080'];
//         if (whitelist.some(allowedOrigin => allowedOrigin.test(origin) || allowedOrigin === origin)) {
//             callback(null, true)
//         } else {
//             callback(new Error('Not allowed by CORS'))
//         }
//     },
//     credentials: true
// };

// const corsOptions = {
//     origin: '/^http:\/\/localhost(:\d+)?$/', 'https://summitstyles.dev'
// };

app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src https://trusted.com; child-src 'none'");
    next();
});
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

if (process.env.NODE_ENV === 'development') {
    const http = require('http');
    http.createServer(app).listen(process.env.PORT);
    console.log('HTTP Backend Server running.')
}
else {
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(process.env.PORT, () => {
        console.log('HTTPS Backend Server running.');
    });
};