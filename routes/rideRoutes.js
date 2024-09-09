// luke
// routes/rideRoutes.js
const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');

// Function to check if user is a verified driver
function isAuthenticatedDriver(req, res, next) {
  if (req.user && req.user.isVerifiedDriver) {
    return next();
  } else {
    res.redirect('/login');
    req.flash('error', 'You must be a verified driver to access that page, please login first');
  }
}

// Function to check if user is a verified passenger 
function isAuthenticatedPassenger(req, res, next) {
  if (req.user && req.user.isVerifiedPassenger) {
    return next();
  } else {
    res.redirect('/login');
    req.flash('error', 'You must be a verified user to access that page, please login first');
  }
}



//Driver Controls

router.get('/driverhome', rideController.getDriverHome);
router.get('/myRides', isAuthenticatedDriver, rideController.viewMyRides);


router.get('/new', isAuthenticatedDriver, rideController.getNewRideForm);
router.post('/postRide', isAuthenticatedDriver, rideController.postRide);
router.get('/viewRides', rideController.viewRides);
router.post('/search', rideController.searchRides);
router.get('/:id', rideController.viewRideDetails);
router.get('/:id/edit', isAuthenticatedDriver, rideController.getEditRideForm);
router.post('/:id/edit', isAuthenticatedDriver, rideController.editRide);
router.post('/:id/delete', isAuthenticatedDriver, rideController.deleteRide);

router.get('/', rideController.getDriverHome);

module.exports = router;