document.addEventListener('DOMContentLoaded', function() {
    // Navigation buttons for calendar
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    
    if (prevWeekBtn && nextWeekBtn) {
        prevWeekBtn.addEventListener('click', () => navigateWeek('prev'));
        nextWeekBtn.addEventListener('click', () => navigateWeek('next'));
    }

    // Task status toggle
    window.toggleTaskStatus = async function(date, taskId) {
        try {
            const response = await fetch('/api/tasks/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ date, taskId })
            });

            if (response.ok) {
                const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
                const statusButton = taskCard.querySelector('.status-button');
                const taskText = taskCard.querySelector('.task-text');
                
                statusButton.classList.toggle('completed');
                statusButton.classList.toggle('pending');
                taskText.classList.toggle('completed');
                
                // Update the status icon
                const icon = statusButton.querySelector('.status-icon');
                if (statusButton.classList.contains('completed')) {
                    icon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
                } else {
                    icon.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"/>';
                }
            }
        } catch (error) {
            console.error('Error toggling task status:', error);
        }
    };

    // Function to handle week navigation
    async function navigateWeek(direction) {
        const currentDate = new Date(document.querySelector('.calendar-day-column').dataset.date);
        const newDate = new Date(currentDate);
        
        if (direction === 'prev') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setDate(newDate.getDate() + 7);
        }

        try {
            const response = await fetch(`/api/calendar?date=${newDate.toISOString()}`);
            if (response.ok) {
                const data = await response.json();
                updateCalendar(data.weekDays);
            }
        } catch (error) {
            console.error('Error navigating calendar:', error);
        }
    }

    // Function to update calendar UI
    function updateCalendar(weekDays) {
        const headerContainer = document.getElementById('calendarHeader');
        const bodyContainer = document.getElementById('calendarBody');
        
        // Update header
        headerContainer.innerHTML = weekDays.map(day => `
            <div class="calendar-header-cell ${day.isToday ? 'today' : ''}">
                <div class="day-name">${day.dayName}</div>
                <div class="day-number">${day.dayNumber}</div>
            </div>
        `).join('');

        // Update body
        bodyContainer.innerHTML = weekDays.map(day => `
            <div class="calendar-day-column" data-date="${day.date}">
                ${day.tasks.map(task => `
                    <div class="task-card" data-task-id="${task.id}">
                        <div class="task-content">
                            <button class="status-button ${task.completed ? 'completed' : 'pending'}" 
                                    onclick="toggleTaskStatus('${day.date}', ${task.id})">
                                ${task.completed ? 
                                    '<svg class="status-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' :
                                    '<svg class="status-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>'
                                }
                            </button>
                            <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

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
                status: row.cells[2].textContent,
                date: row.cells[3].textContent
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