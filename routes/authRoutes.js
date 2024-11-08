// megan
/* Import express & define router */
const express = require('express');
const router = express.Router();


/* Import Multer & Path */
const multer = require('multer'); // This is only if there will be file uploads
const path = require('path');

/* Import Controllers */
const authController = require('../controllers/authController.js');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        if (file.fieldname === 'profilePicture') {
            uploadPath = path.join(__dirname, '../public/profile-pictures');
        } else if (file.fieldname === 'enrollmentProof') {
            uploadPath = path.join(__dirname, '../public/enrollment-proofs');
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

/* Define Routes */
// router.get('/register', (req, res) => {
//     res.render('user/register', {
//         title: "Register",
//         css: ["register.css"],
//         layout: "bodyOnly",
//     });
// });


// router.post('/new', upload.fields([{ name: 'profilePicture' }, { name: 'enrollmentProof' }]), (req, res) => {
//     authController.uploadUser(req, res);
//     console.log('Request files:', req.files); // Debugging: Check the request files
// });

// Logout Route
// router.get('/logout', (req, res) => {
//     req.logout(function(err) {
//         if (err) { s
//             console.log(err); 
//             return res.status(500).send('Error logging out'); 
//         }
//         req.session.destroy((err) => {
//             if (err) {
//                 console.log(err);
//                 return res.status(500).send('Error clearing session');
//             }
//             res.redirect('/'); // Redirect to login after logout
//         });
//     });
// });

router.get('/verify-email/:token', authController.verifyEmail);

module.exports = router; // Export router so it can be used in app.js