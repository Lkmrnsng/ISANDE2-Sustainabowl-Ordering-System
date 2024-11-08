/* Import Models */
const User = require('../models/User.js');
const bcrypt = require('bcrypt');

async function uploadUser(req, res) {
    const username = req.body.username;
    const contact = req.body.contact;
    const restaurantName = req.body.restaurant;
    const email = req.body.email;
    const password = req.body.password;
    const hashedPassword =  await bcrypt.hash(password, 10);
    const pfp = req.file;
    const exists = await User.find({ email: email });
    const accType = "Customer"; // Only Sustainabowl can directly employe Sales and Logistics staff

    if(exists.length === 0) {
        //Determine what the last userID is
        const numUsers = await User.countDocuments();
        const newUserID = 10001 + parseInt(numUsers);

        try {
            User.create({
                userID: newUserID.toString(),
                name: username,
                email: email,
                password: hashedPassword,
                phone: "+" + contact.toString(),
                usertype: accType,
                restaurantName: restaurantName,
                // pfp: "/profile-pictures/" + pfp.originalname
            });

            if(User.findOne({ userID: newUserID })) {
                console.log('Registered an Account Successfully!');
                res.redirect('/login');
            }
        } catch (error) {
            console.log(error);
            res.status(500).send('Error saving user data');
        }
    } else {
        console.log('Registration failed. Please try again.');
        res.redirect('/register');
    }    
}

module.exports = {
    uploadUser
}