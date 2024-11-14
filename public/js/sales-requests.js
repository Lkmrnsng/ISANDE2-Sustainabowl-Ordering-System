document.addEventListener('DOMContentLoaded', function() {
    const itemsPerPage = 7;
    const partnersPerPage = 5;
    let currentPage = 1;
    let currentPartnerPage = 1;
    let filteredRequests = [];
    let allRequests = [];

    // Load the page for the first time
    async function initializeTables() {
        const requestsTable = document.getElementById('requestsTable');
        if (requestsTable) {
            await refreshRequestsData();
            updateRequestsTable();
        }
    }

    // Fetch the json requests data from the server
    async function refreshRequestsData() {
        try {
            const response = await fetch('/sales/api/requests');
            if (!response.ok) throw new Error('Failed to fetch requests');
            const data = await response.json();
            allRequests = data.map(row => ({
                requestID: row.requestID,
                partner: row.partner,
                status: row.status,
                date: row.date
            }));
            filteredRequests = [...allRequests];
        } catch (error) {
            console.error('Error refreshing requests data:', error);
        }
    }

    // Filter requests
    window.filterRequests = function() {
        const statusFilter = document.getElementById('statusFilter').value;
        
        filteredRequests = allRequests.filter(request => {
            return statusFilter === 'all' || request.status === statusFilter;
        });
        
        currentPage = 1;
        updateRequestsTable();
    };

    // Sort requests
    window.sortRequests = function() {
        const sortBy = document.getElementById('sortByRequest').value;
        
        filteredRequests = [...filteredRequests];
        
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
            case 'none':
                filteredRequests = [...allRequests];
                break;
        }
        
        currentPage = 1;
        updateRequestsTable();
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

    // Using the current contents of filteredRequests, clear and update the requests table
    function updateRequestsTable() {
        const tbody = document.getElementById('requestsTable').querySelector('tbody');
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredRequests.length);
        const pageData = filteredRequests.slice(startIndex, endIndex);

        // Clear existing rows
        tbody.innerHTML = '';

        // Add new rows
        pageData.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="request-checkbox"></td>
                <td>${request.requestID}</td>
                <td>${request.partner}</td>
                <td>${request.status}</td>
                <td>${request.date}</td>
            `;

            // Add click event listener to the checkbox
            const checkbox = row.querySelector('.request-checkbox');
            checkbox.addEventListener('change', function() {
                // Uncheck all other checkboxes
                document.querySelectorAll('.request-checkbox').forEach(cb => {
                    if (cb !== checkbox) cb.checked = false;
                });

                if (checkbox.checked) {
                    // Load details for the selected request
                    selectedRequest = request.requestID;
                    loadRequestDetails(request.requestID);
                } else {
                    // Clear the details panel
                    selectedRequest = null;
                    updateRequestDetailsPanel(null);
                }
            });
            
            tbody.appendChild(row);
        });

        // Update pagination controls
        const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('prevRequest').disabled = currentPage === 1;
        document.getElementById('nextRequest').disabled = currentPage === totalPages || filteredRequests.length === 0;

        // Handle empty state
        if (filteredRequests.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="5" class="text-center">No requests found</td>';
            tbody.appendChild(emptyRow);
        }
    }

    // Fetch and display request details
    async function loadRequestDetails(requestID) {
        try {
            const response = await fetch(`/sales/api/${requestID}/details`);
            if (!response.ok) throw new Error('Failed to fetch request details');
            const details = await response.json();
            updateRequestDetailsPanel(details);
        } catch (error) {
            console.error('Error loading request details:', error);
            updateRequestDetailsPanel(null);
        }
    }

    // Update the details panel with request information
    function updateRequestDetailsPanel(details) {
        const detailsContainer = document.querySelector('.request-details .item-list');
        const totalElement = document.getElementById('request-total');
        const statusElement = document.getElementById('request-status');

        if (!details) {
            // Show error or empty state
            detailsContainer.innerHTML = '<p class="empty-state">No request details available</p>';
            totalElement.textContent = '₱0';
            statusElement.textContent = 'N/A';
            return;
        }

        // Update items list
        detailsContainer.innerHTML = details.items.map(item => `
            <div class="item">
                <div class="placeholder-image"><img class="request-image" src="${item.itemImage}" alt="Product Image" ></div>
                <p>${item.name}</p>
                <p>${item.quantity} kg</p>
                <p>₱${item.price.toFixed(2)}</p>
            </div>
        `).join('');

        // Update summary section
        totalElement.textContent = `₱${details.total.toFixed(2)}`;
        statusElement.textContent = details.status;

        // Show the details panel if it was hidden
        document.querySelector('.request-details').style.display = 'block';
    }

    // Function to change page on the sustainapartner table
    window.changePartnerPage = function(delta) {
        const partnerRows = document.querySelectorAll('.sustaina-partners tbody tr');
        const totalPages = Math.ceil(partnerRows.length / partnersPerPage);
        const newPage = currentPartnerPage + delta;
        
        if (newPage >= 1 && newPage <= totalPages) {
            currentPartnerPage = newPage;
            updatePartnerTable();
        }
    };

    // 
    function updateRequestDetails(details) {
        const detailsContainer = document.querySelector('.request-details .item-list');
        detailsContainer.innerHTML = details.items.map(item => `
            <div class="item">
                <div class="placeholder-image"></div>
                <p>${item.name}</p>
                <p>${item.quantity} kg</p>
                <p>₱${item.price}</p>
            </div>
        `).join('');
    
        // Update summary
        document.querySelector('.summary-details .attribute:first-child').textContent = `₱${details.total}`;
        document.querySelector('.summary-details .attribute:last-child').textContent = details.status;
    }

    // For every selected request, set its status to 'Cancelled'
    window.cancelRequests = async function() {
        const requestsTable = document.getElementById('requestsTable');
        if (requestsTable) {
            const checkedBoxes = requestsTable.querySelectorAll('.request-checkbox:checked');
            const confirmMessage = checkedBoxes.length === 1 
                ? 'Are you sure you want to cancel this request?' 
                : `Are you sure you want to cancel these ${checkedBoxes.length} requests?`;
            if (!confirm(confirmMessage)) return;

            // Get all selected requests
            const cancelPromises = Array.from(checkedBoxes).map(async checkbox => {
                const row = checkbox.closest('tr');
                const requestID = row.cells[1].textContent.trim();
                return setRequestStatus(requestID, "Cancelled");
            });

            try {
                await Promise.all(cancelPromises);
                await refreshRequestsData();
                updateRequestsTable();
                updatePartnerTable();
                
                // Clear all checkboxes
                checkedBoxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
            } catch (error) {
                console.error('Error cancelling requests:', error);
                alert('Failed to cancel one or more requests. Please try again.');
            }
        }
    };

    // Modify the MongoDB to set the request status
    async function setRequestStatus(requestID, status) {
        try {
            const response = await fetch(`/sales/api/${requestID}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            if (!response.ok) throw new Error(`Failed to update status for request ${requestID}`);
        } catch (error) {
            console.error('Failed to update request status:', error);
            throw error;
        }
    }

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

    // Fetch newest partner data and refresh the table
    async function updatePartnerTable() {
        try {
            const customers = await User.find({ usertype: 'Customer' });
            const partnerStats = [];
    
            for (const customer of customers) {
                // Get total requests
                const totalReqs = await Request.countDocuments({ customerID: customer.userID });
    
                // Calculate weekly average 
                // const weeklyReqs = await Request.aggregate([
                //     { 
                //         $match: { 
                //             customerID: customer.userID,
                //             requestDate: { 
                //                 $type: "date"  // Only match valid date fields
                //             }
                //         }
                //     },
                //     { 
                //         $group: {
                //             _id: { 
                //                 year: { $year: "$requestDate" },
                //                 week: { $week: "$requestDate" }
                //             },
                //             count: { $sum: 1 }
                //         }
                //     },
                //     { 
                //         $group: {
                //             _id: null,
                //             avgWeeklyReqs: { $avg: "$count" }
                //         }
                //     }
                // ]).catch(err => []);
    
                // Calculate cancel rate
                const cancelledReqs = await Request.countDocuments({
                    customerID: customer.userID,
                    status: 'Cancelled'
                });
    
                // const createdAtDate = customer.createdAt instanceof Date ? 
                //     customer.createdAt.toLocaleDateString() : 
                //     new Date(customer.createdAt).toLocaleDateString();
    
                partnerStats.push({
                    name: customer.restaurantName || customer.name,
                    pointPerson: customer.name,
                    // location: customer.address || 'N/A',
                    totalReqs: totalReqs,
                    // avgWeeklyReqs: weeklyReqs[0]?.avgWeeklyReqs?.toFixed(1) || '0.0',
                    cancelRate: totalReqs > 0 ? ((cancelledReqs / totalReqs) * 100).toFixed(1) + '%' : '0.0%',
                    // clientSince: createdAtDate || 'N/A'
                });
            }
            return partnerStats;
        } catch (err) {
            console.error('Error in getPartnersData:', err);
            return [];
        }
    }

    initializeTables();
});

