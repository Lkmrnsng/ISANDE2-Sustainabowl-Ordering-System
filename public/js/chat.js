document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const elements = {
        chatMessages: document.getElementById('chatMessages'),
        messageInput: document.getElementById('messageInput'),
        sendButton: document.getElementById('sendMessage'),
        requestItems: document.querySelectorAll('.request-item'),
        orderSelect: document.getElementById('orderDateSelect'),
        requestStatus: document.getElementById('requestStatus'),
        saveCurrentOrder: document.getElementById('saveCurrentOrder'),
        saveAllOrders: document.getElementById('saveAllOrders'),
        itemsList: document.querySelector('.items-list'),
        requestStatus: document.getElementById('requestStatus')
    };

    // State management
    const state = {
        activeRequestId: null,
        activeOrderId: null,
        isRefreshing: false,
        refreshTimeout: null,
        messageQueue: [],
        requestsData: new Map(), // Store request data
        originalOrderData: null,
        hasUnsavedChanges: false
    };

    // Initialize requestsData from server-rendered data
    elements.requestItems.forEach(requestEl => {
        const requestId = requestEl.dataset.requestId;
        const requestData = window[`request_${requestId}`];
        if (requestData) {
            state.requestsData.set(requestId, requestData);
        }
    });

    // Initialize the first request
    if (elements.requestItems[0]) {
        const firstRequest = elements.requestItems[0];
        state.activeRequestId = firstRequest.dataset.requestId;
        firstRequest.classList.add('active');
        loadRequestData(state.activeRequestId);
    }

        // Add new function to handle request status changes
        async function handleRequestStatusChange(e) {
            if (!state.activeRequestId) return;
    
            const newStatus = e.target.value;
            const oldStatus = e.target.dataset.previousValue;
    
            try {
                const response = await fetch(`/chat/api/request/${state.activeRequestId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                });
    
                if (!response.ok) {
                    throw new Error('Failed to update status');
                }
    
                const data = await response.json();
                
                // Update the status in the UI
                document.querySelectorAll('.request-item').forEach(item => {
                    if (item.dataset.requestId === state.activeRequestId) {
                        item.querySelector('.request-details span:last-child').textContent = `Status: ${newStatus}`;
                    }
                });
    
                // Store the new value as previous
                e.target.dataset.previousValue = newStatus;
    
                // Show success message
                showSuccess('Request status updated successfully');
    
                // If status changed to Approved, refresh the orders list
                if (newStatus === 'Approved') {
                    loadRequestData(state.activeRequestId);
                }
    
            } catch (error) {
                console.error('Error updating request status:', error);
                // Revert to previous value
                e.target.value = oldStatus;
                showError('Failed to update request status');
            }
        }

            // Add function to handle item quantity changes
            function handleItemQuantityChange(e) {
                const input = e.target;
                const newQuantity = parseInt(input.value);
                const itemRow = input.closest('.item');
                
                // Validate input
                if (isNaN(newQuantity) || newQuantity < 0) {
                    input.value = input.dataset.previousValue;
                    return;
                }
            
                // Get price and update subtotal
                const priceElement = itemRow.querySelector('.item-price-detail');
                const subtotalElement = itemRow.querySelector('.item-subtotal');
                const price = parseFloat(priceElement.dataset.price);
                const subtotal = price * newQuantity;
            
                // Update subtotal display
                subtotalElement.textContent = `₱${subtotal.toFixed(2)}`;
            
                // Update total
                updateTotalAmount();
            
                // Mark changes as unsaved
                state.hasUnsavedChanges = true;
            }

            function updateTotalAmount() {
                const items = document.querySelectorAll('.item');
                let total = 0;
            
                items.forEach(item => {
                    const quantity = parseInt(item.querySelector('.quantity-input').value);
                    const price = parseFloat(item.querySelector('.item-price-detail').dataset.price);
                    total += quantity * price;
                });
            
                const totalElement = document.querySelector('.total-amount');
                if (totalElement) {
                    totalElement.textContent = `₱${total.toFixed(2)}`;
                }
            }
            
            function showConfirmationModal(message, onConfirm) {
                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">Confirm Action</div>
                        <div class="modal-body">${message}</div>
                        <div class="modal-actions">
                            <button class="modal-button modal-button-cancel">Cancel</button>
                            <button class="modal-button modal-button-confirm">Confirm</button>
                        </div>
                    </div>
                `;
            
                document.body.appendChild(modal);
            
                const confirmBtn = modal.querySelector('.modal-button-confirm');
                const cancelBtn = modal.querySelector('.modal-button-cancel');
            
                confirmBtn.addEventListener('click', () => {
                    onConfirm();
                    modal.remove();
                });
            
                cancelBtn.addEventListener('click', () => {
                    modal.remove();
                });
            }

    // Add function to update order total
    function updateOrderTotal() {
        const items = document.querySelectorAll('.item');
        let total = 0;

        items.forEach(item => {
            const subtotal = parseFloat(item.querySelector('.item-subtotal').textContent.replace('₱', ''));
            total += subtotal;
        });

        document.querySelector('.total-amount').textContent = `₱${total.toFixed(2)}`;
    }

    // Add function to save current order
    async function saveCurrentOrder() {
        if (!state.activeRequestId || !state.activeOrderId) {
            showError('No active order selected');
            return;
        }
    
        const orderData = collectOrderData();
        try {
            const response = await fetch(`/chat/api/order/${state.activeOrderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
    
            if (!response.ok) throw new Error('Failed to update order');
    
            state.hasUnsavedChanges = false;
            showSuccess('Order updated successfully');
        } catch (error) {
            console.error('Error saving order:', error);
            showError('Failed to save order changes');
        }
    }
    
    async function saveAllOrders() {
        if (!state.activeRequestId) {
            showError('No active request selected');
            return;
        }
    
        showConfirmationModal(
            'This will apply the current changes to all orders in this request. Are you sure you want to continue?',
            async () => {
                const orderData = collectOrderData();
                try {
                    const response = await fetch(`/chat/api/request/${state.activeRequestId}/orders`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(orderData)
                    });
    
                    if (!response.ok) throw new Error('Failed to update orders');
    
                    state.hasUnsavedChanges = false;
                    showSuccess('All orders updated successfully');
                } catch (error) {
                    console.error('Error saving orders:', error);
                    showError('Failed to save changes to all orders');
                }
            }
        );
    }

    // Helper function to collect order data
    function collectOrderData() {
        const items = [];
        document.querySelectorAll('.item').forEach(item => {
            items.push({
                itemID: parseInt(item.dataset.itemId),
                quantity: parseInt(item.querySelector('.quantity-input').value),
                itemPrice: parseFloat(item.querySelector('.item-price-detail').dataset.price)
            });
        });

        return {
            deliveryDate: document.getElementById('deliveryDate').value,
            deliveryTimeRange: document.getElementById('timeRange').value,
            status: document.getElementById('orderStatus').value,
            deliveryAddress: document.getElementById('deliveryAddress').value,
            customizations: document.getElementById('customizations').value,
            items: items
        };
    }

    async function loadRequestData(requestId) {
        try {
            // Get request data from state
            const request = state.requestsData.get(requestId);
            if (!request) {
                throw new Error('Request data not found');
            }

            // Update messages
            updateChatMessages(request.messages);
            
            // Update order select if it exists
            if (elements.orderSelect) {
                updateOrderSelect(request.orders);
                if (request.orders && request.orders.length > 0) {
                    state.activeOrderId = request.orders[0].OrderID;
                    updateOrderDisplay(request.orders[0]);
                }
            }

            scrollToBottom();
        } catch (error) {
            showError('Failed to load request data');
            console.error('Error loading request data:', error);
        }
    }

    async function refreshMessages(requestId) {
        if (!requestId || state.isRefreshing) return;

        try {
            state.isRefreshing = true;
            const response = await fetch(`/chat/api/chat/${requestId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }
            
            const data = await response.json();
            if (data.messages) {
                updateChatMessages(data.messages);
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error refreshing messages:', error);
            showError('Failed to refresh messages');
        } finally {
            state.isRefreshing = false;
        }
    }

    function debouncedRefresh(requestId) {
        if (state.refreshTimeout) {
            clearTimeout(state.refreshTimeout);
        }
        state.refreshTimeout = setTimeout(() => refreshMessages(requestId), 1000);
    }

    function updateChatMessages(messages) {
        if (!elements.chatMessages) return;
        
        elements.chatMessages.innerHTML = messages.map(msg => createMessageHTML(msg)).join('');
    
    }

    function updateOrderSelect(orders) {
        if (!elements.orderSelect) return;
    
        elements.orderSelect.innerHTML = orders.map(order => {
            const deliveryDate = new Date(order.deliveryDate).toLocaleDateString();
            return `
                <option value="${order.OrderID}">
                    Order #${order.OrderID} - Delivery: ${deliveryDate}
                </option>
            `;
        }).join('');
    }

    function updateOrderDisplay(order) {
        if (!order) {
            console.error('No order data provided to updateOrderDisplay');
            return;
        }
    
        const isSalesView = document.querySelector('.order-details:not(.read-only)') !== null;
        
        if (isSalesView) {
            // Update editable form fields
            const deliveryDateInput = document.getElementById('deliveryDate');
            const timeRangeSelect = document.getElementById('timeRange');
            const orderStatusSelect = document.getElementById('orderStatus');
            const deliveryAddressInput = document.getElementById('deliveryAddress');
            const customizationsInput = document.getElementById('customizations');
    
            if (deliveryDateInput && order.deliveryDate) {
                deliveryDateInput.value = order.deliveryDate.split('T')[0];
            }
            if (timeRangeSelect && order.deliveryTimeRange) {
                timeRangeSelect.value = order.deliveryTimeRange;
            }
            if (orderStatusSelect && order.status) {
                orderStatusSelect.value = order.status;
            }
            if (deliveryAddressInput) {
                deliveryAddressInput.value = order.deliveryAddress || '';
            }
            if (customizationsInput) {
                customizationsInput.value = order.customizations || '';
            }
        } else {
            // Update read-only fields
            const orderInfo = document.querySelector('.order-info');
            if (!orderInfo) return;
    
            const deliveryDateElement = orderInfo.querySelector('[data-field="deliveryDate"] .info-value');
            const timeRangeElement = orderInfo.querySelector('[data-field="timeRange"] .info-value');
            const statusBadge = orderInfo.querySelector('[data-field="status"] .status-badge');
            const addressElement = orderInfo.querySelector('[data-field="address"] .info-value');
            const customizationsElement = orderInfo.querySelector('[data-field="customizations"] .info-value');
    
            if (deliveryDateElement && order.deliveryDate) {
                deliveryDateElement.textContent = new Date(order.deliveryDate).toLocaleDateString();
            }
            if (timeRangeElement) {
                timeRangeElement.textContent = order.deliveryTimeRange || 'Not specified';
            }
            if (statusBadge) {
                statusBadge.textContent = order.status || 'Unknown';
                statusBadge.dataset.status = order.status || 'unknown';
            }
            if (addressElement) {
                addressElement.textContent = order.deliveryAddress || 'No address specified';
            }
            if (customizationsElement) {
                customizationsElement.textContent = order.customizations || 'None';
            }
        }
    
        // Update items list for both views
        const itemsList = document.querySelector('.items-list');
        if (itemsList && Array.isArray(order.items)) {
            let itemsHTML = order.items.map(item => `
                <div class="item">
                    <span class="item-name">${item.itemName || 'Unknown Item'}</span>
                    <span class="item-details">
                        <span class="item-quantity">x${item.quantity || 0}</span>
                        <span class="item-price">₱${(item.itemPrice || 0).toFixed(2)}</span>
                        <span class="item-total">₱${(item.totalPrice || 0).toFixed(2)}</span>
                    </span>
                </div>
            `).join('');
    
            // Add total amount
            itemsHTML += `
                <div class="total-line">
                    <span>Total Amount:</span>
                    <span class="total-amount">₱${(order.totalAmount || 0).toFixed(2)}</span>
                </div>
            `;
    
            itemsList.innerHTML = itemsHTML;
        }

              // Update items list with editable quantities
              if (itemsList && Array.isArray(order.items)) {
                let itemsHTML = order.items.map(item => `
                    <div class="item" data-item-id="${item.itemID}">
                        <div class="item-name">${item.itemName || 'Unknown Item'}</div>
                        <div class="item-details">
                            <div class="quantity-control">
                                <input type="number" 
                                       class="quantity-input" 
                                       value="${item.quantity}" 
                                       min="1" 
                                       data-previous-value="${item.quantity}"
                                       onchange="handleItemQuantityChange(event, ${item.itemID})">
                            </div>
                            <span class="item-price-detail" data-price="${item.itemPrice}">₱${item.itemPrice.toFixed(2)}</span>
                            <span class="item-subtotal">₱${(item.totalPrice || 0).toFixed(2)}</span>
                        </div>
                    </div>
                `).join('');
    
                itemsHTML += `
                    <div class="total-line">
                        <span>Total Amount:</span>
                        <span class="total-amount">₱${(order.totalAmount || 0).toFixed(2)}</span>
                    </div>
                `;
    
                itemsList.innerHTML = itemsHTML;
            }
    }
    
    
    
    function handleRequestClick(e) {
        e.preventDefault();
        const requestId = this.dataset.requestId;
        
        // Update active state
        elements.requestItems.forEach(req => req.classList.remove('active'));
        this.classList.add('active');
        
        // Update state
        state.activeRequestId = requestId;
    
        // Get request data
        const requestData = state.requestsData.get(requestId);
        
        // Update the header with the new active request
        const chatHeader = document.querySelector('.chat-header');
        if (requestData) {
            chatHeader.innerHTML = `
                <div class="customer-info">
                    <h3>Chat with ${requestData.customerName}</h3>
                    <div class="request-info">
                        <span>Request #${requestData.requestID}</span>
                        <div class="status-control">
                            <label for="requestStatus">Request Status:</label>
                            <select id="requestStatus" class="request-status-select">
                                <option value="Received" ${requestData.status === 'Received' ? 'selected' : ''}>Received</option>
                                <option value="Negotiation" ${requestData.status === 'Negotiation' ? 'selected' : ''}>Negotiation</option>
                                <option value="Approved" ${requestData.status === 'Approved' ? 'selected' : ''}>Approved</option>
                                <option value="Cancelled" ${requestData.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
    
            // Reattach event listener for the new status select
            const newStatusSelect = document.getElementById('requestStatus');
            if (newStatusSelect) {
                newStatusSelect.addEventListener('change', handleRequestStatusChange);
                newStatusSelect.dataset.previousValue = newStatusSelect.value;
            }
        }
        
        // Load request data
        loadRequestData(requestId);
    }

    // Message event handlers
    function handleMessageKeypress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    async function sendMessage() {
        if (!state.activeRequestId) {
            showError('Please select a request first');
            return;
        }

        const messageText = elements.messageInput.value.trim();
        if (!messageText) return;

        try {
            elements.sendButton.disabled = true;
            const response = await fetch('/chat/api/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requestID: state.activeRequestId,
                    message: messageText
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            // Clear input and refresh messages
            elements.messageInput.value = '';
            await refreshMessages(state.activeRequestId);
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            showError('Failed to send message. Please try again.');
        } finally {
            elements.sendButton.disabled = false;
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        elements.requestItems.forEach(item => {
            item.addEventListener('click', handleRequestClick);
        });

        if (elements.messageInput) {
            elements.messageInput.addEventListener('keypress', handleMessageKeypress);
        }

        if (elements.sendButton) {
            elements.sendButton.addEventListener('click', sendMessage);
        }

        if (elements.orderSelect) {
            elements.orderSelect.addEventListener('change', handleOrderSelect);
        }

        if (elements.requestStatus) {
            elements.requestStatus.addEventListener('change', handleRequestStatusChange);
            // Store initial value
            elements.requestStatus.dataset.previousValue = elements.requestStatus.value;
        }
        // Add quantity change listeners
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', handleItemQuantityChange);
            input.addEventListener('input', handleItemQuantityChange); // For real-time updates
            input.dataset.previousValue = input.value;
        });

        // Update save buttons
        if (elements.saveCurrentOrder) {
            elements.saveCurrentOrder.addEventListener('click', saveCurrentOrder);
        }

        if (elements.saveAllOrders) {
            elements.saveAllOrders.addEventListener('click', saveAllOrders);
        }




        // Cleanup on page unload
        window.addEventListener('beforeunload', cleanup);
    }


    async function handleOrderSelect(e) {
        const orderId = e.target.value;
        if (!orderId) return;
        
        try {
            const response = await fetch(`/chat/api/order/${orderId}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch order details');
            }
            
            const orderData = await response.json();
            
            if (!orderData) {
                throw new Error('No order data received');
            }
            
            state.activeOrderId = orderId;
    
            // Process items with prices before updating display
            const processedOrder = {
                ...orderData,
                items: orderData.items.map(item => ({
                    ...item,
                    totalPrice: (item.itemPrice || 0) * (item.quantity || 0)
                })),
                // Calculate total amount
                totalAmount: orderData.items.reduce((sum, item) => 
                    sum + ((item.itemPrice || 0) * (item.quantity || 0)), 0)
            };
    
            updateOrderDisplay(processedOrder);
        } catch (error) {
            console.error('Error fetching order details:', error);
            showError(error.message || 'Failed to load order details');
            
            if (state.activeOrderId && elements.orderSelect) {
                elements.orderSelect.value = state.activeOrderId;
            }
        }
    }

    function createMessageHTML(message) {
        // Convert IDs to strings for reliable comparison
        const isCurrentUser = String(message.senderID) === String(window.userId);
        const date = new Date(message.date).toLocaleString();
        const isSalesView = document.querySelector('.sales-view') !== null;
        
        // Determine wrapper class (controls alignment)
        const messageWrapperClass = isCurrentUser ? 'current-user' : 'other-user';
        
        // Determine message type class (controls styling)
        const messageTypeClass = isSalesView 
            ? (isCurrentUser ? 'sales-message' : 'customer-message')
            : (isCurrentUser ? 'customer-message' : 'sales-message');
        
        return `
            <div class="message-wrapper ${messageWrapperClass}">
                <div class="message ${messageTypeClass}">
                    <div class="message-content">${escapeHtml(message.message)}</div>
                    <div class="message-time">${date}</div>
                </div>
            </div>
        `;
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function scrollToBottom() {
        if (elements.chatMessages) {
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }
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

    const style = document.createElement('style');
    style.textContent = `
        .success-message {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #d4edda;
            color: #155724;
            padding: 12px 24px;
            border-radius: 4px;
            z-index: 1000;
            animation: fadeInOut 3s ease-in-out;
        }

        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
        }
    `;
    document.head.appendChild(style);


    function cleanup() {
        if (state.refreshTimeout) {
            clearTimeout(state.refreshTimeout);
        }
    }

    function setupAutoRefresh() {
        // Refresh messages every 10 seconds if there's an active request
        setInterval(() => {
            if (state.activeRequestId) {
                refreshMessages(state.activeRequestId);
            }
        }, 10000);
    }

    function setupEditEventListeners() {
        if (elements.requestStatus) {
            elements.requestStatus.addEventListener('change', handleRequestStatusChange);
        }

        if (elements.saveCurrentOrder) {
            elements.saveCurrentOrder.addEventListener('click', saveCurrentOrder);
        }

        if (elements.saveAllOrders) {
            elements.saveAllOrders.addEventListener('click', saveAllOrders);
        }

        // Add warning when leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (state.hasUnsavedChanges) {
                e.preventDefault();
                return e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    }

    // Start the application
    setupEventListeners();
    setupAutoRefresh();
    setupEditEventListeners();
});