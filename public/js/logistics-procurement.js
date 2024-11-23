// set table reqs 
// initialize tables -> get all procurement data then populate each table
// populate procurement, sort by date 
// populate completed, sort by date
// pagination
// create procurement
// set status

// populate procurement: procurementID, agencyName, incomingDate, items (merged itemname & qty), set status
// populate completed: procurementID, agencyName, receivedDate, items accepted (itemname & qty), items discarded (itemname & qty)

document.addEventListener('DOMContentLoaded', function() {
    const procurementsPerPage = 7;
    const completedPerPage = 7;
    let currentProcurementPage = 1;
    let currentCompletedPage = 1;
    let allProcurements = [];
    let completedProcurements = [];

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
            completedProcurements = allProcurements.filter(procurement => procurement.status === "Completed").sort((a, b) => new Date(b.receivedDate) - new Date(a.receivedDate));;
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
                    <select class="status-dropdown">
                        <option value="Booked" ${procurement.status === 'Booked' ? 'selected' : ''}>Booked</option>
                        <option value="Cancelled" ${procurement.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        <option value="Completed" ${procurement.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </td>
            `;

            // Add click event listener to the dropdown
            const dropdown = row.querySelector('.status-dropdown');
            dropdown.addEventListener('change', (event) => {
                const selectedValue = event.target.value;
                console.log(`Status for procurement ${procurement.procurementID} changed to: ${selectedValue}`);
                // Additional logic for handling the status change can go here
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
                if (discardedCount === 0) {
                    discardedItemString = `${item.itemName} (${item.quantityDiscarded}kg)`;
                } else {
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

    function navigateToWarehouse() {
        // redirect to /logistics/warehouse
    }

    function createProcurement() {
        // unhide the overlay, function like a form
    }

    // Setter for procurement status
    async function setProcurementStatus (req, res) {
        const procurementID = req.params.procurementID;
        const { status } = req.body;
            // add alert for changing status


        try {
            // const request = await Request.findOne({ requestID: requestID })

            // if (!request) {
            //     return res.status(404).json({
            //         success: false,
            //         message: 'Request not found'
            //     });
            // }

            // // Update the request status
            // await Request.updateOne({ requestID: requestID }, { $set: { status: status }});

            // return res.status(200).json({
            //     success: true,
            //     message: 'Request status updated successfully',
            //     request: {
            //         id: request._id,
            //         status: status,
            //     }
            // });
        } catch (error) {
            console.error('Error updating procurement status:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    initializeTables();
});