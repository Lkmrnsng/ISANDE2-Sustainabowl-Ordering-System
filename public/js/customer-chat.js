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
  
  // Set initial header
  const requestData = state.requestsData.get(state.activeRequestId);
  if (requestData) {
      const chatHeader = document.querySelector('.chat-header');
      chatHeader.innerHTML = `
          <h3>Chat with Sales Representative</h3>
          <div class="request-info">
              <span>Request #${requestData.requestID}</span>
              <span>Status: ${requestData.status}</span>
          </div>
      `;
  }
  
  loadRequestData(state.activeRequestId);
}

  async function loadRequestData(requestId) {
      try {
          const request = state.requestsData.get(requestId);
          if (!request) {
              throw new Error('Request data not found');
          }

          updateChatMessages(request.messages);
          
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

      // Update read-only fields
      const orderInfo = document.querySelector('.order-info');
      if (!orderInfo) return;

      // Update delivery date
      const deliveryDateElement = orderInfo.querySelector('[data-field="deliveryDate"] .info-value');
      if (deliveryDateElement && order.deliveryDate) {
          deliveryDateElement.textContent = new Date(order.deliveryDate).toLocaleDateString();
      }

      // Update time range
      const timeRangeElement = orderInfo.querySelector('[data-field="timeRange"] .info-value');
      if (timeRangeElement) {
          timeRangeElement.textContent = order.deliveryTimeRange || 'Not specified';
      }

      // Update status
      const statusBadge = orderInfo.querySelector('[data-field="status"] .status-badge');
      if (statusBadge) {
          statusBadge.textContent = order.status || 'Unknown';
          statusBadge.dataset.status = order.status || 'unknown';
      }

      // Update address
      const addressElement = orderInfo.querySelector('[data-field="address"] .info-value');
      if (addressElement) {
          addressElement.textContent = order.deliveryAddress || 'No address specified';
      }

      // Update customizations
      const customizationsElement = orderInfo.querySelector('[data-field="customizations"] .info-value');
      if (customizationsElement) {
          customizationsElement.textContent = order.customizations || 'None';
      }

      // Update items list
      const itemsList = document.querySelector('.items-list');
      if (itemsList && Array.isArray(order.items)) {
          let itemsHTML = order.items.map(item => `
              <div class="item">
                  <span class="item-name">${item.itemName || 'Unknown Item'}</span>
                  <span class="item-details">
                      <span class="item-quantity">x${item.quantity || 0} kg</span>
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
  }

  function handleRequestClick(e) {
    e.preventDefault();
    const requestId = this.dataset.requestId;
    
    // Update active state
    elements.requestItems.forEach(req => req.classList.remove('active'));
    this.classList.add('active');
    
    // Update header
    const requestData = state.requestsData.get(requestId);
    const chatHeader = document.querySelector('.chat-header');
    if (requestData) {
        chatHeader.innerHTML = `
            <h3>Chat with Sales Representative</h3>
            <div class="request-info">
                <span>Request #${requestData.requestID}</span>
                <span>Status: ${requestData.status}</span>
            </div>
        `;
    }
    
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
  
          const processedOrder = {
              ...orderData,
              items: orderData.items.map(item => ({
                  ...item,
                  totalPrice: (item.itemPrice || 0) * (item.quantity || 0)
              })),
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
      const isCurrentUser = String(message.senderID) === String(window.userId);
      const date = new Date(message.date).toLocaleString();
      const messageWrapperClass = isCurrentUser ? 'current-user' : 'other-user';
      const messageTypeClass = isCurrentUser ? 'customer-message' : 'sales-message';
      
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

  // Add notification styles
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
          
      .error-message {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #f8d7da;
          color: #721c24;
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

      window.addEventListener('beforeunload', cleanup);
  }

  function setupAutoRefresh() {
      setInterval(() => {
          if (state.activeRequestId) {
              refreshMessages(state.activeRequestId);
          }
      }, 10000);
  }

  function enforceReadOnly() {
      // Make sure all form fields in order details are read-only
      document.querySelectorAll('.order-details input, .order-details textarea')
          .forEach(element => {
              element.readOnly = true;
              element.disabled = true;
          });

      // Remove any edit buttons or controls
      document.querySelectorAll('.edit-controls, .save-controls, .quantity-control button')
          .forEach(element => element.remove());
  }

  // Initialize the application
  setupEventListeners();
  setupAutoRefresh();
  enforceReadOnly();
});