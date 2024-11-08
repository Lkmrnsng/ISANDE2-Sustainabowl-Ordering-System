/* Dependencies */
const express = require('express'); // Import Express, allows you to create a server and routes
const exphbs = require('express-handlebars'); // Import Express-Handlebars, allows you to create views
const mongoose = require('mongoose'); // Import Mongoose, allows you to connect to MongoDB
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // For hashing passwords

// Imported for sessions
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const MongoStore = require('connect-mongo');
const initializePassport = require('./passport-config.js');
initializePassport(passport);

/* Imported Routes */
const customerRoutes = require('./routes/customerRoutes');
const chatRoutes = require('./routes/chatRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const registerRoutes = require('./routes/registerRoutes');

// Import Models
const User = require('./models/User');
const Request = require('./models/Request');
const Order = require('./models/Order');
const Item = require('./models/Item');
const Message = require('./models/Message');
const Review = require('./models/Review');
const Shipment = require('./models/Shipment');

/* Initialize Express App */
const app = express();

// Middleware
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Connect to MongoDB and then Listen for Requests */
/**
 * dbuser1 is the username
 * PioneeringParagons2024 is the password
 * isande2 is the database name
 */
const dbURI = 'mongodb+srv://dbuser1:PioneeringParagons2024@isande2.zq1ez.mongodb.net/ISANDE2'; 
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
        },
        ne: function (a, b) {
            return a !== b;
        },
        and: function () {
            return Array.prototype.every.call(arguments, (argument) => {
                return argument ? true : false;
            });
        },
        array: function() {
            return Array.from(arguments).slice(0, -1);
        },
        object: function() {
            const args = Array.from(arguments);
            const options = args.pop(); // Remove the Handlebars options object
            const obj = {};
            
            // Process arguments in pairs (key, value)
            for (let i = 0; i < args.length; i += 2) {
                obj[args[i]] = args[i + 1];
            }
            
            return obj;
        },
        //checkempty returns true if array is empty
        checkempty: function (array) {
            if (array.length > 0) {
                return false;
            } else {
                return true;
            }
        },
        //length helper
        length: function (array) {
            return array.length;
        },
        //Format Date
        formatDate: function (date) {
            if (!date) return '';
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(dateObj.getTime())) return '';
            return dateObj.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        },
    
        // For date with time
        formatDateTime: function (date) {
            if (!date) return '';
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(dateObj.getTime())) return '';
            return dateObj.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
    
        // For relative time (e.g., "2 days ago")
        formatRelativeDate: function (date) {
            if (!date) return '';
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(dateObj.getTime())) return '';
            
            const now = new Date();
            const diffTime = Math.abs(now - dateObj);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            return dateObj.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        },
        //Format An Array of Dates, separated by | 
        formatDates: function (dates) {
            return dates.map(date => date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })).join(' | ');
        },
        //formatDate2 helper
        formatDate2: function (date) {
            return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        },
        //formatDate3 helper
        formatDate3: function (date) {
            if (!date) return '';
            return new Date(date).toISOString().split('T')[0];
        },
        //formatAmount
        formatAmount: function (amount) {
            return amount.toLocaleString('en-US', { style: 'currency', currency: 'PHP' });
        },
        toString: function (value) {
            return value ? value.toString() : '';
        },
        log: function (){
            console.log.apply(console, arguments);
            return null;
        },
        hasBeenReviewed: function(orderId, reviews) {
            return reviews && reviews.some(review => review.orderID === orderId);
        },
        canBeReviewed: function(status) {
            return status === 'Delivered';
        },
        times: function(n, options) {
            let accum = '';
            for(let i = 0; i < Math.floor(n); i++)
                accum += options.fn(this);
            return accum;
        },
        formatNumber: function(number, decimals) {
            if (typeof number !== 'number') return number;
            return number.toFixed(decimals);
        },
        formatDateInput: function(date) {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
        },
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

// Make user available in all views
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// Routes
app.use('/customer', customerRoutes);
app.use('/chat', chatRoutes);
app.use('/marketplace', marketplaceRoutes);
app.use('/review', reviewRoutes);
app.use('/register', registerRoutes);

// ishi test
// app.get('/', (req, res) => {
//     res.render('logistics_foodprocess', {
//         title: "Home",
//         css: ["logistics_foodprocess.css"],
//         layout: "main"
//     });
// });

app.get('/', (req, res) => {
    // If user is authenticated, redirect to homepage
    if (req.isAuthenticated()) {
        res.redirect('/customer/dashboard'); // TODO: Redirect to appropriate user dashboard
    } else {
        // If user is not authenticated, redirect to login page
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('index', {
        title: "Home",
        css: ["index.css"],
        layout: "landing",
        messages: req.flash('error')
    });
});

app.post('/login', 
    passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true
    }),
    function(req, res) {
        // This function is for checking if remember me was clicked
        if (req.body.rememberMe) {
            req.session.cookie.maxAge = 3 * 7 * 24 * 60 * 60 * 1000; // Cookie expires after 3 weeks
        } else {
            req.session.cookie.expires = false; // Cookie expires at end of session
        }
      res.redirect('/customer/dashboard'); // TODO: Redirect to appropriate user dashboard
    }
);

app.delete('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
})