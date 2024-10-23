
document.addEventListener('DOMContentLoaded', function() {
  // Initialize variables
  let activeRequestId = null;
  let activeOrderId = null;
  const chatMessages = document.getElementById('chatMessages');
  const messageInput = document.getElementById('messageInput');
  
  // Initialize the first request as active if it exists
  const firstRequest = document.querySelector('.request-item');
  if (firstRequest) {
      activeRequestId = firstRequest.dataset.requestId;
      loadChat(activeRequestId);
      firstRequest.classList.add('active');
  }

  // Event Listeners
  document.querySelectorAll('.request-item').forEach(item => {
      item.addEventListener('click', function(e) {
          e.preventDefault();
          const requestId = this.dataset.requestId;
          
          // Update active state visually
          document.querySelectorAll('.request-item').forEach(req => {
              req.classList.remove('active');
          });
          this.classList.add('active');
          
          loadChat(requestId);
      });
  });

  if (document.getElementById('orderDateSelect')) {
      document.getElementById('orderDateSelect').addEventListener('change', function() {
          activeOrderId = this.value;
          loadOrderDetails(activeOrderId);
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

  // Auto-refresh chat periodically
  setInterval(() => {
      if (activeRequestId) {
          loadChat(activeRequestId, true);
      }
  }, 10000); // Refresh every 10 seconds

  // Functions
  async function loadChat(requestId, isAutoRefresh = false) {
      try {
          const response = await fetch(`/api/chat/${requestId}`);
          if (!response.ok) throw new Error('Failed to load chat');
          
          const data = await response.json();
          
          // Only update if this is still the active chat
          if (activeRequestId !== requestId && isAutoRefresh) return;
          
          activeRequestId = requestId;

          // Update messages
          updateChatMessages(data.messages);
          
          // Update order details if in sales view
          if (document.getElementById('orderDateSelect')) {
              updateOrderSelect(data.orders);
              if (data.orders.length > 0) {
                  loadOrderDetails(data.orders[0].OrderID);
              }
          }

          // Scroll to bottom only if not auto-refreshing
          if (!isAutoRefresh) {
              scrollToBottom();
          }

      } catch (error) {
          console.error('Error loading chat:', error);
      }
  }

  function updateChatMessages(messages) {
      chatMessages.innerHTML = messages.map(msg => createMessageHTML(msg)).join('');
  }

  function updateOrderSelect(orders) {
      const orderSelect = document.getElementById('orderDateSelect');
      orderSelect.innerHTML = orders.map(order => `
          <option value="${order.OrderID}">
              ${new Date(order.deliveryDate).toLocaleDateString()}
          </option>
      `).join('');
  }

  function scrollToBottom() {
      chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendMessage() {
      const message = messageInput.value.trim();
      if (!message || !activeRequestId) return;

      try {
          const response = await fetch('/api/message', {
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
              await loadChat(activeRequestId);
              scrollToBottom();
          }
      } catch (error) {
          console.error('Error sending message:', error);
      }
  }

  function createMessageHTML(message) {
      const isCustomer = message.senderID === window.userID; // userID should be set in your template
      const date = new Date(message.date).toLocaleString();
      
      return `
          <div class="message ${isCustomer ? 'customer' : 'sales'}">
              <div class="message-content">${escapeHtml(message.message)}</div>
              <div class="message-time">${date}</div>
          </div>
      `;
  }

  function escapeHtml(unsafe) {
      return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
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
        const response = await fetch(`/api/order/${activeOrderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            // Refresh order details
            loadChat(activeRequestId);
        }
    } catch (error) {
        console.error('Error saving order:', error);
    }
}

async function loadOrderDetails(orderId) {
  try {
      const response = await fetch(`/api/order/${orderId}`);
      const order = await response.json();
      
      // Check if we're in sales view (editable) or customer view (read-only)
      const isSalesView = document.querySelector('.order-details:not(.read-only)') !== null;
      
      if (isSalesView) {
          // Update editable form fields (sales view)
          document.getElementById('deliveryDate').value = order.deliveryDate.split('T')[0];
          document.getElementById('timeRange').value = order.deliveryTimeRange;
          document.getElementById('orderStatus').value = order.status;
          document.getElementById('deliveryAddress').value = order.deliveryAddress;
          document.getElementById('customizations').value = order.customizations;
      } else {
          // Update read-only fields (customer view)
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

          // Update items list
          const itemsList = orderInfo.querySelector('.items-list');
          itemsList.innerHTML = order.items.map(item => `
              <div class="item">
                  <span class="item-name">${item.itemName}</span>
                  <span class="item-quantity">x${item.quantity}</span>
              </div>
          `).join('');
      }
      
      activeOrderId = orderId;
  } catch (error) {
      console.error('Error loading order details:', error);
  }
}
});