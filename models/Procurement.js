const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Procurement Schema
const procurementSchema = new Schema({
    quantity: {
        type: Number,
        required: true
    },
    items: {
        type: String,
        required: true
    },
    farm: {
        type: String,
        required: true
    },
    receiveDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Booked', 'Completed'],
        default: 'Pending'
    },
    deliveryAgency: {
        type: Schema.Types.ObjectId,
        ref: 'DeliveryAgency'
    },
    completion: {
        acceptedKg: Number,
        discardedKg: Number,
        reason: String,
        completedDate: Date
    }
}, {
    timestamps: true
});

// Static methods
procurementSchema.statics.findActive = async function(page, limit) {
    try {
        return await this.find({ status: { $ne: 'Completed' } })
            .sort({ receiveDate: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
    } catch (error) {
        console.error('Error finding active shipments:', error);
        throw error;
    }
};

procurementSchema.statics.countActive = async function() {
    try {
        return await this.countDocuments({ status: { $ne: 'Completed' } });
    } catch (error) {
        console.error('Error counting active shipments:', error);
        throw error;
    }
};

procurementSchema.statics.findCompleted = async function() {
    try {
        return await this.find({ 
            status: 'Completed',
            'completion.completedDate': { $exists: true }
        })
        .sort({ 'completion.completedDate': -1 })
        .limit(10)
        .lean();
    } catch (error) {
        console.error('Error finding completed shipments:', error);
        throw error;
    }
};

procurementSchema.statics.bookDelivery = async function(shipmentId, agencyId) {
    try {
        return await this.findByIdAndUpdate(shipmentId, {
            deliveryAgency: agencyId,
            status: 'Booked'
        }, { new: true });
    } catch (error) {
        console.error('Error booking delivery:', error);
        throw error;
    }
};

procurementSchema.statics.complete = async function(completionData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const shipment = await this.findById(completionData.shipmentId).session(session);
        if (!shipment) {
            throw new Error('Shipment not found');
        }

        shipment.status = 'Completed';
        shipment.completion = {
            acceptedKg: completionData.acceptedKg,
            discardedKg: completionData.discardedKg,
            reason: completionData.reason,
            completedDate: new Date()
        };

        await shipment.save({ session });
        await session.commitTransaction();
        return shipment;
    } catch (error) {
        await session.abortTransaction();
        console.error('Error completing shipment:', error);
        throw error;
    } finally {
        session.endSession();
    }
};

const Procurement = mongoose.model('Procurement', procurementSchema);
module.exports = Procurement;