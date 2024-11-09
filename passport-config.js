const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./models/User.js');

function initialize(passport) {
    const authenticateUser = async (email, password, done) => {
        try {
            // Find the user in the database
            const user = await User.findOne({ email: email });

            // If the user does not exist, return an error
            if (user == null) {
                return done(null, false, { message: 'No user with that email.' });
            }

            // If user has been deactivated (deleted)
            if (user.userID == '10000') {
                return done(null, false, { message: 'That account was deleted.' });
            }

            // If the user exists and is active, compare the password
            if (await bcrypt.compare(password, user.password)) {
                // Store both MongoDB _id and userID
                return done(null, {
                    _id: user._id,
                    userID: user.userID,
                    name: user.name,
                    email: user.email,
                    usertype: user.usertype
                });
            } else {
                return done(null, false, { message: 'Password incorrect.' });
            }
        } catch (err) {
            return done(err);
        }
    };

    passport.use(new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        authenticateUser
    ));

    passport.serializeUser((user, done) => {
        // Serialize both _id and userID
        done(null, { _id: user._id, userID: user.userID });
    });

    passport.deserializeUser(async (sessionUser, done) => {
        try {
            const user = await User.findOne({ _id: sessionUser._id });
            if (user) {
                // Return user data with both _id and userID
                return done(null, {
                    _id: user._id,
                    userID: user.userID,
                    name: user.name,
                    email: user.email,
                    usertype: user.usertype
                });
            }
            return done(null, false);
        } catch (err) {
            return done(err);
        }
    });
}

module.exports = initialize;