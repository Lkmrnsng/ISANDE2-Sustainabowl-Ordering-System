const FoodProcess = require('../models/FoodProcess');

// Fetch all processing requests
exports.getProcessingRequests = async (req, res) => {
    try {
        const processingRequests = await FoodProcess.find();
        res.render('logistics_foodprocess', { processingRequests });
    } catch (error) {
        res.status(500).send("Error fetching food processing requests.");
    }
};

// Fetch details for a specific request
exports.getRequestDetails = async (req, res) => {
    try {
        const requestId = req.params.id;
        const request = await FoodProcess.findOne({ id: requestId });
        res.json(request);
    } catch (error) {
        res.status(500).send("Error fetching request details.");
    }
};

// Update the status of a produce item in a request
exports.updateProduceStatus = async (req, res) => {
    try {
        const { requestId, produceId, status } = req.body;
        const request = await FoodProcess.findOne({ id: requestId });
        const produce = request.produce.id(produceId);
        
        if (produce) {
            produce.status = status;
            await request.save();
            res.json({ success: true });
        } else {
            res.status(404).send("Produce item not found.");
        }
    } catch (error) {
        res.status(500).send("Error updating produce status.");
    }
};
