const itemsPerPage = 10;
let currentPage = 1;
let allDeliveries = [];

document.addEventListener('DOMContentLoaded', function() {
    // Load the page for the first time
    async function initialize() {
        const processingTable = document.querySelector('.delivery-table');
        if (processingTable) {
            await getDeliveriesJson();
            updateDeliveriesTable();
            initializeDeliveryForm();
        } else {
            console.log("Table not found");
        }
    }

    // On page load, initialize the delivery overlay
    function initializeDeliveryForm() {
        const overlay = document.getElementById('delivery-overlay');
        const content = overlay.querySelector('.overlay-content');
        const form = document.createElement('form');
        form.id = 'delivery-form';
        
        // Add date picker
        const dateGroup = createFormGroup('Date Delivered:', createDateInput());
        form.appendChild(dateGroup);

        // Add a checkbox
        const paidGroup = createFormGroup('Mark as Paid:', createPaidCheckbox());
        form.appendChild(paidGroup);

        content.insertBefore(form, content.querySelector('button'));
    }

    initialize();
});

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

// Using the current contents of allDeliveries, clear and update the processing table
function updateDeliveriesTable() {
    const tbody = document.querySelector('.delivery-table').querySelector('tbody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, allDeliveries.length);
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

        row.innerHTML = `
            <td><input type="checkbox" class="delivery-checkbox"></td>
            <td>${delivery.deliveryID}</td>
            <td>${weight}kg</td>
            <td>${itemString}</td>
            <td>${delivery.deliverBy}</td>
            <td>${delivery.deliveredOn}</td>
            <td>
                <select class="status-dropdown" ${delivery.isPaid ? 'disabled' : ''}>
                    <option class="select-option" value="Paid" ${delivery.isPaid ? 'selected' : ''}>Paid</option>
                    <option class="select-option" value="Not Paid" ${!delivery.isPaid ? 'selected' : ''}>Not Paid</option>
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
                const deliveryID = row.cells[1].textContent;
                const selectedValue = event.target.value;
                
                if (selectedValue === 'Paid') {
                    if (confirm('Are you sure you want to mark this delivery as paid?')) {
                        try {
                            await setDeliveryStatus(deliveryID, true);
                            await getDeliveriesJson();
                            updateDeliveriesTable();
                            showMessage("Payment updated successfully!");
                        } catch (error) {
                            console.error('Error updating delivery status:', error);
                            alert('Failed to update delivery status');
                            event.target.value = 'Not Paid'; 
                        }
                    } else {
                        event.target.value = 'Not Paid'; 
                    }
                }
            });
        });
        
        count = 0;
        weight = 0;
        itemString = "";
    });

    // Update pagination controls
    const totalPages = Math.ceil(allDeliveries.length / itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || allDeliveries.length === 0;

    // Handle empty state
    if (allDeliveries.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" class="text-center">No deliveries found</td>';
        tbody.appendChild(emptyRow);
    }
}

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

// Update delivery date in db using deliveryID
async function completeDelivery() {
    const form = document.getElementById('delivery-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const selectedDeliveries = Array.from(document.querySelectorAll('.delivery-checkbox:checked')).map(checkbox => {
        const row = checkbox.closest('tr');
        return row.cells[1].textContent; // Get deliveryID from the second column
    });

    if (selectedDeliveries.length === 0) {
        alert('Please select at least one delivery to complete');
        return;
    }

    const deliveredDate = form.querySelector('input[type="date"]').value;
    const isPaidChecked = document.getElementById('paid-checkbox').checked;

    try {
        for (const deliveryID of selectedDeliveries) {
            const formData = {
                deliveryID: deliveryID,
                deliveredOn: deliveredDate,
                isPaidChecked: isPaidChecked
            };

            const response = await fetch(`/logistics/api/complete-delivery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify( formData )
            });

            if (!response.ok) throw new Error(`Failed to update delivery ${deliveryID}`);
        }

        await getDeliveriesJson();
        updateDeliveriesTable();
        if(selectedDeliveries.length == 1) {
            showMessage(`1 delivery completed successfully!`);
        } else {
            showMessage(`${selectedDeliveries.length} deliveries completed successfully!`);
        }
        closeOverlay();
    } catch (error) {
        console.error('Error completing deliveries:', error);
        alert('Failed to complete one or more deliveries');
    }
}

// Setter for delivery status
async function setDeliveryStatus(deliveryID, status) {
    const response = await fetch(`/logistics/api/delivery-status/${deliveryID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: status })
    });
    
    if (!response.ok) {
        throw new Error('Failed to update delivery status');
    }
    
    return await response.json();
}

// Change page function
window.changePage = function(delta) {
    const totalPages = Math.ceil(allDeliveries.length / itemsPerPage);
    const newPage = currentPage + delta;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateDeliveriesTable();
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
            bdelivery-radius: 5px;
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

// Return an html div given the form label and input
function createFormGroup(labelText, input) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    // Only add the label if it's not the paid checkbox (which has its own label)
    if (!input.id || input.id !== 'paid-status-span') {
        const label = document.createElement('label');
        label.textContent = labelText;
        group.appendChild(label);
    }
    
    group.appendChild(input);
    return group;
}

// Create a date input element
function createDateInput() {
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.className = 'form-control';
    dateInput.required = true;
    dateInput.value = new Date().toISOString().split('T')[0];
    return dateInput;
}

// Create a checkbox input for paid status
function createPaidCheckbox() {
    const span = document.createElement('span');
    span.id = 'paid-status-span';
    span.innerHTML = `
        <input type="checkbox" name="isPaid" id="paid-checkbox" class="form-control">
        <label for="paid-checkbox">Also mark as paid</label>
    `;
    return span;
}

// Open the delivery overlay when the "Create" button is clicked
function openOverlay() {
    const overlay = document.getElementById('delivery-overlay');
    overlay.style.display = 'flex';
    
    const selectedDeliveries = Array.from(document.querySelectorAll('.delivery-checkbox:checked')).map(checkbox => {
        const row = checkbox.closest('tr');
        return row.cells[1].textContent; // Get deliveryID from the second column
    });

    if (selectedDeliveries.length === 0) {
        alert('Please select at least one delivery to complete');
        closeOverlay();
        return;
    }

    const headerSpan = document.getElementById('overlay-name');
    headerSpan.textContent = selectedDeliveries.join(', ');
}

// Close the delivery overlay when the "Close" button is clicked
function closeOverlay() {
    const overlay = document.getElementById('delivery-overlay');
    overlay.style.display = 'none';
    
    // Reset the form
    const form = document.getElementById('delivery-form');
    if (form) {
        form.reset();
    }
}

// Close overlay if clicked outside
function closeOverlayOutside(event) {
    if (event.target.id === 'delivery-overlay') {
        closeOverlay();
    }
}