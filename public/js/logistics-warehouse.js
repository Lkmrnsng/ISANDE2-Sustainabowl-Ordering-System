const itemsPerPage = 10;
let currentPage = 1;
let inventoryData = [];

document.addEventListener('DOMContentLoaded', function() {
    // Fetch the initial data
    async function initialize() {
        try {
            await getInventoryJson();
            updateInventoryTable();
        } catch (error) {
            console.log("Fetch data error:", error);
        }
    }

    initialize();
});

// Fetch the json inventory data from the server
async function getInventoryJson() {    
    try {
        const response = await fetch('/logistics/api/inventory');
        if (!response.ok) throw new Error('Failed to fetch inventory data');
        const data = await response.json();

        const compiledData = data.map(row => ({
            particular: row.particular,
            type: row.type,
            available: row.available,
            reserved: row.reserved,
            total: row.total
        }));

        inventoryData = [...compiledData];
        inventoryData.sort((a, b) => a.type.localeCompare(b.type));
    } catch (err) {
        console.error('Error initializing inventory:', err);
    }
}


// Using the current contents of inventoryData, clear and update the inventory table
function updateInventoryTable() {
    const tbody = document.getElementById('inventory-table').querySelector('tbody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, inventoryData.length);
    const pageData = inventoryData.slice(startIndex, endIndex);

    // Clear existing rows
    tbody.innerHTML = '';

    // Add new rows
    pageData.forEach(inventory => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${inventory.particular}</td>
            <td>${inventory.type}</td>
            <td>${inventory.available}</td>
            <td>${inventory.reserved}</td>
            <td>${inventory.total}</td>
        `;

        tbody.appendChild(row);
    });

    // Update pagination controls
    const totalPages = Math.ceil(inventoryData.length / itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || inventoryData.length === 0;

    // Handle empty state
    if (inventoryData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" class="text-center">No inventory found</td>';
        tbody.appendChild(emptyRow);
    }
}

// Change page function
window.changePage = function(delta) {
    const totalPages = Math.ceil(inventoryData.length / itemsPerPage);
    const newPage = currentPage + delta;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateInventoryTable();
    }
};

// Sort inventoryData
window.sortInventory = function() {
    const sortBy = document.getElementById('sortByInventory').value;
    
    switch(sortBy) {
        case 'typeAsc':
            inventoryData.sort((a, b) => a.type.localeCompare(b.type));
            break;
        case 'typeDesc':
            inventoryData.sort((a, b) => b.type.localeCompare(a.type));
            break;
        case 'availableDesc':
            inventoryData.sort((a, b) => parseInt(b.available) - parseInt(a.available));
            break;
        case 'reservedDesc':
            inventoryData.sort((a, b) => parseInt(b.reserved) - parseInt(a.reserved));
            break;
        case 'totalDesc':
            inventoryData.sort((a, b) => parseInt(b.total) - parseInt(a.total));
            break;
    }

    currentPage = 1;
    updateInventoryTable();
}
