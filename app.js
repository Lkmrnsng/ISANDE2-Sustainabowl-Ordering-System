/* Dependencies */
const express = require('express'); // Import Express, allows you to create a server and routes
const exphbs = require('express-handlebars'); // Import Express-Handlebars, allows you to create views
const mongoose = require('mongoose'); // Import Mongoose, allows you to connect to MongoDB
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // For hashing passwords
const User = require('./models/User'); // Import the User model


/* Connect to MongoDB and then Listen for Requests */
/**
 * dbuser1 is the username
 * PioneeringParagons2024 is the password
 * isande2 is the database name
 */
const dbURI = 'mongodb+srv://dbuser1:PioneeringParagons2024@isande2.zq1ez.mongodb.net/'; 
mongoose.connect(dbURI)
    .then((result) => {
        console.log("App connected to MongoDB Atlas ISANDE2 database.");
        /* If the DB connection was successful, listen for requests on localhost:3000 */
        app.listen(3000, () => {
            console.log("App started. Listening on port 3000.");
        });
    })
    .catch((err) => {
        console.log(err);
    });

// Imported for sessions
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const MongoStore = require('connect-mongo');

const initializePassport = require('./passport-config.js');
initializePassport(passport);

/* Imported Routes */


/* Initialize Express App */
const app = express();

// Use Handlebars as the view engine
const hbs = exphbs.create({
    extname: 'hbs',
    helpers: {
        // JSON helper
        json: function (context) {
            return JSON.stringify(context);
        },
        // Equality helper
        eq: function (a, b) {
            return a === b;
        }
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
});

// Setting up Handlebars engine
app.engine("hbs", hbs.engine); // Inform Express to use Handlebars as the engine
app.set("view engine", "hbs");  // Set default file extension for views to .hbs
app.set("views", "./views");    // Set the directory for the views

// Middleware
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.json());

// Use sessions
app.use(flash()); // Only call once
app.use(session({
    secret: 'CKA8mqzpyGEuQRCZHJHhK39qCbtxYwu8',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: dbURI,
        collectionName: 'sessions'
    }),
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.use(passport.initialize()); // Only call once
app.use(passport.session()); // Only call once

app.use(methodOverride('_method'));

// Middleware to check and refresh session
app.use((req, res, next) => {
    if (req.session.cookie.maxAge && req.session.cookie.maxAge < 10 * 60 * 1000) {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // Refresh to 24 hours
    }
    next();
});

// Middleware to log session info
app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Is Authenticated:', req.isAuthenticated());
    next();
});

// Make user available in all views
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// app.get('/', (req, res) => {
//     res.render('index', {
//         title: "Home",
//         css: ["index.css"],
//         layout: "main"
//     });
// });

// megan test 
app.get('/', (req, res) => {
    res.render('marketplace_catalog', {
        title: "Home",
        css: ["index.css"],
        layout: "marketplace"
    });
});


app.post('/login', 
    passport.authenticate('local', {
        failureRedirect: '/login-failed',
        failureFlash: true
    }),
    function(req, res) {
        if (req.body.rememberMe) {
            req.session.cookie.maxAge = 3 * 7 * 24 * 60 * 60 * 1000; // 3 weeks
        } else {
            req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
        }
        res.redirect('/'); 
    }
);


app.get('/login', (req, res) => {
    if(req.user){
        res.redirect('/')
    }
    res.render('user/login', {
        title: "Login",
        css: ["login.css"],
        layout: "bodyOnly",
        messages: req.flash('error')
    });
});

app.get('/login-failed', (req, res) => {
    res.render('user/login', {
        title: "Login",
        css: ["login.css"],
        layout: "bodyOnly",
        isFailed: true,
        messages: req.flash('error')
    });
});


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { //  using Passport.js
        res.locals.user = req.user;
        return next();
    }
    res.redirect('/login');
}


// const cron = require('node-cron');
// const { autoRejectDueBookings } = require('./controllers/bookingController');

// // // Schedule the task to run every hour
// // cron.schedule('0 * * * *', () => {
// //     console.log('Running auto-reject task');
// //     autoRejectDueBookings();
// // });

// // Scheduled Task Tester (run tasks per minute)
// cron.schedule('* * * * *', () => {
//     console.log('Running auto-reject task');
//     autoRejectDueBookings();
// }); 