const procurementsPerPage = 7;
const processingPerPage = 7;
const deliveriesPerPage = 7;
let currentProcurementPage = 1;
let currentProcessingPage = 1;
let currentDeliveryPage = 1;
let allProcurements = [];
let processingOrders = [];
let allDeliveries = [];

document.addEventListener('DOMContentLoaded', function() {
    // Load the page for the first time
    async function initializeTables() {
        const procurementTable = document.querySelector('.procurement-table');
        if (procurementTable) {
            await getProcurementsJson();
            updateProcurementsTable();
            await getOrdersJson();
            updateProcessingTable();
            await getDeliveriesJson();
            updateDeliveriesTable();
        } else {
            console.log("Table not found");
        }
    }

    // Fetch the json procurements data from the server
    async function getProcurementsJson() {
        try {
            const response = await fetch('/logistics/api/procurements');
            if (!response.ok) throw new Error('Failed to fetch procurements');
            const data = await response.json();
            const procurements = [];

            const compiledData = data.map(row => ({
                procurementID: row.procurementID,
                agencyName: row.agencyName,
                incomingDate: row.incomingDate,
                receivedDate: row.receivedDate,
                bookedItems: row.bookedItems,
                receivedItems: row.receivedItems,
                status: row.status
            }));

            for (const unit of compiledData) {
                formattedIncomingDate = unit.incomingDate.split('T')[0];
                formattedReceivedDate = unit.receivedDate.split('T')[0];

                procurements.push({
                    procurementID: unit.procurementID,
                    agencyName: unit.agencyName,
                    incomingDate: formattedIncomingDate,
                    receivedDate: formattedReceivedDate,
                    bookedItems: unit.bookedItems,
                    receivedItems: unit.receivedItems,
                    status: unit.status
                })
            }

            allProcurements = [...procurements];
        } catch (error) {
            console.error('Error refreshing requests data:', error);
        }
    }

    // Fetch the json orders data from the server
    async function getOrdersJson() {
        try {
            const response = await fetch('/logistics/api/orders');
            if (!response.ok) throw new Error('Failed to fetch orders data');
            const data = await response.json();
            const orders = [];

            const compiledData = data.map(row => ({
                orderID: row.orderID,
                requestID: row.requestID,
                status: row.status,
                customizations: row.customizations,
                items: row.items,
                deliveryDate: row.deliveryDate,
                deliveryAddress: row.deliveryAddress,
                deliveryTimeRange: row.deliveryTimeRange,
                pointPersonID: row.pointPersonID,
                paymentMethod: row.paymentMethod
            }));

            for (const unit of compiledData) {
                formattedDate = unit.deliveryDate.split('T')[0];

                orders.push({
                    orderID: unit.orderID,
                    status: unit.status,
                    customizations: unit.customizations,
                    items: unit.items,
                    deliveryDate: formattedDate,
                    deliveryTimeRange: unit.deliveryTimeRange
                })
            }

            processingOrders = orders.filter(order => order.status === "Processing");
        } catch (err) {
            console.error('Error initializing orders:', err);
        }
    }

    // Fetch the json deliveries data from the server
    async function getDeliveriesJson() {
        try {
            const response = await fetch('/logistics/api/deliveries');
            if (!response.ok) throw new Error('Failed to fetch deliveries data');
            const data = await response.json();
            const deliveries = [];

            const compiledData = data.map(row => ({
                deliveryID: row.deliveryID,
                isPaid: row.isPaid,
                deliveredOn: row.deliveredOn,
                deliverBy: row.deliverBy,
                items: row.items
            }));

            for (const unit of compiledData) {
                deliverBy = unit.deliverBy.split('T')[0];
                deliveredOn = unit.deliveredOn.split('T')[0];
                
                deliveries.push({
                    deliveryID: unit.deliveryID,
                    isPaid: unit.isPaid,
                    deliveredOn: deliveredOn || "",
                    deliverBy: deliverBy,
                    items: unit.items
                })
            }

            allDeliveries = deliveries.sort((a, b) => a.deliveredOn === "" ? -1 : b.deliveredOn === "" ? 1 : new Date(a.deliveredOn) - new Date(b.deliveredOn));
        } catch (err) {
            console.error('Error initializing deliveries:', err);
        }
    }

    // Using the current contents of allProcurements, clear and update the procurements table
    function updateProcurementsTable() {
        const tbody = document.querySelector('.procurement-table').querySelector('tbody');
        const startIndex = (currentProcurementPage - 1) * procurementsPerPage;
        const endIndex = Math.min(startIndex + procurementsPerPage, allProcurements.length);
        const pageData = allProcurements.slice(startIndex, endIndex);

        // Clear existing rows
        tbody.innerHTML = '';

        // Add new rows
        pageData.forEach(procurement => {
            const row = document.createElement('tr');
            let itemString = "";
            let count = 0;

            for (const item of procurement.bookedItems) {
                if (count === 0) {
                    itemString = `${item.itemName} (${item.quantityShipping}kg)`;
                } else {
                    itemString += `, ${item.itemName} (${item.quantityShipping}kg)`;
                }
                count++;
            }

            row.innerHTML = `
                <td>${procurement.procurementID}</td>
                <td>${procurement.agencyName}</td>
                <td>${procurement.incomingDate}</td>
                <td>${itemString}</td>
                <td>${procurement.status}</td>
            `;
            
            tbody.appendChild(row);
            count = 0;
            itemString = "";
        });

        // Update pagination controls
        const totalProcurementPages = Math.ceil(allProcurements.length / procurementsPerPage);
        document.getElementById('currentProcurementPage').textContent = currentProcurementPage;
        document.getElementById('totalProcurementPages').textContent = totalProcurementPages;
        document.getElementById('prevProcurement').disabled = currentProcurementPage === 1;
        document.getElementById('nextProcurement').disabled = currentProcurementPage === totalProcurementPages || allProcurements.length === 0;

        // Handle empty state
        if (allProcurements.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="5" class="text-center">No procurements found</td>';
            tbody.appendChild(emptyRow);
        }
    }

    // Using the current contents of processingOrders, clear and update the processing table
    function updateProcessingTable() {
        const tbody = document.querySelector('.processing-table').querySelector('tbody');
        const startIndex = (currentProcessingPage - 1) * processingPerPage;
        const endIndex = Math.min(startIndex + processingPerPage, processingOrders.length);
        const pageData = processingOrders.slice(startIndex, endIndex);

        // Clear existing rows
        tbody.innerHTML = '';

        // Add new rows
        pageData.forEach(order => {
            const row = document.createElement('tr');
            let itemString = "";
            let count = 0;

            // For items string, format as "items (qty)"
            for (const item of order.items) {
                console.log(item);
                if (count === 0) {
                    itemString = `${item[0]} (${item[1]}kg)`;
                } else {
                    itemString += `, ${item[0]} (${item[1]}kg)`;
                }
                count++;
            }

            // For date string, format as "2024-11-11 (Morning)"
            let dateString = `${order.deliveryDate} (${order.deliveryTimeRange})`;

            row.innerHTML = `
                <td>${order.orderID}</td>
                <td>${itemString}</td>
                <td>${order.customizations}</td>
                <td>${dateString}</td>
            `;
            
            tbody.appendChild(row);
            count = 0;
            itemString = "";
            dateString = "";
        });

        // Update pagination controls
        const totalProcessingPages = Math.ceil(processingOrders.length / processingPerPage);
        document.getElementById('currentProcessingPage').textContent = currentProcessingPage;
        document.getElementById('totalProcessingPages').textContent = totalProcessingPages;
        document.getElementById('prevProcessingPage').disabled = currentProcessingPage === 1;
        document.getElementById('nextProcessingPage').disabled = currentProcessingPage === totalProcessingPages || processingOrders.length === 0;

        // Handle empty state
        if (processingOrders.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="5" class="text-center">No orders found</td>';
            tbody.appendChild(emptyRow);
        }
    }

    // Using the current contents of allDeliveries, clear and update the processing table
    function updateDeliveriesTable() {
        const tbody = document.querySelector('.delivery-table').querySelector('tbody');
        const startIndex = (currentDeliveryPage - 1) * deliveriesPerPage;
        const endIndex = Math.min(startIndex + deliveriesPerPage, allDeliveries.length);
        const pageData = allDeliveries.slice(startIndex, endIndex);

        // Clear existing rows
        tbody.innerHTML = '';

        // Add new rows
        pageData.forEach(delivery => {
            const row = document.createElement('tr');
            let itemString = "";
            let weight = 0;
            let count = 0;

            // For items string, format as "items (qty)"
            for (const item of delivery.items) {
                if (count === 0) {
                    itemString = `${item[0]} (${item[1]}kg)`;
                    weight += item[1];
                } else {
                    itemString += `, ${item[0]} (${item[1]}kg)`;
                    weight += item[1];
                }
                count++;
            }

            const isPaid = delivery.isPaid ? "Paid" : "Not Paid";

            row.innerHTML = `
                <td>${delivery.deliveryID}</td>
                <td>${weight}kg</td>
                <td>${itemString}</td>
                <td>${delivery.deliverBy}</td>
                <td>${delivery.deliveredOn}</td>
                <td>${isPaid}</td>
            `;

            tbody.appendChild(row);

            count = 0;
            weight = 0;
            itemString = "";
        });

        // Update pagination controls
        const totalDeliveryPages = Math.ceil(allDeliveries.length / deliveriesPerPage);
        document.getElementById('currentDeliveryPage').textContent = currentDeliveryPage;
        document.getElementById('totalDeliveryPages').textContent = totalDeliveryPages;
        document.getElementById('prevDeliveryPage').disabled = currentDeliveryPage === 1;
        document.getElementById('nextDeliveryPage').disabled = currentDeliveryPage === totalDeliveryPages || allDeliveries.length === 0;

        // Handle empty state
        if (allDeliveries.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="5" class="text-center">No deliveries found</td>';
            tbody.appendChild(emptyRow);
        }
    }

    // Update functions and pagination handlers (existing implementation)
    window.changeProcurementPage = function(delta) {
        const totalProcurementPages = Math.ceil(allProcurements.length / procurementsPerPage);
        const newPage = currentProcurementPage + delta;
        
        if (newPage >= 1 && newPage <= totalProcurementPages) {
            currentProcurementPage = newPage;
            updateProcurementsTable();
        }
    };

    // Change page function
    window.changeProcessingPage = function(delta) {
        const totalProcessingPages = Math.ceil(processingOrders.length / processingPerPage);
        const newPage = currentProcessingPage + delta;
        
        if (newPage >= 1 && newPage <= totalProcessingPages) {
            currentProcessingPage = newPage;
            updateProcessingTable();
        }
    };

    // Change page function
    window.changeDeliveryPage = function(delta) {
        const totalDeliveryPages = Math.ceil(allDeliveries.length / deliveriesPerPage);
        const newPage = currentDeliveryPage + delta;
        
        if (newPage >= 1 && newPage <= totalDeliveryPages) {
            currentDeliveryPage = newPage;
            updateDeliveriesTable();
        }
    };

    // Sort deliveries
    window.sortDeliveries = function() {
        const sortBy = document.getElementById('sortByDelivery').value;
        
        switch(sortBy) {
            case 'deliverBy':
                allDeliveries.sort((a, b) => new Date(a.deliverBy) - new Date(b.deliverBy));
                break;
            case 'deliveredOn':
                allDeliveries.sort((a, b) => a.deliveredOn === "" ? -1 : b.deliveredOn === "" ? 1 : new Date(a.deliveredOn) - new Date(b.deliveredOn));
                break;
            case 'paymentStatus':
                allDeliveries.sort((a, b) => a.isPaid === b.isPaid ? 0 : a.isPaid ? 1 : -1);
                break;
        }

        currentPage = 1;
        updateDeliveriesTable();
    }

    initializeTables();
});