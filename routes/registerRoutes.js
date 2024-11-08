/* Import express & define router */
const express = require('express');
const router = express.Router();
module.exports = router; // Export router so it can be used in app.js

/* Import Controllers */
const registerController = require('../controllers/registerController');

const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, 'public/profile-pictures/');
    },
    filename: function (req, file, cb){
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

router.get('/', (req, res) => {
    res.render('../views/register.hbs', {
        layout: 'landing.hbs', // Layout file to use
        title: 'Account Registration', // Title of the page
        css: ['register.css'], // Array of CSS files to include
        view: 'register' // View file to use
    })
});
router.post('/new', upload.single('upload-pfp'), (req, res) => {
    registerController.uploadUser(req, res);
});