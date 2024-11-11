document.addEventListener('DOMContentLoaded', function() {
    const itemsPerPage = 7;
    const partnersPerPage = 5;
    let currentPage = 1;
    let currentPartnerPage = 1;
    let filteredRequests = [];
    let allRequests = [];

    initializeTables();

    async function initializeTables() {
        const requestsTable = document.getElementById('requestsTable');
        if (requestsTable) {
            const rows = Array.from(requestsTable.getElementsByTagName('tr'));
            // Skip header row
            allRequests = rows.slice(1).map(row => ({
                requestID: row.cells[1].textContent,
                partner: row.cells[2].textContent,
                status: row.cells[3].textContent,
                date: row.cells[4].textContent,
                items: row.cells[5].textContent
            }));
            filteredRequests = [...allRequests];
            updateRequestsTable();
        }
    }

    // Filter requests
    window.filterRequests = function() {
        const statusFilter = document.getElementById('statusFilter').value;
        
        if (statusFilter === 'all') {
            filteredRequests = [...allRequests];
        } else {
            filteredRequests = allRequests.filter(request => 
                request.status === statusFilter
            );
        }
        
        currentPage = 1;
        updateRequestsTable();
    };

    // Sort requests (existing implementation)
    window.sortRequests = function() {
        const sortBy = document.getElementById('sortByRequest').value;
        
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
        
        currentPage = 1;
        updateRequestsTable();
    };

    // Sort partners
    window.sortPartners = function() {
        const sortBy = document.getElementById('sortByPartner').value;
        const table = document.querySelector('.sustaina-partners table');
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        
        switch(sortBy) {
            case 'idAsc':
                rows.sort((a, b) => a.cells[0].textContent.localeCompare(b.cells[0].textContent));
                break;
            case 'idDesc':
                rows.sort((a, b) => b.cells[0].textContent.localeCompare(a.cells[0].textContent));
                break;
            case 'totalAsc':
                rows.sort((a, b) => parseInt(a.cells[3].textContent) - parseInt(b.cells[3].textContent));
                break;
            case 'totalDesc':
                rows.sort((a, b) => parseInt(b.cells[3].textContent) - parseInt(a.cells[3].textContent));
                break;
        }
        
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
        
        currentPartnerPage = 1;
        updatePartnerTable();
    };

    // Update functions and pagination handlers (existing implementation)
    window.changePage = function(delta) {
        const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
        const newPage = currentPage + delta;
        
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            updateRequestsTable();
        }
    };

    window.changePartnerPage = function(delta) {
        const partnerRows = document.querySelectorAll('.sustaina-partners tbody tr');
        const totalPages = Math.ceil(partnerRows.length / partnersPerPage);
        const newPage = currentPartnerPage + delta;
        
        if (newPage >= 1 && newPage <= totalPages) {
            currentPartnerPage = newPage;
            updatePartnerTable();
        }
    };

    function updateRequestsTable() {
        const table = document.getElementById('requestsTable').getElementsByTagName('tbody')[0];
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredRequests.slice(startIndex, endIndex);

        table.innerHTML = pageData.map(request => `
            <tr>
                <td><input type="checkbox"></td>
                <td>${request.requestID}</td>
                <td>${request.partner}</td>
                <td>${request.status}</td>
                <td>${request.date}</td>
                <td>${request.items}</td>
            </tr>
        `).join('');

        const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('prevRequest').disabled = currentPage === 1;
        document.getElementById('nextRequest').disabled = currentPage === totalPages;
    }

    function updatePartnerTable() {
        const rows = document.querySelectorAll('.sustaina-partners tbody tr');
        const startIndex = (currentPartnerPage - 1) * partnersPerPage;
        const endIndex = startIndex + partnersPerPage;

        rows.forEach((row, index) => {
            row.style.display = (index >= startIndex && index < endIndex) ? '' : 'none';
        });

        const totalPages = Math.ceil(rows.length / partnersPerPage);
        document.getElementById('currentPartnerPage').textContent = currentPartnerPage;
        document.getElementById('totalPartnerPages').textContent = totalPages;
        document.getElementById('prevPartner').disabled = currentPartnerPage === 1;
        document.getElementById('nextPartner').disabled = currentPartnerPage === totalPages;
    }
});