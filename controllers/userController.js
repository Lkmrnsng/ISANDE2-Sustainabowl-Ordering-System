/* Import Models */
const User = require('../models/User');
const University = require('../models/University');

async function viewProfile(req, res) {}
async function editProfile(req, res) {}
async function deleteProfile(req, res) {}
async function withdrawBalance(req, res) {}

async function getProfilePage(req, res) {
    try {
        const userID = req.user.userID;
        const user = await User.findOne({ userID: userID });
    
        if (!user) {
          req.flash('error', 'User not found');
          return res.redirect('/');
        }

        //Get University Name
        const university = await University.findOne({ universityID: user.universityID });
        const universityName = university.name;
        
        let noApplications = true;
        //Check if the car details and license have been uploaded, this means the driver has not applied to be a driver
        if (user.carMake || user.carModel || user.carPlate || user.driverLicense) {
            noApplications = false;
        }


        res.render('user/account', {
          title: 'Account Details',
          css: ['account-details.css'], // Create this CSS file for styling
          user: user,
          university: universityName,
          noApplications: noApplications,
          messages: {
            error: req.flash('error'),
            success: req.flash('success')
          }
        });
      } catch (error) {
        console.error('Error fetching account details:', error);
        req.flash('error', 'Error loading account details');
        res.redirect('/');
      }
}

async function getNewDriverForm(req, res) {
    res.render('user/newdriver.hbs', {
        layout: 'main.hbs', // Layout file to use
        title: 'Become a Driver', // Title of the page
        css: ['newdriver.css'], // Array of CSS files to include
        user: req.user, // User info
    });
}

async function createDriver(req, res) {
    try {
        const loggedUser = req.user; // The logged in user
        const { carMake, carModel, carPlate } = req.body;

        const driverLicensePath = req.file ? "/driver-licenses/" + req.file.filename : '';

        const updatedUser = await User.findOneAndUpdate(
            { userID: loggedUser.userID },
            {
                driverLicense: driverLicensePath,
                carMake: carMake,
                carModel: carModel,
                carPlate: carPlate,
            },
            { new: true }
        );

        if (updatedUser) {
            console.log('Updated user to driver successfully!');
            res.redirect('/user/account');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating user data');
    }
}

module.exports = {
    viewProfile,
    editProfile,
    deleteProfile,
    withdrawBalance,
    getProfilePage,
    getNewDriverForm,
    createDriver
}