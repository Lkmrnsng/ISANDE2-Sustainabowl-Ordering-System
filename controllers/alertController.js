const Alert = require('../models/Alert');

exports.createAlert = async (req, res) => {
    try {
        const { concernType, details, cancelRequest } = req.body;
        
        const newAlert = new Alert({
            alertID: Math.floor(Math.random() * 1000000), // Generate a random ID for example purposes
            concernType,
            details,
            cancelRequest
        });

        await newAlert.save();
        res.status(201).json({ message: "Alert created successfully", alert: newAlert });
    } catch (error) {
        res.status(500).json({ message: "Error creating alert", error });
    }
};
