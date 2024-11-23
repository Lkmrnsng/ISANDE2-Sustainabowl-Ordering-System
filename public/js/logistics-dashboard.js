const procurementsPerPage = 7;
let currentProcurementPage = 1;
let allProcurements = [];

document.addEventListener('DOMContentLoaded', function() {
    // Load the page for the first time
    async function initializeTables() {
        const procurementTable = document.querySelector('.procurement-table');
        if (procurementTable) {
            await getProcurementsJson();
            updateProcurementsTable();
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

    // Update functions and pagination handlers (existing implementation)
    window.changeProcurementPage = function(delta) {
        const totalProcurementPages = Math.ceil(allProcurements.length / procurementsPerPage);
        const newPage = currentProcurementPage + delta;
        
        if (newPage >= 1 && newPage <= totalProcurementPages) {
            currentProcurementPage = newPage;
            updateProcurementsTable();
        }
    };

    initializeTables();
});