/* Dependencies */
const express = require('express'); // Import Express, allows you to create a server and routes
const exphbs = require('express-handlebars'); // Import Express-Handlebars, allows you to create views
const mongoose = require('mongoose'); // Import Mongoose, allows you to connect to MongoDB
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // For hashing passwords
const User = require('./models/User'); // Import the User model


/* Connect to MongoDB and then Listen for Requests */
/**
 * admin is the username
 * 12345 is the password
 * itisdev-mvp is the database name
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
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');



/* Initialize Express App */
const app = express();

/* Middleware */
app.use(express.static(__dirname + "/public")); // Set static folder
app.use(express.urlencoded({ extended: true })); // Allows you to access req.body for POST routes
app.use(bodyParser.urlencoded({ extended: false }));

// Use Handlebars as the view engine
const hbs = exphbs.create({
    extname: 'hbs',
    helpers: {
        // JSON
        json: function (context) {
            return JSON.stringify(context);
        },
        eq: function (a, b) {
            return a === b;
        },
        join: function (arr, separator) {
        return arr.join(separator);
        },
        formatTime: function (hour, minute) {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        },
        formatTime1: function(timeObj) {
            return `${timeObj.hour.toString().padStart(2, '0')}:${timeObj.minute.toString().padStart(2, '0')}`;
        },
        formatTime2: function(time) {
            if (!time || !time.hour || !time.minute) {
                return '';
              }
              
              const hour = time.hour.toString().padStart(2, '0');
              const minute = time.minute.toString().padStart(2, '0');
              
              return `${hour}:${minute}`;
        },
        formatDate: function (date) {
        return new Date(date).toLocaleDateString();
        },
        formatDates: function(dates) {
            return Array.isArray(dates) ? dates.map(date => new Date(date).toLocaleDateString()).join(', ') : '';
        },
        formatMonth(date) {
        return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(date);
        }, 
        isEndOfWeek(index) {
            return (index + 1) % 7 === 0;
        },
        formatDuration(startTime, endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const durationMs = end - start;
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 0) {
              return `${hours} hr ${minutes} min`;
            } else {
              return `${minutes} min`;
            }
        },
        array: function() {
            return Array.prototype.slice.call(arguments, 0, -1);
        },
        includes: function(item, list) {
            return list.includes(item);
        },
        includes2: function(array, value) {
            if (Array.isArray(array)) {
                return array.includes(value);
            }
            return false;
        },
        isActive: function(rideStatus, responseStatus) {
            if (rideStatus === 'completed' || responseStatus === 'rejected' || rideStatus === 'cancelled') {
                return false;
            } else {
                return true;
            }
        },
        gte: function(a, b) {
            return a >= b;
        },
        not: function (a){
            return !a
        },
        firstChar: function (str) {
            return str.charAt(0).toUpperCase();
        },

    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
    
});

app.use(express.json());
app.engine("hbs", hbs.engine); // Inform the handlebars engine that file extension to read is .hbs
app.set("view engine", "hbs"); // Set express' default file extension for views as .hbs
app.set("views", "./views"); // Set the directory for the views

// Use sessions
app.use(flash());
app.use(session({
    secret: 'CKA8mqzpyGEuQRCZHJHhK39qCbtxYwu8',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: dbURI,
        collectionName: 'sessions' // Optional: specify the collection name
    }),
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride('_method')); // To allow the POST logout form to become a DELETE request

// Middleware to check and refresh session
app.use((req, res, next) => {
    if (req.session.cookie.maxAge && req.session.cookie.maxAge < 10 * 60 * 1000) {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // Refresh to 24 hours
    }
    next();
});

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Middleware to log session info (for debugging)
app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Is Authenticated:', req.isAuthenticated());
    next();
});


const City = require('./models/City');

app.use((req, res, next) => {
    res.locals.user = req.user || null; // Make user available in all views
    next();
});

app.get('/', (req, res) => {
    res.render('index', {
        title: "Home",
        css: ["index.css"],
        layout: "bodyOnly"
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
    if (req.isAuthenticated()) { // Assuming you are using Passport.js
        res.locals.user = req.user;
        return next();
    }
    res.redirect('/login');
}


const cron = require('node-cron');
const { autoRejectDueBookings } = require('./controllers/bookingController');

// // Schedule the task to run every hour
// cron.schedule('0 * * * *', () => {
//     console.log('Running auto-reject task');
//     autoRejectDueBookings();
// });

// Scheduled Task Tester (run tasks per minute)
cron.schedule('* * * * *', () => {
    console.log('Running auto-reject task');
    autoRejectDueBookings();
}); 