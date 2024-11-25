const Request = require('../models/Request');
const Order = require('../models/Order');
const Item = require('../models/Item');
const Procurement = require('../models/Procurement');
const Agency = require('../models/Agency');
const Delivery = require('../models/Delivery');

// Fetch the logistics dashboard
async function getDashboardView(req, res) {
    try {
        const stats = (await getDashboardStats())[0];

        res.render('logistics_dashboard', {
            title: 'Dashboard',
            css: ['logisales_dashboard.css'],
            layout: 'logistics',
            requests: [],
            active: 'dashboard',
            stats: stats
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching logistics dashboard.");
    }
}

async function getCalendarView (req, res) {
    try {
        res.render('logistics_calendar', {
            title: 'Calendar',
            css: ['logistics_calendar.css'],
            layout: 'logistics',
            active: 'calendar'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching calendar.");
    }
}

//getFoodProcessView
async function getFoodProcessView (req, res) {
    try {
        res.render('logistics_foodprocess', {
            title: 'Food Process',
            css: ['logistics_foodprocess.css'],
            layout: 'logistics',
            active: 'foodprocess'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching food process.");
    }
}

//getDeliveryView
async function getDeliveryView (req, res) {
    try {
        res.render('logistics_delivery', {
            title: 'Delivery',
            css: ['logistics_delivery.css'],
            layout: 'logistics',
            active: 'delivery'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching delivery.");
    }
}

//getWarehouseView
async function getWarehouseView (req, res) {
    try {
        res.render('logistics_warehouse', {
            title: 'Warehouse',
            css: ['logistics_warehouse.css'],
            layout: 'logistics',
            active: 'warehouse'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching warehouse.");
    }
}

//getPartnersView
async function getPartnersView (req, res) {
    try {
        res.render('logistics_partners', {
            title: 'Partners',
            css: ['logistics_partners.css'],
            layout: 'logistics',
            active: 'partners'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching partners.");
    }
}

//getProcurementView
async function getProcurementView (req, res) {
    try {
        res.render('logistics_procurement', {
            title: 'Procurement',
            css: ['logistics_procurement.css'],
            layout: 'logistics',
            active: 'procurement'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching procurement.");
    }
}

//getSendAlertView
async function getSendAlertView (req, res) {
    try {
        res.render('logistics_sendalert', {
            title: 'Send Alert',
            css: ['logistics_sendalert.css'],
            layout: 'logistics',
            active: 'sendalert'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error fetching send alert.");
    }
}

// Call the methods to compute the Logistics Dashboard statistics
async function getDashboardStats() {
    const statsArray = [];
    const procurementExpenses = await getprocurementExpenses();
    const pendingProcurements = await getpendingProcurements();
    const pendingFoodprocessing = await getpendingFoodprocessing();
    const unpaidDeliveries = await getunpaidDeliveries();

    statsArray.push({
        procurementExpenses: procurementExpenses.toString(),
        pendingProcurements: pendingProcurements.toString(),
        pendingFoodprocessing: pendingFoodprocessing.toString(),
        unpaidDeliveries: unpaidDeliveries.toString()
    })

    return statsArray;
}

// Calculate the total procurement expenses this month
async function getprocurementExpenses() {
    try {
        const currentYear = new Date().getUTCFullYear();
        const currentMonth = new Date().getUTCMonth() + 1;
        const procurements = await Procurement.find({
            incomingDate: { $regex: new RegExp(`${currentYear}-${currentMonth.toString().padStart(2, '0')}`) }
        });
        
        let totalExpenses = 0;
        procurements.forEach(procurement => {
            procurement.bookedItems.forEach(item => {
                const itemExpense = item[1] * item[2];
                totalExpenses += itemExpense;
            });
        });

        return totalExpenses;
    } catch (err) {
        console.error('Error in getprocurementExpenses:', err);
        return 0;
    }
}

// Calculate the total number of pending procurements
async function getpendingProcurements() {
    try {
        const procurements = await Procurement.find({ status: "Booked" });
        return procurements.length;
    } catch (err) {
        console.error('Error in getpendingProcurements:', err);
        return 0;
    }
}

// Calculate the total number of pending food processing
async function getpendingFoodprocessing() {
    try {
        const orders = await Order.find({ status: "Processing" });
        return orders.length;
    } catch (err) {
        console.error('Error in getpendingFoodprocessing:', err);
        return 0;
    }
}

// Calculate the total number of pending procurements
async function getunpaidDeliveries() {
    try {
        const deliveries = await Delivery.find({ isPaid: false });
        return deliveries.length;
    } catch (err) {
        console.error('Error in getunpaidDeliveries:', err);
        return 0;
    }
}

// Get the procurements data and return as a JSON
async function getProcurementJson(req, res) {
    try {
        const procurements = await getProcurementData();
        res.json(procurements);
    } catch (err) {
        console.error('Error fetching procurements:', err);
        res.status(500).json({ error: 'Failed to fetch procurements' });
    }
}

// Get the orders data and return as a JSON
async function getOrdersJson(req, res) {
    try {
        const orders = await getOrderData();
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
}

// Get the list of agencies for procurement dropdown as a JSON
async function getAgenciesJson(req, res) {
    try {
        const agencies = await getAgenciesData();
        res.json(agencies);
    } catch (err) {
        console.error('Error fetching agencies:', err);
        res.status(500).json({ error: 'Failed to fetch agencies' });
    }
}

// Get the list of items for procurement dropdown as a JSON
async function getItemsJson(req, res) {
    try {
        const items = await getItemsData();
        res.json(items);
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
}

// Get the list of deliveries as a JSON
async function getDeliveriesJson(req, res) {
    try {
        const deliveries = await getDeliveriesData();
        res.json(deliveries);
    } catch (err) {
        console.error('Error fetching deliveries:', err);
        res.status(500).json({ error: 'Failed to fetch deliveries' });
    }
}

// Fetch procurements data by mapping across models
async function getProcurementData() {
    try {
        const procurements = await Procurement.find({}).sort({ incomingDate: -1 });
        const compiledData = [];
        
        for (const procurement of procurements) {
            // Get unique item IDs from both arrays
            const itemIDs = new Set([
                ...procurement.bookedItems.map(item => item[0]), // First element is itemID
                ...procurement.receivedItems.map(item => item[0])
            ]);

            // Fetch all required items in one query
            const items = await Item.find({ itemID: { $in: Array.from(itemIDs) } });
            const itemMap = new Map(items.map(item => [item.itemID, item]));

            const processedBookedItems = procurement.bookedItems.map(bookedItem => ({
                itemName: itemMap.get(bookedItem[0])?.itemName || 'Undefined',
                quantityShipping: bookedItem[1]
            }));

            const processedReceivedItems = procurement.receivedItems.map(receivedItem => ({
                itemName: itemMap.get(receivedItem[0])?.itemName || 'Undefined',
                quantityAccepted: receivedItem[1],
                quantityDiscarded: receivedItem[2]
            }));

            // Get agency information
            const agency = await Agency.findOne({ agencyID: procurement.agencyID });

            compiledData.push({
                procurementID: procurement.procurementID,
                agencyName: agency?.name || 'Undefined',
                incomingDate: procurement.incomingDate,
                receivedDate: procurement.receivedDate,
                bookedItems: processedBookedItems,
                receivedItems: processedReceivedItems,
                status: procurement.status
            });
        }

        return compiledData;
    } catch (error) {
        console.log("Error in getProcurementData: ", error);
    }
}

// Fetch orders data from the db
async function getOrderData() {
    try {
        const orders = await Order.find({}).sort({ deliveryDate: 1 });
        const compiledData = [];
        
        for (const order of orders) {
            const itemsArray = [];

            for (const item of order.items) {
                const foundItem = await Item.findOne({ itemID: item.itemID });
                itemsArray.push([foundItem.itemName, item.quantity]);
            }

            compiledData.push({
                orderID: order.OrderID,
                requestID: order.requestID,
                status: order.status,
                customizations: order.customizations,
                items: itemsArray,
                deliveryDate: order.deliveryDate,
                deliveryAddress: order.deliveryAddress,
                deliveryTimeRange: order.deliveryTimeRange,
                pointPersonID: order.pointPersonID,
                paymentMethod: order.paymentMethod
            });
        }

        return compiledData;
    } catch (error) {
        console.log("Error in getOrderData: ", error);
    }
}

// Fetch agencies data from the db
async function getAgenciesData() {
    try {
        const agencies = await Agency.find({}).sort({ agencyID: 1 });
        const compiledData = [];
        
        for (const agency of agencies) {
            compiledData.push({
                agencyID: agency.agencyID,
                name: agency.name,
                contact: agency.contact,
                location: agency.location,
                price: agency.price,
                maxWeight: agency.maxWeight,
            });
        }

        return compiledData;
    } catch (err) {
        console.error('Error fetching agencies:', err);
    }
}

// Fetch items data from the db
async function getItemsData() {
    try {
        const items = await Item.find({}).sort({ itemID: 1 });
        const compiledData = [];
        
        for (const item of items) {
            compiledData.push({
                itemID: item.itemID,
                itemName: item.itemName,
                itemCategory: item.itemCategory,
                itemDescription: item.itemDescription,
                itemPrice: item.itemPrice,
                itemStock: item.itemStock,
                itemImage: item.itemImage
            });
        }

        return compiledData;
    } catch (err) {
        console.error('Error fetching items:', err);
    }
}

// Fetch deliveries data by mapping across models
async function getDeliveriesData() {
    try {
        const deliveries = await Delivery.find({}).sort({ deliverID: 1 });
        const compiledData = [];
        
        for (const delivery of deliveries) {
            const foundOrder = await Order.findOne({ OrderID: delivery.orderID });
            const deliverBy = foundOrder.deliveryDate;
            const itemsArray = [];

            for (const item of foundOrder.items) {
                const foundItem = await Item.findOne({ itemID: item.itemID });
                itemsArray.push([foundItem.itemName, item.quantity]);
            }
            
            compiledData.push({
                deliveryID: delivery.deliveryID,
                isPaid: delivery.isPaid,
                deliveredOn: delivery.deliveredOn,
                deliverBy: deliverBy,
                items: itemsArray
            });
        }

        return compiledData;
    } catch (error) {
        console.log("Error in getDeliveriesData: ", error);
    }
}

// Process the request to save the procurement to the db
async function submitProcurement(req, res) {
    try {
        const {
            agency,
            items,
            incomingDate
          } = req.body;

        const procurement = await createProcurement(agency, items, incomingDate);
        res.status(200).json({ procurement: procurement });
    } catch (err) {
        console.error('Error saving to db:', err);
        res.status(500).json({ error: 'Failed to save to db' });
    }
}

// Save procurement to db
async function createProcurement(agencyName, items, incomingDate) {
    try {
        const procurementID = await Procurement.countDocuments() + 60001;
        const agency = await Agency.findOne({ name: agencyName });
        const agencyID = agency.agencyID;
        const processedItems = await processItems(items);
        const formattedDate = incomingDate + "T00:00:00Z";
                
        const procurement = await Procurement.create({
            procurementID: procurementID,
            agencyID: agencyID,
            bookedItems: processedItems,
            receivedItems: [],
            incomingDate: formattedDate,
            receivedDate: "",
            status: "Booked"
        });

        return procurement;
    } catch (error) {
        console.error('Error in createProcurement:', error);
        return null;
    }
}

// Create a new delivery in db
async function createDelivery(req, res) {
    const orderID = req.params.orderID;

    try {
        const deliveryID = await Delivery.countDocuments() + 70001;
                
        const delivery = await Delivery.create({
            deliveryID: deliveryID,
            orderID: orderID,
            isComplete: false,
            isPaid: false,
            deliveredOn: ""
        });

        return res.status(200).json({
            success: true,
            message: 'Delivery created successfully',
        });
    } catch (error) {
        console.error('Error in createDelivery:', error);
        return null;
    }
}

// Convert the items array into a 2d array of itemID, qty
async function processItems(items) {
    try {
        const itemMap = new Map();
        
        // Merge duplicates by adding quantities
        items.forEach(({item, quantity, cost}) => {
            if (itemMap.has(item)) {
                const existing = itemMap.get(item);
                itemMap.set(item, {
                    quantity: existing.quantity + quantity,
                    cost: existing.cost + cost
                });
            } else {
                itemMap.set(item, { quantity, cost });
            }
        });

        // Convert the merged items into an array of promises to get item IDs
        const itemPromises = Array.from(itemMap.entries()).map(async ([itemName, data]) => {
            const itemDoc = await Item.findOne({ itemName: itemName });
            if (!itemDoc) {
                throw new Error(`Item not found: ${itemName}`);
            }
            return [ itemDoc.itemID, data.quantity, data.cost ];
        });

        const processedItems = await Promise.all(itemPromises);        
        return processedItems;
    } catch (error) {
        console.error('Error processing items:', error);
        throw error;
    }
}

// Setter for procurement status
async function setProcurementStatus(req, res) {
    const procurementID = req.params.procurementID;
    const { status } = req.body;

    try {
        const procurement = await Procurement.findOne({ procurementID: procurementID })

        if (!procurement) {
            return res.status(404).json({
                success: false,
                message: 'Procurement not found'
            });
        }

        // Update the request status
        await Procurement.updateOne({ procurementID: procurementID }, { $set: { status: status }});

        return res.status(200).json({
            success: true,
            message: 'Procurement status updated successfully',
            procurement: {
                id: procurement._id,
                status: status,
            }
        });
    } catch (error) {
        console.error('Error updating procurement status:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Setter for order status
async function setOrderStatus(req, res) {
    const orderID = req.params.orderID;
    const { status } = req.body;

    try {
        const order = await Order.findOne({ OrderID: orderID })

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update the request status
        await Order.updateOne({ OrderID: orderID }, { $set: { status: status }});

        return res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order: {
                id: order._id,
                status: status,
            }
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Setter for delivery status
async function setDeliveryStatus(req, res) {
    const deliveryID = req.params.deliveryID;
    const { status } = req.body;

    try {
        const delivery = await Delivery.findOne({ deliveryID: deliveryID });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'delivery not found'
            });
        }

        // Update the delivery status
        await Delivery.updateOne({ deliveryID: deliveryID }, { $set: { isPaid: status }});

        return res.status(200).json({
            success: true,
            message: 'Delivery status updated successfully',
            delivery: {
                id: delivery._id,
                status: status,
            }
        });
    } catch (error) {
        console.error('Error updating delivery status:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Update procurement with received details
async function completeProcurement(req, res) {
    try {
        const {
            procurementID,
            receivedDate,
            receivedItems
          } = req.body;

        const procurement = await saveCompletedProcurement(procurementID, receivedDate, receivedItems);
        res.status(200).json({ procurement: procurement });
    } catch (err) {
        console.error('Error saving to db:', err);
        res.status(500).json({ error: 'Failed to save to db' });
    }
}

// Update delivery with received details
async function completeDelivery(req, res) {
    try {
        const {
            deliveryID,
            deliveredOn,
            isPaidChecked
        } = req.body;

        const delivery = await saveCompletedDelivery(deliveryID, deliveredOn, isPaidChecked);
        res.status(200).json({ delivery: delivery });
    } catch (err) {
        console.error('Error saving to db:', err);
        res.status(500).json({ error: 'Failed to save to db' });
    }
}

// Update the db using received data
async function saveCompletedProcurement(procurementID, receivedDate, receivedItems) {
    try {
        const formattedDate = receivedDate + "T00:00:00Z";
        const itemsArray = [];

        for (const item of receivedItems) {
            const foundItem = await Item.findOne({ itemName: item.itemName });
            const itemID = foundItem.itemID;
            itemsArray.push([itemID, item.quantityAccepted, item.quantityDiscarded]);
        }

        await Procurement.updateOne({ procurementID: procurementID }, { $set: { 
                receivedDate: formattedDate, 
                receivedItems: itemsArray,
                status: "Completed" }});

        return {
            statusCode: 200,
            success: true,
            message: 'Procurement completed successfully'
        };
    } catch (error) {
        console.error('Error in saveCompletedProcurement:', error);
        return null;
    }
}

// Update the db using received data
async function saveCompletedDelivery(deliveryID, deliveredOn, isPaidChecked) {
    try {
        const formattedDate = deliveredOn + "T00:00:00Z";

        if (isPaidChecked) {
            await Delivery.updateOne({ deliveryID: deliveryID }, { $set: { 
                deliveredOn: formattedDate, 
                isPaid: true
            }});
        } else {
            await Delivery.updateOne({ deliveryID: deliveryID }, { $set: { 
                deliveredOn: formattedDate, 
            }});
        }

        return {
            statusCode: 200,
            success: true,
            message: 'Delivery completed successfully'
        };
    } catch (error) {
        console.error('Error in saveCompletedDelivery:', error);
        return null;
    }
}

module.exports = {
    getDashboardView,
    getCalendarView,
    getFoodProcessView,
    getDeliveryView,
    getWarehouseView,
    getPartnersView,
    getProcurementView,
    getSendAlertView,
    getProcurementJson,
    getOrdersJson,
    getAgenciesJson,
    getItemsJson,
    getDeliveriesJson,
    submitProcurement,
    setProcurementStatus,
    setOrderStatus,
    setDeliveryStatus,
    completeProcurement,
    completeDelivery,
    createDelivery
};