// public/js/logistics_foodprocess.js

// Fetch and populate data from the JSON file
async function loadData() {
    try {
        const response = await fetch('/path/to/foodProcessingData.json');
        const data = await response.json();
        populateLeftTable(data.processingRequests);
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

// Populate Left Table with Data
function populateLeftTable(processingRequests) {
    const tbody = document.querySelector('.processing-table tbody');
    tbody.innerHTML = ''; // Clear existing rows

    processingRequests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="request-id-btn" data-request-id="${request.id}">${request.id}</button></td>
            <td>${request.name}</td>
            <td>${request.toProcess}</td>
            <td>${request.status} ${request.alertIcon ? '<i class="alert-icon">!</i>' : ''}</td>
        `;
        tbody.appendChild(row);
    });

    // Add click event listeners to request buttons
    document.querySelectorAll('.request-id-btn').forEach(button => {
        button.addEventListener('click', () => {
            const requestId = button.getAttribute('data-request-id');
            const selectedRequest = processingRequests.find(req => req.id === requestId);
            populateRightTable(selectedRequest);
        });
    });
}

// Populate Right Table based on selected request
function populateRightTable(selectedRequest) {
    if (!selectedRequest) return;

    const detailsDiv = document.getElementById('processing-details');
    detailsDiv.querySelector('h2').textContent = selectedRequest.name;
    detailsDiv.querySelector('.details-header span').textContent = `ID: ${selectedRequest.id}`;

    const tbody = detailsDiv.querySelector('.produce-table tbody');
    tbody.innerHTML = ''; // Clear existing rows

    selectedRequest.produce.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.process}</td>
            <td><button class="details-btn" data-produce-id="${item.id}">→</button></td>
        `;
        tbody.appendChild(row);
    });

    // Add event listeners to details buttons
    const detailButtons = tbody.querySelectorAll('.details-btn');
    detailButtons.forEach(button => {
        button.addEventListener('click', () => {
            const produceId = button.getAttribute('data-produce-id');
            showModal(selectedRequest, produceId);
        });
    });
}

// Show Modal with Processing Details
function showModal(selectedRequest, produceId) {
    const produceItem = selectedRequest.produce.find(item => item.id === produceId);
    if (!produceItem) return;

    // Populate modal with data
    document.getElementById('modal-request-id').textContent = selectedRequest.id;
    document.getElementById('modal-produce').textContent = produceItem.name;
    document.getElementById('modal-process').textContent = produceItem.process;
    document.getElementById('modal-deliver-by').textContent = produceItem.deliverBy;
    document.getElementById('modal-quantity').textContent = produceItem.quantity;
    document.getElementById('modal-status').textContent = produceItem.status;

    // Show modal
    document.getElementById('process-details-modal').classList.remove('hidden');

    // Add event listener to close the modal
    document.querySelector('.close-btn').addEventListener('click', closeModal);
}

// Function to close the modal
function closeModal() {
    document.getElementById('process-details-modal').classList.add('hidden');
}

// Initialize by loading data
loadData();
