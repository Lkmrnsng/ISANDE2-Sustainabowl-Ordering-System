const procurementsPerPage = 7;
const processingPerPage = 7;
let currentProcurementPage = 1;
let currentProcessingPage = 1;
let allProcurements = [];
let processingOrders = [];

document.addEventListener('DOMContentLoaded', function() {
    // Load the page for the first time
    async function initializeTables() {
        const procurementTable = document.querySelector('.procurement-table');
        if (procurementTable) {
            await getProcurementsJson();
            updateProcurementsTable();
            await getOrdersJson();
            updateProcessingTable();
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

    initializeTables();
});