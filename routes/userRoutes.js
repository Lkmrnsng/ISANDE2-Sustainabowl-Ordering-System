const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Profile routes
router.get('/profile', isAuthenticated, userController.viewProfile);
router.put('/profile', isAuthenticated, userController.editProfile);
router.delete('/profile', isAuthenticated, userController.deleteProfile);

module.exports = router;