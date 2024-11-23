document.addEventListener('DOMContentLoaded', function() {
    const itemsPerPage = 7; // For requests table
    const inventoryItemsPerPage = 5; // For inventory table
    let currentPage = 1;
    let currentInventoryPage = 1;
    let filteredRequests = [];
    let allRequests = [];

    initializeTables();

    async function initializeTables() {
        const requestsTable = document.getElementById('requestsTable');
        if (requestsTable) {
            const rows = Array.from(requestsTable.getElementsByTagName('tr'));
            // Skip header row
            allRequests = rows.slice(1).map(row => ({
                requestID: row.cells[0].textContent,
                partner: row.cells[1].textContent,
                salesInCharge: row.cells[2].textContent,
                status: row.cells[3].textContent,
                dates: row.cells[4].textContent
            }));
            filteredRequests = [...allRequests];
            updateRequestsTable();
        }
    }

    // Filter requests
    window.filterRequests = function() {
        const statusFilter = document.getElementById('statusFilter').value;

        
        filteredRequests = allRequests.filter(request => {
            if (statusFilter !== 'all' && request.status !== statusFilter) {
                return false;
            }
            return true;
        });

        currentPage = 1;
        updateRequestsTable();
    };

    // Sort requests
    window.sortRequests = function() {
        const sortBy = document.getElementById('sortBy').value;
        
        switch(sortBy) {
            case 'idAsc':
                filteredRequests.sort((a, b) => a.requestID.localeCompare(b.requestID, undefined, {numeric: true}));
                break;
            case 'idDesc':
                filteredRequests.sort((a, b) => b.requestID.localeCompare(a.requestID, undefined, {numeric: true}));
                break;
            case 'dateAsc':
                filteredRequests.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'dateDesc':
                filteredRequests.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            default:
                filteredRequests = [...allRequests];
        }
        
        currentPage = 1; // Reset to first page after sorting
        updateRequestsTable();
    };

    // Update requests table
    function updateRequestsTable() {
        const table = document.getElementById('requestsTable').getElementsByTagName('tbody')[0];
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredRequests.slice(startIndex, endIndex);

        // Update table content
        table.innerHTML = pageData.map(request => `
            <tr>
                <td>${request.requestID}</td>
                <td>${request.partner}</td>
                <td>${request.salesInCharge}</td>
                <td>${request.status}</td>
                <td>${request.dates}</td>
            </tr>
        `).join('');

        // Update pagination info and buttons
        const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('prevRequest').disabled = currentPage === 1;
        document.getElementById('nextRequest').disabled = currentPage === totalPages;
    }

    // Handle page changes for requests
    window.changePage = function(delta) {
        const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
        const newPage = currentPage + delta;
        
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            updateRequestsTable();
        }
    };

    // Handle page changes for inventory
    window.changeInventoryPage = function(delta) {
        const inventoryRows = document.querySelectorAll('.inventory tbody tr');
        const totalPages = Math.ceil(inventoryRows.length / inventoryItemsPerPage);
        const newPage = currentInventoryPage + delta;
        
        if (newPage >= 1 && newPage <= totalPages) {
            currentInventoryPage = newPage;
            updateInventoryTable();
        }
    };

    // Update inventory table
    function updateInventoryTable() {
        const rows = document.querySelectorAll('.inventory tbody tr');
        const startIndex = (currentInventoryPage - 1) * inventoryItemsPerPage;
        const endIndex = startIndex + inventoryItemsPerPage;

        rows.forEach((row, index) => {
            row.style.display = (index >= startIndex && index < endIndex) ? '' : 'none';
        });

        // Update pagination info and buttons
        const totalPages = Math.ceil(rows.length / inventoryItemsPerPage);
        document.getElementById('currentInventoryPage').textContent = currentInventoryPage;
        document.getElementById('totalInventoryPages').textContent = totalPages;
        document.getElementById('prevInventory').disabled = currentInventoryPage === 1;
        document.getElementById('nextInventory').disabled = currentInventoryPage === totalPages;
    }
});