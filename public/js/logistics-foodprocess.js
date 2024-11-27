const itemsPerPage = 7;
let currentPage = 1;
let processingOrders = [];

document.addEventListener('DOMContentLoaded', function() {
    // Load the page for the first time
    async function initialize() {
        const processingTable = document.querySelector('.processing-table');
        if (processingTable) {
            await getOrdersJson();
            updateProcessingTable();
        } else {
            console.log("Table not found");
        }
    }

    initialize();
});

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

// Using the current contents of processingOrders, clear and update the processing table
function updateProcessingTable() {
    const tbody = document.querySelector('.processing-table').querySelector('tbody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, processingOrders.length);
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
            <td>
                <select class="status-dropdown">
                    <option class="select-option" value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option class="select-option" value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    <option class="select-option" value="Dispatched" ${order.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
                </select>
            </td>
        `;

        tbody.appendChild(row);

        // Remove any existing event listeners
        const oldDropdowns = document.querySelectorAll('.status-dropdown');
        oldDropdowns.forEach(dropdown => {
            const clone = dropdown.cloneNode(true);
            dropdown.parentNode.replaceChild(clone, dropdown);
        });

        // Add new click event listener to the dropdown
        const dropdowns = document.querySelectorAll('.status-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('change', async (event) => {
                const row = event.target.closest('tr');
                const orderID = row.cells[0].textContent;
                const selectedValue = event.target.value;
                
                if (selectedValue === 'Dispatched') {
                    if (confirm('Are you sure this order is done with processing?')) {
                        await createDelivery(orderID);
                        await setOrderStatus(orderID, 'Dispatched');
                        await getOrdersJson();
                        updateProcessingTable();
                        showMessage("Delivery created successfully!");
                    }
                } else if (selectedValue === 'Cancelled') {
                    if (confirm('Are you sure you want to cancel this order?')) {
                        try {
                            await setOrderStatus(orderID, 'Cancelled');
                            await createAlert(orderID, "Cancellation", "Order cancelled by Logistics");
                            await getOrdersJson();
                            updateProcessingTable();
                            showMessage("Order cancelled successfully!");
                        } catch (error) {
                            console.error('Error updating order status:', error);
                            alert('Failed to update order status');
                        }
                    } else {
                        event.target.value = 'Processing'; 
                    }
                }
            });
        });
        
        count = 0;
        itemString = "";
        dateString = "";
    });

    // Update pagination controls
    const totalPages = Math.ceil(processingOrders.length / itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || processingOrders.length === 0;

    // Handle empty state
    if (processingOrders.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" class="text-center">No orders found</td>';
        tbody.appendChild(emptyRow);
    }
}

// Create delivery object in db using orderID
async function createDelivery(orderID) {    
    const response = await fetch(`/logistics/api/create-delivery/${orderID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to create delivery');
}

// Setter for order status
async function setOrderStatus(orderID, status) {
    const response = await fetch(`/logistics/api/order-status/${orderID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: status })
    });
    
    if (!response.ok) {
        throw new Error('Failed to update order status');
    }
    
    return await response.json();
}

// Create an alert object in the db
async function createAlert(orderID, category, details) {
    try {
        const orderIDs = [ orderID ];

        const formData = {
            category: category,
            details: details,
            orders: orderIDs
        };

        const response = await fetch(`/alert/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify( formData )
        });

        if (!response.ok) throw new Error(`Failed to create alert`);
        
        if (window.loadNotifications) {
            window.loadNotifications();
        }
    } catch (error) {
        console.error('Error creating alert/s:', error);
        alert('Failed to create one or more alerts');
    }
}

// Change page function
window.changePage = function(delta) {
    const totalPages = Math.ceil(processingOrders.length / itemsPerPage);
    const newPage = currentPage + delta;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateProcessingTable();
    }
};

// Show message on the lower-right of screen
function showMessage(message) {
    let messageDiv = document.getElementById('success-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'success-message';
        messageDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            padding: 15px;
            border-radius: 5px;
            display: none;
            z-index: 1000;
        `;
        document.body.appendChild(messageDiv);
    }
    
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 2000);
}