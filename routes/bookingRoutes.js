// luke
/* Import express & define router */
const express = require('express');
const router = express.Router();
module.exports = router; // Export router so it can be used in app.js

/* Import Controllers */
const bookingController = require('../controllers/bookingController.js');

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


/* Define Routes */
router.get('/dashboard', isAuthenticatedDriver, bookingController.driverDashboard);
router.post('/:id/accept', isAuthenticatedDriver, bookingController.acceptBooking);
router.post('/:id/reject', isAuthenticatedDriver, bookingController.rejectBooking);
router.post('/:id/cancel', isAuthenticatedDriver,bookingController.cancelBooking);
router.post('/:id/complete', isAuthenticatedDriver, bookingController.completeBooking);
router.post('/:id/start', isAuthenticatedDriver, bookingController.startBooking);

router.get('/bookingDetails/:id', isAuthenticatedPassenger, bookingController.viewBookingDetails);

router.get('/myBookings', isAuthenticatedPassenger, bookingController.viewMyBookings);
router.get('/:id', isAuthenticatedPassenger, bookingController.getBookingForm);
router.post('/bookRide', isAuthenticatedPassenger, bookingController.bookRide);
router.put('/:id/cancel', isAuthenticatedPassenger, bookingController.cancelBooking);
router.post('/:id/confirm', isAuthenticatedPassenger, bookingController.confirmPayment);