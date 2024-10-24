document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Initialize variables
    let activeRequestId = null;
    let activeOrderId = null;
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const requestsData = new Map(); // Store all request data
    
    // Initialize the first request as active if it exists
    const firstRequest = document.querySelector('.request-item');
    if (firstRequest) {
        activeRequestId = firstRequest.dataset.requestId;
        firstRequest.classList.add('active');
        // Load the first request's data into the view
        loadRequestData(activeRequestId);
        
    }

    // Event Listeners
    document.querySelectorAll('.request-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const requestId = this.dataset.requestId;
            activeRequestId = requestId;
            
            // Update active state visually
            document.querySelectorAll('.request-item').forEach(req => {
                req.classList.remove('active');
            });
            this.classList.add('active');
            
            // Load this request's data into the view
            loadRequestData(requestId);
        });
    });

// Modify the orderDateSelect event listener
if (document.getElementById('orderDateSelect')) {
    document.getElementById('orderDateSelect').addEventListener('change', async function() {
        const orderId = this.value;
        if (!orderId) return;
        
        try {
            const response = await fetch(`/chat/api/order/${orderId}`);
            if (!response.ok) throw new Error('Failed to fetch order details');
            
            const orderData = await response.json();
            updateOrderDisplay(orderData);
        } catch (error) {
            console.error('Error fetching order details:', error);
            showError('Failed to load order details. Please try again.');
        }
    });
}

    // Message input handlers
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    document.getElementById('sendMessage').addEventListener('click', sendMessage);
    
    if (document.getElementById('saveCurrentOrder')) {
        document.getElementById('saveCurrentOrder').addEventListener('click', () => saveOrder(false));
        document.getElementById('saveAllOrders').addEventListener('click', () => saveOrder(true));
    }

    // Auto-refresh messages periodically
    setInterval(() => {
        if (activeRequestId) {
            refreshMessages(activeRequestId);
        }
    }, 10000);

    // Functions
    async function refreshMessages(requestId) {
        try {
            const response = await fetch(`/chat/api/chat/${requestId}`);
            if (!response.ok) throw new Error(`Failed to refresh messages: ${response.statusText}`);
            
            const data = await response.json();
            updateChatMessages(data.messages);
        } catch (error) {
            console.error('Error refreshing messages:', error);
        }
    }

    async function loadRequestData(requestId) {
        try {
            // Get request data
            const request = requestsData.get(requestId);
            if (!request) return;

            // Update messages
            updateChatMessages(request.messages);
            
            // Update order select if it exists
            if (document.getElementById('orderDateSelect')) {
                updateOrderSelect(request.orders);
                if (request.orders && request.orders.length > 0) {
                    activeOrderId = request.orders[0].OrderID;
                    updateOrderDisplay(request.orders[0]);
                }
            }

            scrollToBottom();
        } catch (error) {
            console.error('Error loading request data:', error);
            showError('Failed to load request data. Please try again.');
        }
    }

    function updateChatMessages(messages) {
        chatMessages.innerHTML = messages.map(msg => createMessageHTML(msg)).join('');
    }

    function updateOrderSelect(orders) {
        const orderSelect = document.getElementById('orderDateSelect');
        if (!orderSelect) return;

        orderSelect.innerHTML = orders.map(order => `
            <option value="${order.OrderID}">
                ${new Date(order.deliveryDate).toLocaleDateString()}
            </option>
        `).join('');
    }

    function updateOrderDisplay(order) {
        const isSalesView = document.querySelector('.order-details:not(.read-only)') !== null;
        
        if (isSalesView) {
            // Update editable form fields
            document.getElementById('deliveryDate').value = order.deliveryDate.split('T')[0];
            document.getElementById('timeRange').value = order.deliveryTimeRange;
            document.getElementById('orderStatus').value = order.status;
            document.getElementById('deliveryAddress').value = order.deliveryAddress;
            document.getElementById('customizations').value = order.customizations;
        } else {
            // Update read-only fields
            const orderInfo = document.querySelector('.order-info');
            orderInfo.querySelector('[data-field="deliveryDate"] .info-value').textContent = 
                new Date(order.deliveryDate).toLocaleDateString();
            orderInfo.querySelector('[data-field="timeRange"] .info-value').textContent = 
                order.deliveryTimeRange;
            
            const statusBadge = orderInfo.querySelector('[data-field="status"] .status-badge');
            statusBadge.textContent = order.status;
            statusBadge.dataset.status = order.status;
            
            orderInfo.querySelector('[data-field="address"] .info-value').textContent = 
                order.deliveryAddress;
            orderInfo.querySelector('[data-field="customizations"] .info-value').textContent = 
                order.customizations;
        }

        // Update items list for both views
        const itemsList = document.querySelector('.items-list');
        itemsList.innerHTML = order.items.map(item => `
            <div class="item">
                <span class="item-name">${item.itemName}</span>
                <span class="item-quantity">x${item.quantity}</span>
            </div>
        `).join('');
    }

    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message || !activeRequestId) return;

        try {
            const response = await fetch('/chat/api/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requestID: activeRequestId,
                    message: message
                })
            });

            if (response.ok) {
                messageInput.value = '';
                await refreshMessages(activeRequestId);
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showError('Failed to send message. Please try again.');
        }
    }

    async function saveOrder(applyToAll) {
        if (!activeRequestId || !activeOrderId) return;

        const orderData = {
            deliveryDate: document.getElementById('deliveryDate').value,
            deliveryTimeRange: document.getElementById('timeRange').value,
            status: document.getElementById('orderStatus').value,
            deliveryAddress: document.getElementById('deliveryAddress').value,
            customizations: document.getElementById('customizations').value,
            applyToAll: applyToAll
        };

        try {
            const response = await fetch(`/chat/api/order/${activeOrderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                await refreshMessages(activeRequestId);
                showSuccess('Order updated successfully');
            }
        } catch (error) {
            console.error('Error saving order:', error);
            showError('Failed to save order. Please try again.');
        }
    }

    function createMessageHTML(message) {
        const isCurrentUser = message.senderID === window.userID;
        const date = new Date(message.date).toLocaleString();
        
        return `
            <div class="message-wrapper ${isCurrentUser ? 'current-user' : 'other-user'}">
                <div class="message ${isCurrentUser ? 'customer' : 'sales'}">
                    <div class="message-content">${escapeHtml(message.message)}</div>
                    <div class="message-time">${date}</div>
                </div>
            </div>
        `;
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.querySelector('.chat-container').appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }

    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        document.querySelector('.chat-container').appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Initialize requestsData from the server-rendered data
    const requestElements = document.querySelectorAll('.request-item');
    requestElements.forEach(requestEl => {
        const requestId = requestEl.dataset.requestId;
        const requestData = window[`request_${requestId}`]; // We'll add this to the templates
        if (requestData) {
            requestsData.set(requestId, requestData);
        }
    });
});