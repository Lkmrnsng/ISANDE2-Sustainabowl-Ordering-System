/* Import Models */
const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');

// Utility Functions
function formatMonth(date) {
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(date);
}

function isEndOfWeek(index) {
    return (index + 1) % 7 === 0;
}


/* Define Functions */
async function getBookingForm(req, res) {
    const ride = await Ride.findOne({ rideID: req.params.id });

    if (!ride) {
        req.flash('error', 'Ride not found');
        return res.redirect('/ride/viewRides');
    }

    const driver = await User.findOne({ userID: ride.driverID });
    if (!driver) {
        req.flash('error', 'Driver not found');
        return res.redirect('/ride/viewRides');
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const availableDays = ride.availableDays.map(day => day.toLowerCase());
    const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    const calendarDays = [];
    const startDay = new Date(tomorrow);
    const endDay = new Date(startDay);
    endDay.setDate(endDay.getDate() + 29); // Show 30 days including tomorrow

    for (let day = new Date(startDay); day <= endDay; day.setDate(day.getDate() + 1)) {
        const calendarDay = {
            date: day.toISOString().split('T')[0],
            day: day.getDate(),
            isInMonth: true, // All days are in the relevant month(s)
            isAvailable: availableDays.includes(weekDays[day.getDay()])
        };
        calendarDays.push(calendarDay);
    }

    res.render('booking/bookride', { 
        title: 'Book Ride',
        ride: ride,
        driver: driver,
        currentMonth: formatMonth(startDay),
        calendarDays: calendarDays,
        formatMonth: formatMonth,
        isEndOfWeek: isEndOfWeek,
        css: ['booking.css'],
        layout: "main",
        user: req.user,
        messages: {
            error: req.flash('error'),
            success: req.flash('success')
        }
    });
}



async function bookRide(req, res) {
    const { rideId, dates } = req.body;
    const passengerId = req.user.userID;

    try {
      // Get the last booking ID
      const lastBooking = await Booking.findOne().sort('-bookingID');
      let newBookingId = lastBooking ? lastBooking.bookingID + 1 : 40001;
  
      // Loop through each date and create a booking
      for (let date of dates) {
        // Create a new booking instance
        const booking = new Booking({
          bookingID: newBookingId,
          rideID: rideId,
          passengerID: passengerId,
          bookingDate: date, // Single date per booking
          responseStatus: 'pending', // Initial status is pending until the driver accepts
          rideStatus: 'pending', // Ride status starts as pending
          paymentStatus: 'pending', // Payment status starts as pending
        });
  
        // Save the booking to the database
        await booking.save();
  
        // Increment the booking ID for the next booking
        newBookingId++;
      }
  
      // Respond with success message after all bookings are saved
      res.json({ success: true, message: 'Ride requests submitted successfully!' });
    } catch (error) {
      console.error('Error while booking ride:', error);
      res.status(500).json({ success: false, message: 'Failed to submit ride requests. Please try again later.' });
    }
  }
  

  async function viewBookingDetails(req, res) {
    try {
        const bookingId = parseInt(req.params.id);
        const booking = await Booking.findOne({ bookingID: bookingId });

        if (!booking) {
            req.flash('error', 'Booking not found');
            return res.redirect('/');
        }

        const ride = await Ride.findOne({ rideID: booking.rideID });
        const passenger = await User.findOne({ userID: booking.passengerID });
        const driver = await User.findOne({ userID: ride.driverID });

        res.render('booking/details', {
            title: 'Booking Details',
            booking: booking.toObject(),
            ride: ride ? ride.toObject() : null,
            passenger: passenger ? {
                name: passenger.name,
                profilePicture: passenger.profilePicture
            } : null,
            driver: driver ? {
                name: driver.name,
                profilePicture: driver.profilePicture
            } : null,
            css: ['booking.css'],
            user: req.user,
            messages: {
                error: req.flash('error'),
                success: req.flash('success')
            }
        });
    } catch (error) {
        console.error('Error fetching booking details:', error);
        req.flash('error', 'Error loading booking details');
        res.redirect('/');
    }
}


async function viewMyBookings(req, res) {
    try {
        const userID = req.user.userID;
        const bookings = await Booking.find({ passengerID: userID }).sort('bookingDate');

        const bookingsWithDetails = await Promise.all(bookings.map(async (booking) => {
            const ride = await Ride.findOne({ rideID: booking.rideID });
            let driver = null;
            if (ride) {
                driver = await User.findOne({ userID: ride.driverID });
            }
            return {
                ...booking.toObject(),
                ride: ride ? ride.toObject() : null,
                driver: driver ? { name: driver.name, profilePicture: driver.profilePicture } : null
            };
        }));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayBookings = bookingsWithDetails.filter(booking => 
            booking.bookingDate.setHours(0, 0, 0, 0) === today.getTime() &&
            ['pending', 'ongoing'].includes(booking.rideStatus) &&
            !['rejected', 'cancelled'].includes(booking.responseStatus, booking.rideStatus)
        );

        const otherActiveBookings = bookingsWithDetails.filter(booking => 
            (booking.bookingDate.setHours(0, 0, 0, 0) > today.getTime() || // Check if booking date is after today 
            (booking.bookingDate.setHours(0, 0, 0, 0) === today.getTime() && booking.rideStatus === 'pending'))
        );

        res.render('booking/myBookings', {
            title: 'My Bookings',
            todayBookings,
            otherActiveBookings,
            css: ['booking.css'],
            user: req.user,
            messages: {
                error: req.flash('error'),
                success: req.flash('success')
            }
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        req.flash('error', 'Error loading bookings');
        res.redirect('/');
    }
}

async function confirmPayment(req, res) {}

async function driverDashboard(req, res) {
    try {
        const driverID = req.user.userID;
        const rides = await Ride.find({ driverID: driverID });
        const bookings = await Booking.find({ 
            rideID: { $in: rides.map(ride => ride.rideID) }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookingsWithPassengerDetails = await Promise.all(bookings.map(async (booking) => {
            const passenger = await User.findOne({ userID: booking.passengerID });
            const ride = await Ride.findOne({ rideID: booking.rideID });
            return {
                ...booking.toObject(),
                passenger: passenger ? {
                    name: passenger.name,
                    profilePicture: passenger.profilePicture
                } : null,
                ride: ride ? ride.toObject() : null
            };
        }));



        const todayBookings = bookingsWithPassengerDetails.filter(booking => 
            booking.bookingDate.setHours(0, 0, 0, 0) === today.getTime() &&
            booking.responseStatus === 'accepted' &&
            ['pending', 'ongoing'].includes(booking.rideStatus)
        );

        const acceptedBookings = bookingsWithPassengerDetails.filter(booking => 
            booking.responseStatus === 'accepted' &&
            booking.rideStatus === 'pending' &&
            booking.bookingDate.setHours(0, 0, 0, 0) > today.getTime()
        );

        const pendingBookings = bookingsWithPassengerDetails.filter(booking => 
            booking.responseStatus === 'pending' && 
            booking.rideStatus === 'pending'
        );

        res.render('ride/driverDashboard', {
            title: 'Driver Dashboard',
            todayBookings,
            acceptedBookings,
            pendingBookings,
            css: ['driverDashboard.css'],
            user: req.user,
            messages: {
                error: req.flash('error'),
                success: req.flash('success')
            }
        });
    } catch (error) {
        console.error('Error loading driver dashboard:', error);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/');
    }
}


  async function acceptBooking(req, res) {
    try {
        const bookingId = parseInt(req.params.id);
        const booking = await Booking.findOne({ bookingID: bookingId });
  
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
  
        booking.responseStatus = 'accepted';
        await booking.save();
  
        res.json({ success: true, message: 'Booking accepted successfully' });
    } catch (error) {
        console.error('Error accepting booking:', error);
        res.status(500).json({ success: false, message: 'Error accepting booking' });
    }
  }
  
  async function rejectBooking(req, res) {
    try {
        const bookingId = parseInt(req.params.id);
        const booking = await Booking.findOne({ bookingID: bookingId });
  
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
  
        booking.responseStatus = 'rejected';
        booking.rideStatus = 'cancelled';
        await booking.save();
  
        res.json({ success: true, message: 'Booking rejected successfully' });
    } catch (error) {
        console.error('Error rejecting booking:', error);
        res.status(500).json({ success: false, message: 'Error rejecting booking' });
    }
  }
  
  async function autoRejectDueBookings() {
    const currentDate = new Date();
    const dueBookings = await Booking.find({
        responseStatus: 'pending',
        bookingDates: { $lt: currentDate }
    });
  
    for (const booking of dueBookings) {
        booking.responseStatus = 'rejected';
        booking.rideStatus = 'cancelled';
        await booking.save();
    }
  
    console.log(`Auto-rejected ${dueBookings.length} due bookings`);
  }

  async function startBooking(req, res) {
    try {
        const bookingId = parseInt(req.params.id);
        const booking = await Booking.findOne({ bookingID: bookingId });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Fetch the associated ride
        const ride = await Ride.findOne({ rideID: booking.rideID });
        if (!ride) {
            return res.status(404).json({ success: false, message: 'Associated ride not found' });
        }

        // Get the current date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count the number of "On the Way" bookings for this ride today
        const ongoingBookingsCount = await Booking.countDocuments({
            rideID: booking.rideID,
            rideStatus: 'ongoing',
            bookingDate: today
        });

        // Check if the number of ongoing bookings is less than the number of seats
        if (ongoingBookingsCount >= ride.numSeats) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot start more rides. Maximum capacity of ${ride.numSeats} seats reached.`
            });
        }

        booking.rideStatus = 'ongoing';
        await booking.save();

        res.json({ success: true, message: 'Booking started successfully' });
    } catch (error) {
        console.error('Error starting booking:', error);
        res.status(500).json({ success: false, message: 'Error starting booking' });
    }
}

  async function completeBooking(req, res) {
    try {
        const bookingId = parseInt(req.params.id);
        const booking = await Booking.findOne({ bookingID: bookingId });
  
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
  
        booking.rideStatus = 'completed';
        await booking.save();
  
        res.json({ success: true, message: 'Booking completed successfully' });
    } catch (error) {
        console.error('Error completing booking:', error);
        res.status(500).json({ success: false, message: 'Error completing booking' });
    }
  }

  
  
  async function cancelBooking(req, res) {
    try {
        const bookingId = parseInt(req.params.id);
        const booking = await Booking.findOne({ bookingID: bookingId });
  
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
  
        // Fetch the associated ride to get the departure time
        const ride = await Ride.findOne({ rideID: booking.rideID });
        if (!ride) {
            return res.status(404).json({ success: false, message: 'Associated ride not found' });
        }
  
        // Calculate the time difference
        const now = new Date();
        
        // Get the booking date
        const bookingDate = new Date(booking.bookingDate);
  
        // Set the departure time on the booking date
        const departureTime = new Date(bookingDate);
        departureTime.setHours(ride.departureTime.hour, ride.departureTime.minute, 0, 0);
  
        const timeDifference = (departureTime - now) / (1000 * 60 * 60); // difference in hours
  
        let message = 'Booking cancelled successfully';
        let warning = '';
  
        if (timeDifference <= 3) {
            warning = 'Warning: Cancelling within 3 hours of departure. Penalties may be applied in the future.';
        }
  
        booking.rideStatus = 'cancelled';
        await booking.save();
  
        res.json({ success: true, message, warning });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ success: false, message: 'Error cancelling booking' });
    }
  }
  
  async function autoCompleteBookings() { //Mark bookings as complete, if 3 hrs has passed after the departure time
    const currentDate = new Date();
    const autoCompletedBookings = 0;
    const bookings = await Booking.find({//Find all bookings with status pending and response status accepted
        responseStatus: 'accepted',
        rideStatus: 'pending'
    });
  
    for (const booking of bookings) {
        const ride = await Ride.findOne({ rideID: booking.rideID });
        if (!ride) { // Skip if the ride is not found
            continue; // Skip to the next booking
        }
  
        const bookingDate = new Date(booking.bookingDate);
        const departureTime = new Date(bookingDate);
        departureTime.setHours(ride.departureTime.hour, ride.departureTime.minute, 0, 0);
  
        const timeDifference = (currentDate - departureTime) / (1000 * 60 * 60); // difference in hours
  
        if (timeDifference >= 3) {
            booking.rideStatus = 'completed';
            await booking.save();
            autoCompletedBookings++;
        }
    }
  
    console.log('Checked bookings:', bookings.length, 'Auto-completed bookings:', autoCompletedBookings);
  }
  
module.exports = {
    getBookingForm,
    bookRide,
    viewBookingDetails,
    viewMyBookings,
    confirmPayment,
    driverDashboard,
    acceptBooking,
    rejectBooking,
    autoRejectDueBookings,
    startBooking,
    completeBooking,
    cancelBooking,
    autoCompleteBookings
}