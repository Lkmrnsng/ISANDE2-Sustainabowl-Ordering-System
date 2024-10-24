// Sample Data
const processingRequests = [
    {
        id: 'REQ001',
        name: 'Alberto Baguio',
        toProcess: 'Tomatoes',
        status: 'Pending',
        alertIcon: true,
        produce: [
            { id: 'P001', name: 'Tomatoes', process: 'Washing', deliverBy: '2024-10-25', quantity: 100, status: 'In Progress' },
            { id: 'P002', name: 'Peppers', process: 'Slicing', deliverBy: '2024-10-26', quantity: 200, status: 'Pending' }
        ]
    },
    {
        id: 'REQ002',
        name: 'Baguio Cy',
        toProcess: 'Potatoes',
        status: 'In Progress',
        alertIcon: false,
        produce: [
            { id: 'P003', name: 'Potatoes', process: 'Peeling', deliverBy: '2024-10-24', quantity: 300, status: 'In Progress' }
        ]
    }
];

// Populate Left Table with Sample Data
function populateLeftTable() {
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
            populateRightTable(requestId);
        });
    });
}

// Populate Right Table based on selected request
function populateRightTable(requestId) {
    const selectedRequest = processingRequests.find(req => req.id === requestId);
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

    // Move the event listener setup here
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

    // Add event listener to close the modal (make sure this is not added multiple times)
    const closeButton = document.querySelector('.close-btn');
    closeButton.removeEventListener('click', closeModal); // Remove any previous listeners to avoid duplicates
    closeButton.addEventListener('click', closeModal);
}

// Function to close the modal
function closeModal() {
    document.getElementById('process-details-modal').classList.add('hidden');
}

// Initialize
populateLeftTable();
