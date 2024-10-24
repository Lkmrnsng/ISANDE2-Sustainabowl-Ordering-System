document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const elements = {
        chatMessages: document.getElementById('chatMessages'),
        messageInput: document.getElementById('messageInput'),
        sendButton: document.getElementById('sendMessage'),
        requestItems: document.querySelectorAll('.request-item'),
        orderSelect: document.getElementById('orderDateSelect')
    };

    // State management
    const state = {
        activeRequestId: null,
        activeOrderId: null,
        isRefreshing: false,
        refreshTimeout: null,
        messageQueue: [],
        requestsData: new Map() // Store request data
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
            itemsList.innerHTML = order.items.map(item => `
                <div class="item">
                    <span class="item-name">${item.itemName || 'Unknown Item'}</span>
                    <span class="item-quantity">x${item.quantity || 0}</span>
                </div>
            `).join('');
        }
    }
    
    
    
    function handleRequestClick(e) {
        e.preventDefault();
        const requestId = this.dataset.requestId;
        
        // Update active state
        elements.requestItems.forEach(req => req.classList.remove('active'));
        this.classList.add('active');
        
        // Update state and load data
        state.activeRequestId = requestId;
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

        // Cleanup on page unload
        window.addEventListener('beforeunload', cleanup);
    }


    async function handleOrderSelect(e) {
        const orderId = e.target.value;
        if (!orderId) return;
        
        try {
            // Show loading state if needed
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
            updateOrderDisplay(orderData);
        } catch (error) {
            console.error('Error fetching order details:', error);
            showError(error.message || 'Failed to load order details');
            
            // Reset select to previous value if needed
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

    // Start the application
    setupEventListeners();
    setupAutoRefresh();
});