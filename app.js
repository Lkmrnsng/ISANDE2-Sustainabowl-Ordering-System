/* Dependencies */
const express = require('express'); // Import Express, allows you to create a server and routes
const exphbs = require('express-handlebars'); // Import Express-Handlebars, allows you to create views
const mongoose = require('mongoose'); // Import Mongoose, allows you to connect to MongoDB
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // For hashing passwords


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


// Import Models
const User = require('./models/User');
const Request = require('./models/Request');
const Order = require('./models/Order');
const Item = require('./models/Item');



/* Initialize Express App */
const app = express();

// Middleware
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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

/* Middleware to Simulate User Login (For Testing) */
app.use((req, res, next) => {
    if (!req.session.userId) {
        req.session.userId = 10001; // Replace with your test user ID
        req.session.userType = 'Customer';
        console.log(`Simulated login with userId: ${req.session.userId}`);
    }
    next();
});

// Routes
app.use('/customer', customerRoutes);

app.use('/chat', chatRoutes);

app.use('/marketplace', marketplaceRoutes);

app.use('/review', reviewRoutes);


// app.get('/', (req, res) => {
//     res.render('index', {
//         title: "Home",
//         css: ["index.css"],
//         layout: "main"
//     });
// });

// megan test 
app.get('/', async (req, res) => {
    try {
        const user = await User.findOne({ userID: req.session.userId }).lean(); // Query by userID

        console.log('User found:', user);
        res.render('marketplace_catalog', {
            title: "Home",
            css: ["marketplace_catalog.css", "marketplace.css"],
            layout: "marketplace",
            user: user || null
        });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).send('Internal Server Error');
    }
});


// ishi test
// app.get('/', (req, res) => {
//     res.render('logistics_foodprocess', {
//         title: "Home",
//         css: ["logistics_foodprocess.css"],
//         layout: "main"
//     });
// });

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