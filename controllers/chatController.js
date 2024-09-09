/* Import Models */
const Message = require('../models/Message');
const User = require('../models/User');

async function getChatHistory(req, res) {
    try {
        const currentUser = req.user.userID;
        const otherUser = parseInt(req.params.userId);
        
        const messages = await Message.find({
            $or: [
                { senderID: currentUser, receiverID: otherUser },
                { senderID: otherUser, receiverID: currentUser }
            ]
        }).sort({ date: 1 });

        const otherUserDetails = await User.findOne({ userID: otherUser });

        res.render('chat', { 
            title: 'Chat',
            layout: 'main.hbs',
            messages, 
            otherUser: otherUserDetails,
            user: req.user,
            css: ['chat.css'],
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).send('Error fetching messages');
    }
}

async function sendMessage(req, res) {
    try {
        const { receiverID, message } = req.body;
        const newMessage = new Message({
            senderID: req.user.userID,
            receiverID: parseInt(receiverID),
            message
        });
        await newMessage.save();
        res.redirect(`/chat/${receiverID}`);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send('Error sending message');
    }
}

module.exports = {
    getChatHistory,
    sendMessage
}