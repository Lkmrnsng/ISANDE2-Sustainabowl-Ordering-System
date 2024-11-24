const procurementsPerPage = 7;
const completedPerPage = 7;
let currentProcurementPage = 1;
let currentCompletedPage = 1;
let allProcurements = [];
let completedProcurements = [];
const agencies = [];
const items = []; 

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all data and displays
    async function initialize() {
        try {
            await initializeArrays();
            await initializeTables();
            initializeProcurementForm();
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    // Load the page for the first time
    async function initializeTables() {
        const procurementTable = document.querySelector('.procurement-table');
        if (procurementTable) {
            await getProcurementsJson();
            updateProcurementsTable();
            updateCompletedTable();
        } else {
            console.log("Table not found");
        }
    }

    // Populate the agencies and items arrays from db data
    async function initializeArrays() {
        await getAgenciesJson();
        await getItemsJson();
    }

    // On page load, initialize the procurement overlay
    function initializeProcurementForm() {
        const overlay = document.getElementById('procurement-overlay');
        const content = overlay.querySelector('.overlay-content');
        const form = document.createElement('form');
        form.id = 'procurement-form';
        
        // Add agency dropdown
        const agencySelect = document.createElement('select');
        agencySelect.className = 'form-control';
        agencySelect.required = true;
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select an agency';
        agencySelect.appendChild(defaultOption);
        agencies.forEach(agency => {
            const option = document.createElement('option');
            option.value = agency;
            option.textContent = agency;
            agencySelect.appendChild(option);
        });
        const agencyGroup = createFormGroup('Agency:', agencySelect);
        form.appendChild(agencyGroup);
        
        // Add items section
        const itemsSection = document.createElement('div');
        itemsSection.id = 'items-section';
        const itemsHeader = document.createElement('h3');
        itemsHeader.textContent = 'Items';
        itemsSection.appendChild(itemsHeader);
        addItemRow(itemsSection);
        
        // Add "Add Row" button
        const addRowBtn = document.createElement('button');
        addRowBtn.type = 'button';
        addRowBtn.className = 'add-row-btn';
        addRowBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Item';
        addRowBtn.onclick = () => addItemRow(itemsSection);
        itemsSection.appendChild(addRowBtn);
        form.appendChild(itemsSection);
        
        // Add date picker
        const dateGroup = createFormGroup('Incoming Date:', createDateInput());
        form.appendChild(dateGroup);

        content.insertBefore(form, content.querySelector('button'));
    }

    // Fetch the json agencies data from the server
    async function getAgenciesJson() {
        try {
            const response = await fetch('/logistics/api/agencies');
            if (!response.ok) throw new Error('Failed to fetch agencies data');
            const data = await response.json();

            const compiledData = data.map(row => ({
                agencyID: row.agencyID,
                name: row.name,
                contact: row.contact,
                location: row.location,
                price: row.price,
                maxWeight: row.maxWeight,
            }));

            for (i in compiledData) {
                agencies.push(compiledData[i].name);
            }

            agencies.sort();
        } catch (err) {
            console.error('Error initializing agencies:', err);
        }
    }

    // Fetch the json items data from the server
    async function getItemsJson() {
        try {
            const response = await fetch('/logistics/api/items');
            if (!response.ok) throw new Error('Failed to fetch items data');
            const data = await response.json();

            const compiledData = data.map(row => ({
                itemID: row.itemID,
                itemName: row.itemName,
                itemCategory: row.itemCategory,
                itemDescription: row.itemDescription,
                itemPrice: row.itemPrice,
                itemStock: row.itemStock,
                itemImage: row.itemImage
            }));

            for (i in compiledData) {
                items.push(compiledData[i].itemName);
            }

            items.sort();
        } catch (err) {
            console.error('Error initializing items:', err);
        }
    }

    initialize();
});

// Function to create the completed procurement form group
async function initializeCompletedForm(procurementID) {
    const procurement = allProcurements.find(p => p.procurementID == procurementID);
    if (!procurement) {
        console.error('Procurement not found');
        return;
    }

    const overlay = document.getElementById('completed-overlay');
    overlay.style.display = 'flex';
    document.getElementById('overlay-name').textContent = ` - ${procurementID}`;

    // Clear existing form if any
    const existingForm = document.getElementById('completed-form');
    if (existingForm) {
        existingForm.remove();
    }

    // Create new form
    const form = document.createElement('form');
    form.id = 'completed-form';
    
    // Add received date input
    const dateGroup = createFormGroup('Received Date:', createDateInput());
    form.appendChild(dateGroup);
    
    // Add items section
    const itemsSection = document.createElement('div');
    itemsSection.id = 'received-items-section';
    
    procurement.bookedItems.forEach((item, index) => {
        const itemRow = createReceivedItemRow(item, index);
        itemsSection.appendChild(itemRow);
    });
    
    form.appendChild(itemsSection);
    
    // Add data attribute for procurement ID
    form.dataset.procurementId = procurementID;
    
    // Insert form before save button
    const content = overlay.querySelector('.overlay-content');
    content.insertBefore(form, content.querySelector('.save-btn'));
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

        allProcurements = procurements.filter(procurement => procurement.status !== "Completed");
        completedProcurements = procurements.filter(procurement => procurement.status === "Completed").sort((a, b) => new Date(b.receivedDate) - new Date(a.receivedDate));;
    } catch (error) {
        console.error('Error refreshing requests data:', error);
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
            <td>
                <select class="status-dropdown" ${procurement.status === 'Cancelled' ? 'disabled' : ''}>
                    <option class="select-option" value="Booked" ${procurement.status === 'Booked' ? 'selected' : ''}>Booked</option>
                    <option class="select-option" value="Cancelled" ${procurement.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    <option class="select-option" value="Completed" ${procurement.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </td>
        `;

        // Add click event listener to the dropdown
        const dropdowns = document.querySelectorAll('.status-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('change', async (event) => {
                const row = event.target.closest('tr');
                const procurementID = row.cells[0].textContent;
                const selectedValue = event.target.value;
                
                if (selectedValue === 'Completed') {
                    // Reset dropdown to previous value temporarily
                    event.target.value = 'Booked';
                    
                    if (confirm('Are you sure you want to mark this procurement as completed? This will require entering received quantities.')) {
                        initializeCompletedForm(procurementID);
                    }
                } else if (selectedValue === 'Cancelled') {
                    if (confirm('Are you sure you want to cancel this procurement?')) {
                        try {
                            await setProcurementStatus(procurementID, 'Cancelled');
                            await getProcurementsJson();
                            updateProcurementsTable();
                            updateCompletedTable();
                            showMessage("Procurement cancelled successfully!");
                        } catch (error) {
                            console.error('Error updating procurement status:', error);
                            alert('Failed to update procurement status');
                        }
                    } else {
                        event.target.value = 'Booked'; 
                    }
                }
            });
        });
        
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

// Update the completed procurements table with given information
async function updateCompletedTable() {
    const tbody = document.querySelector('.completed-table').querySelector('tbody');
    const startIndex = (currentCompletedPage - 1) * completedPerPage;
    const endIndex = Math.min(startIndex + completedPerPage, completedProcurements.length);
    const pageData = completedProcurements.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    pageData.forEach(procurement => {
        const row = document.createElement('tr');
        let acceptedItemString = "";
        let discardedItemString = "";
        let acceptedCount = 0;
        let discardedCount = 0;

        for (const item of procurement.receivedItems) {
            if (acceptedCount === 0) {
                acceptedItemString = `${item.itemName} (${item.quantityAccepted}kg)`;
            } else {
                acceptedItemString += `, ${item.itemName} (${item.quantityAccepted}kg)`;
            }
            acceptedCount++;
        }

        for (const item of procurement.receivedItems) {
            if ((discardedCount == 0 && item.quantityDiscarded > 0) || (item.quantityDiscarded > 0 && discardedItemString === "")) {
                discardedItemString = `${item.itemName} (${item.quantityDiscarded}kg)`;
            } else if (item.quantityDiscarded > 0) {
                discardedItemString += `, ${item.itemName} (${item.quantityDiscarded}kg)`;
            }
            discardedCount++;
        }

        row.innerHTML = `
            <td>${procurement.procurementID}</td>
            <td>${procurement.agencyName}</td>
            <td>${procurement.receivedDate}</td>
            <td>${acceptedItemString}</td>
            <td>${discardedItemString}</td>
        `;
        
        tbody.appendChild(row);
        acceptedCount = 0;
        discardedCount = 0;
        acceptedItemString = "";
        discardedItemString = "";
    });

    const totalCompletedPages = Math.ceil(completedProcurements.length / completedPerPage);
    document.getElementById('currentCompletedPage').textContent = currentCompletedPage;
    document.getElementById('totalCompletedPages').textContent = totalCompletedPages;
    document.getElementById('prevCompleted').disabled = currentCompletedPage === 1;
    document.getElementById('nextCompleted').disabled = currentCompletedPage === totalCompletedPages || completedProcurements.length === 0;

    if (completedProcurements.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" class="text-center">No completed procurements found</td>';
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

// Update functions and pagination handlers (existing implementation)
window.changeCompletedPage = function(delta) {
    const totalCompletedPages = Math.ceil(completedProcurements.length / completedPerPage);
    const newPage = currentCompletedPage + delta;
    
    if (newPage >= 1 && newPage <= totalCompletedPages) {
        currentCompletedPage = newPage;
        updateCompletedTable();
    }
};

// Setter for procurement status
async function setProcurementStatus(procurementID, status) {
    const response = await fetch(`/logistics/api/procurement-status/${procurementID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: status })
    });
    
    if (!response.ok) {
        throw new Error('Failed to update procurement status');
    }
    
    return await response.json();
}

// Return an html div given the form label and input
function createFormGroup(labelText, input) {
    const group = document.createElement('div');
    group.className = 'form-group';
    const label = document.createElement('label');
    label.textContent = labelText;
    
    group.appendChild(label);
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

// Add a new row to the items section
function addItemRow(container) {
    const row = document.createElement('div');
    row.className = 'item-row';
    
    // Add item dropdown
    const itemSelect = document.createElement('select');
    itemSelect.className = 'form-control';
    itemSelect.required = true;
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select an item';
    itemSelect.appendChild(defaultOption);
    
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        itemSelect.appendChild(option);
    });

    row.appendChild(itemSelect);
    
    // Add number input for qty
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.className = 'form-control qty-input';
    qtyInput.min = '1';
    qtyInput.required = true;
    qtyInput.placeholder = 'Quantity in kg';
    row.appendChild(qtyInput);

    // Add number input for kg
    const costInput = document.createElement('input');
    costInput.type = 'number';
    costInput.className = 'form-control cost-input';
    costInput.min = '1';
    costInput.required = true;
    costInput.placeholder = 'Cost per kg in Pesos';
    row.appendChild(costInput);
    
    // Add remove button if not the first row
    if (container.querySelectorAll('.item-row').length > 0) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-row-btn';
        removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        removeBtn.onclick = () => row.remove();
        row.appendChild(removeBtn);
    }
    
    container.insertBefore(row, container.querySelector('.add-row-btn'));
}

// Create a row for received item
function createReceivedItemRow(item, index) {
    const row = document.createElement('div');
    row.className = 'received-item-row';
    
    const nameLabel = document.createElement('div');
    nameLabel.className = 'item-name';
    nameLabel.textContent = item.itemName;
    
    const bookedQty = document.createElement('div');
    bookedQty.className = 'booked-qty';
    bookedQty.textContent = `Booked: ${item.quantityShipping}kg`;
    
    const discardedGroup = document.createElement('div');
    discardedGroup.className = 'input-group';
    
    const discardedLabel = document.createElement('label');
    discardedLabel.textContent = 'Discarded:';
    
    const discardedInput = document.createElement('input');
    discardedInput.type = 'number';
    discardedInput.min = '0';
    discardedInput.max = item.quantityShipping;
    discardedInput.value = '0';
    discardedInput.className = 'form-control discarded-input';
    discardedInput.dataset.itemIndex = index;
    discardedInput.addEventListener('input', updateAcceptedQuantity);
    
    const acceptedDisplay = document.createElement('div');
    acceptedDisplay.className = 'accepted-display';
    acceptedDisplay.innerHTML = `<span>Accepted: </span><span class="accepted-qty">${item.quantityShipping}</span>kg`;
    
    discardedGroup.appendChild(discardedLabel);
    discardedGroup.appendChild(discardedInput);
    
    row.appendChild(nameLabel);
    row.appendChild(bookedQty);
    row.appendChild(discardedGroup);
    row.appendChild(acceptedDisplay);
    
    return row;
}

// Update accepted quantity when discarded amount changes
function updateAcceptedQuantity(event) {
    const row = event.target.closest('.received-item-row');
    const bookedQty = parseInt(row.querySelector('.booked-qty').textContent.match(/\d+/)[0]);
    const discardedQty = parseInt(event.target.value) || 0;
    
    // Validate discarded quantity
    if (discardedQty < 0) {
        event.target.value = 0;
    } else if (discardedQty > bookedQty) {
        event.target.value = bookedQty;
    }
    
    const acceptedQty = bookedQty - parseInt(event.target.value);
    row.querySelector('.accepted-qty').textContent = acceptedQty;
}

// Collect all data from input fields and send to db
async function createProcurement() {
    const form = document.getElementById('procurement-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = {
        agency: form.querySelector('select').value,
        items: Array.from(form.querySelectorAll('.item-row')).map(row => ({
            item: row.querySelector('select').value,
            quantity: parseInt(row.querySelector('.qty-input').value),
            cost: parseInt(row.querySelector('.cost-input').value)
        })),
        incomingDate: form.querySelector('input[type="date"]').value
    };
    
    const response = await fetch('/logistics/api/submit-procurement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to fetch partner details');
    
    await getProcurementsJson();
    closeOverlay();
    showMessage("Procurement added successfully!");
    updateProcurementsTable();
}

// Save completed procurement details
async function saveCompletedProcurement() {
    const form = document.getElementById('completed-form');
    if (!form) {
        console.error('Completed form not found');
        return;
    }
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const procurementID = form.dataset.procurementId;
    const receivedDate = form.querySelector('input[type="date"]').value;
    
    const receivedItems = Array.from(form.querySelectorAll('.received-item-row')).map(row => ({
        itemName: row.querySelector('.item-name').textContent,
        quantityDiscarded: parseInt(row.querySelector('.discarded-input').value) || 0,
        quantityAccepted: parseInt(row.querySelector('.accepted-qty').textContent)
    }));
    
    const formData = {
        procurementID,
        receivedDate,
        receivedItems,
    };
    
    try {
        const response = await fetch('/logistics/api/complete-procurement', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });
        
        if (!response.ok) throw new Error('Failed to complete procurement');
        
        await getProcurementsJson();
        closeCompletedOverlay();
        showMessage("Procurement completed successfully!");
        updateProcurementsTable();
        updateCompletedTable();
    } catch (error) {
        console.error('Error completing procurement:', error);
        alert('Failed to complete procurement');
    }
}

// Open the procurement overlay when the "Create" button is clicked
function openOverlay() {
    const overlay = document.getElementById('procurement-overlay');
    overlay.style.display = 'flex';
}

// Close the procurement overlay when the "Close" button is clicked
function closeOverlay() {
    const overlay = document.getElementById('procurement-overlay');
    overlay.style.display = 'none';
    
    // Reset the form
    const form = document.getElementById('procurement-form');
    if (form) {
        form.reset();
        const itemsSection = document.getElementById('items-section');
        const rows = itemsSection.querySelectorAll('.item-row');
        for (let i = 1; i < rows.length; i++) {
            rows[i].remove();
        }
    }
}

// Close completed overlay
function closeCompletedOverlay() {
    const overlay = document.getElementById('completed-overlay');
    overlay.style.display = 'none';
    
    // Clear form
    const form = document.getElementById('completed-form');
    if (form) {
        form.remove();
    }
}

// Close overlay if clicked outside
function closeOverlayOutside(event) {
    if (event.target.id === 'procurement-overlay') {
        closeOverlay();
    } else if (event.target.id === 'completed-overlay') {
        closeCompletedOverlay();
    }
}

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

// Redirect to the Warehouse Inventory page
window.navigateToWarehouse = function () {
    window.location.href = '/logistics/warehouse';
};
