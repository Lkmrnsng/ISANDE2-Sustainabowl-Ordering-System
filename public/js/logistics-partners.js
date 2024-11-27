const itemsPerPage = 7;
let currentPage = 1;
let agencies = [];
let procurements = [];

document.addEventListener('DOMContentLoaded', function() {
    // Load the page for the first time
    async function initialize() {
        const agencyTable = document.querySelector('.agency-table');
        if (agencyTable) {
            await getAgenciesJson();
            await getProcurementsJson();
            updateAgenciesTable();
        } else {
            console.log("Table not found");
        }
    }

    initialize();
});

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
            maxWeight: row.maxWeight
        }));

        agencies = compiledData.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
        console.error('Error initializing agencies:', err);
    }
}

// Fetch the json procurements data from the server
async function getProcurementsJson() {
    try {
        const response = await fetch('/logistics/api/procurements');
        if (!response.ok) throw new Error('Failed to fetch procurements data');
        const data = await response.json();

        const compiledData = data.map(row => ({
            procurementID: row.procurementID,
            agencyName: row.agencyName,
            incomingDate: row.incomingDate,
            receivedDate: row.receivedDate,
            bookedItems: row.bookedItems,
            receivedItems: row.receivedItems,
            status: row.status
        }));

        procurements = [...compiledData];
    } catch (err) {
        console.error('Error initializing procurements:', err);
    }
}

// Using the current contents of agencies and procurements, clear and update the processing table
function updateAgenciesTable() {
    const tbody = document.querySelector('.agency-table').querySelector('tbody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, agencies.length);
    const pageData = agencies.slice(startIndex, endIndex);

    // Clear existing rows
    tbody.innerHTML = '';

    // Add new rows
    pageData.forEach(agency => {
        const row = document.createElement('tr');

        // Format contact number
        const formattedNumber = agency.contact
            .replace("+63", "0")
            .replace(/(\d{4})(\d{3})(\d{4})/, "$1-$2-$3");

        // Calculate price per kg
        const pricePerKg = agency.price / agency.maxWeight;
        const roundedPricePerKg = pricePerKg.toFixed(2); 

        // Sort and parse latest shipment date
        const agencyProcurements = [];
        for (const procurement of procurements) {
            if (procurement.agencyName.toLowerCase().trim() === agency.name.toLowerCase().trim() && procurement.receivedDate !== '') {
                agencyProcurements.push(procurement);
            }
        }
        agencyProcurements.sort((a, b) => new Date(b.receivedDate) - new Date(a.receivedDate));
        const latestDate = agencyProcurements[0]?.receivedDate.split('T')[0];

        row.innerHTML = `
            <td>${agency.name}</td>
            <td>${formattedNumber}</td>
            <td>${agency.location}</td>
            <td>₱${agency.price}</td> 
            <td>${agency.maxWeight}kg</td>
            <td>₱${roundedPricePerKg}</td>
            <td>${latestDate}</td>
        `;

        tbody.appendChild(row);
    });

    // Update pagination controls
    const totalPages = Math.ceil(agencies.length / itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || agencies.length === 0;

    // Handle empty state
    if (agencies.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" class="text-center">No agencies found</td>';
        tbody.appendChild(emptyRow);
    }
}

// Sort agencies
window.sortAgencies = function() {
    const sortBy = document.getElementById('sortByAgency').value;
    
    switch(sortBy) {
        case 'nameAsc':
            agencies.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'priceDesc':
            agencies.sort((a, b) => b.price - a.price);
            break;
        case 'weightDesc':
            agencies.sort((a, b) => b.maxWeight - a.maxWeight);
            break;
        case 'perKgDesc':
            agencies.sort((a, b) => (b.price / b.maxWeight) - (a.price / a.maxWeight));
            break;
    }

    currentPage = 1;
    updateAgenciesTable();
}

// Change page function
window.changePage = function(delta) {
    const totalPages = Math.ceil(agencies.length / itemsPerPage);
    const newPage = currentPage + delta;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateAgenciesTable();
    }
};