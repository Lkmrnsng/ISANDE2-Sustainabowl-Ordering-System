const User = require('../models/User');
const bcrypt = require('bcrypt');

async function viewProfile(req, res) {
    try {
        const userId = parseInt(req.session.userId);
        const user = await User.findOne({ userID: userId });
        
        if (!user) {
            return res.status(404).render('error', {
                message: 'User not found',
                layout: 'main'
            });
        }

        res.render('user/profile', {
            title: 'My Account',
            css: ['user.css', "customer.css"],
            layout: 'customer',
            user: user,
            active: 'account'
        });
    } catch (error) {
        console.error('Error viewing profile:', error);
        res.status(500).render('error', {
            message: 'Error loading profile',
            layout: 'main'
        });
    }
}

async function editProfile(req, res) {
    try {
        const userId = parseInt(req.session.userId);
        const { name, email, phone, restaurantName, currentPassword, newPassword } = req.body;

        const user = await User.findOne({ userID: userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password if trying to change password
        if (newPassword) {
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Current password is incorrect' 
                });
            }
        }

        // Check if email is being changed and verify it's not taken
        if (email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email already in use' 
                });
            }
        }

        // Update user data
        const updateData = {
            name,
            email,
            phone,
            restaurantName
        };

        // If new password provided, hash and update it
        if (newPassword) {
            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        await User.findOneAndUpdate(
            { userID: userId },
            updateData,
            { new: true }
        );

        res.json({ 
            success: true, 
            message: 'Profile updated successfully' 
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating profile' 
        });
    }
}

async function deleteProfile(req, res) {
    try {
        const userId = parseInt(req.session.userId);
        const { password } = req.body;

        const user = await User.findOne({ userID: userId });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Verify password before deletion
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Incorrect password' 
            });
        }

        // Perform deletion
        await User.findOneAndDelete({ userID: userId });

        // Destroy session
        req.session.destroy();

        res.json({ 
            success: true, 
            message: 'Account deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting account' 
        });
    }
}

module.exports = {
    viewProfile,
    editProfile,
    deleteProfile
};