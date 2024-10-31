async function loadData() {
    try {
        const response = await fetch('/path/to/foodProcessingData.json');
        const data = await response.json();
        populateLeftTable(data.processingRequests); // Assuming `processingRequests` aligns with `RequestSchema`
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function populateLeftTable(processingRequests) {
    const tbody = document.querySelector('.processing-table tbody');
    tbody.innerHTML = '';

    processingRequests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="request-id-btn" data-request-id="${request.requestID}">${request.requestID}</button></td>
            <td>${request.name}</td>
            <td>${request.toProcess}</td>
            <td>${request.status} ${request.alertIcon ? '<i class="alert-icon">!</i>' : ''}</td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.request-id-btn').forEach(button => {
        button.addEventListener('click', () => {
            const requestId = button.getAttribute('data-request-id');
            const selectedRequest = processingRequests.find(req => req.requestID === requestId);
            populateRightTable(selectedRequest);
        });
    });
}

function populateRightTable(selectedRequest) {
    if (!selectedRequest) return;

    const detailsDiv = document.getElementById('processing-details');
    detailsDiv.querySelector('h2').textContent = selectedRequest.name;
    detailsDiv.querySelector('.details-header span').textContent = `ID: ${selectedRequest.requestID}`;

    const tbody = detailsDiv.querySelector('.produce-table tbody');
    tbody.innerHTML = '';

    selectedRequest.produce.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.process}</td>
            <td><button class="details-btn" data-produce-id="${item.id}">→</button></td>
        `;
        tbody.appendChild(row);
    });

    tbody.querySelectorAll('.details-btn').forEach(button => {
        button.addEventListener('click', () => {
            const produceId = button.getAttribute('data-produce-id');
            showModal(selectedRequest, produceId);
        });
    });
}
