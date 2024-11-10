const Procurement = require('../models/procurement');
const DeliveryAgency = require('../models/deliveryAgency');

class ProcurementController {
    async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            
            const shipments = await Procurement.findActive(page, limit);
            const completedShipments = await Procurement.findCompleted();
            const agencies = await DeliveryAgency.findAll();
            
            const totalShipments = await Procurement.countActive();
            const totalPages = Math.ceil(totalShipments / limit);
            
            res.render('logistics_procurement', {
                shipments,
                completedShipments,
                agencies,
                currentPage: page,
                totalPages,
                hasPrevPage: page > 1,
                hasNextPage: page < totalPages
            });
        } catch (error) {
            console.error('Error loading procurement page:', error);
            res.status(500).send('Internal Server Error');
        }
    }

    async create(req, res) {
        try {
            const shipmentData = {
                quantity: req.body.quantity,
                items: req.body.items,
                farm: req.body.farm,
                receiveDate: req.body.receiveDate,
                status: 'Pending'
            };
            
            await Procurement.create(shipmentData);
            res.redirect('/procurement');
        } catch (error) {
            console.error('Error creating shipment:', error);
            res.status(500).send('Internal Server Error');
        }
    }

    async bookDelivery(req, res) {
        try {
            const { shipmentId, agencyId } = req.body;
            await Procurement.bookDelivery(shipmentId, agencyId);
            res.redirect('/procurement');
        } catch (error) {
            console.error('Error booking delivery:', error);
            res.status(500).send('Internal Server Error');
        }
    }

    async complete(req, res) {
        try {
            const completionData = {
                shipmentId: req.body.shipmentId,
                acceptedKg: req.body.acceptedKg,
                discardedKg: req.body.discardedKg,
                reason: req.body.reason
            };
            
            await Procurement.complete(completionData);
            res.redirect('/procurement');
        } catch (error) {
            console.error('Error completing shipment:', error);
            res.status(500).send('Internal Server Error');
        }
    }
}

module.exports = new ProcurementController();