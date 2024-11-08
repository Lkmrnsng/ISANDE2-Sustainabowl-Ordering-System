/* Import Models */
const User = require('../models/User.js');
const bcrypt = require('bcrypt');

async function uploadUser(req, res) {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const hashedPassword =  await bcrypt.hash(password, 10);
    const pfp = req.file;
    const exists = await User.find({ email: email});

    if(exists.length === 0) {
        //Determine what the last userID is
        const numUsers = await User.countDocuments();
        const newUserID = 10001 + parseInt(numUsers);

        //Determine which account type is selected
        var selectedRadio = req.body['account-type'];
        if (selectedRadio == "Lab Technician") {
            accType = "Lab Technician";
        } else {
            accType = "Student";
        }

        try {
            User.create({
                userID: newUserID.toString(),
                name: username,
                accType: accType,
                email: email,
                password: hashedPassword,
                pfp: "/profile-pictures/" + pfp.originalname
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