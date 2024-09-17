// megan
/* Import express & define router */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');


/* Import Controllers */
const userController = require('../controllers/userController.js');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        if (file.fieldname === 'driverLicense') {
            uploadPath = path.join(__dirname, '../public/driver-licenses');
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });


router.get('/newdriver', userController.getNewDriverForm);
router.post('/regDriver', upload.single('driverLicense'), (req, res) => {
    userController.createDriver(req, res);
});

router.get('/profile', userController.viewProfile);
router.put('/profile', userController.editProfile);
router.delete('/profile', userController.deleteProfile);
router.post('/withdraw', userController.withdrawBalance);
router.get('/:userID', userController.getProfilePage);

module.exports = router; 