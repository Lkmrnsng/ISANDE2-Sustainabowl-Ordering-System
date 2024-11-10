const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the DeliveryAgency Schema
const deliveryAgencySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    contactInfo: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Static methods
deliveryAgencySchema.statics.findAllActive = async function() {
    try {
        return await this.find({ isActive: true })
            .sort({ name: 1 })
            .lean();
    } catch (error) {
        console.error('Error finding delivery agencies:', error);
        throw error;
    }
};

deliveryAgencySchema.statics.deactivate = async function(id) {
    try {
        return await this.findByIdAndUpdate(id, 
            { isActive: false },
            { new: true }
        );
    } catch (error) {
        console.error('Error deactivating delivery agency:', error);
        throw error;
    }
};

const DeliveryAgency = mongoose.model('DeliveryAgency', deliveryAgencySchema);
module.exports = DeliveryAgency;