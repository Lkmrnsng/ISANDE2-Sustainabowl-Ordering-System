document.addEventListener('DOMContentLoaded', function() {
  // Cache DOM elements
  const elements = {
    table: document.querySelector('.alerts-table'),
    statusFilter: document.getElementById('statusFilter'),
    sortSelect: document.getElementById('sortBy'),
    selectAllCheckbox: document.getElementById('selectAll'),
    alertModal: document.getElementById('alertModal'),
    alertForm: document.getElementById('alertForm'),
    selectedOrdersList: document.querySelector('.selected-orders-list'),
    prevPageBtn: document.getElementById('prevPage'),
    nextPageBtn: document.getElementById('nextPage'),
    currentPageSpan: document.getElementById('currentPage'),
    totalPagesSpan: document.getElementById('totalPages'),
    sendAlertBtn: document.querySelector('.send-alert-btn'),
    cancelOrdersCheckbox: document.getElementById('cancelOrders'),
    alertTypeSelect: document.getElementById('alertType'),
    myAlertsTableBody: document.getElementById('myAlertsTableBody'),
    deleteConfirmModal: document.getElementById('deleteConfirmModal')
};

    // State management
    const state = {
        currentPage: 1,
        itemsPerPage: 10,
        filteredOrders: [],
        selectedOrders: new Set(),
        originalOrders: [], // Will store the unfiltered orders data
        alertToDelete: null // Store alert ID pending deletion
    };

  // Initialize event listeners
  function initializeEventListeners() {
    // Previous event listeners remain the same
    elements.statusFilter.addEventListener('change', handleFiltersChange);
    elements.sortSelect.addEventListener('change', handleFiltersChange);
    elements.selectAllCheckbox.addEventListener('change', handleSelectAll);
    elements.table.addEventListener('change', handleCheckboxChange);
    elements.sendAlertBtn.addEventListener('click', openModal);
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.querySelector('.cancel-btn').addEventListener('click', closeModal);
    elements.alertForm.addEventListener('submit', handleAlertSubmission);
    elements.prevPageBtn.addEventListener('click', () => changePage(-1));
    elements.nextPageBtn.addEventListener('click', () => changePage(1));
    elements.alertTypeSelect.addEventListener('change', handleAlertTypeChange);

    // Delete confirmation modal event listeners
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeDeleteModal);
    });
    elements.deleteConfirmModal.querySelector('.cancel-btn').addEventListener('click', closeDeleteModal);
    elements.deleteConfirmModal.querySelector('.delete-btn').addEventListener('click', confirmDelete);
}

    // Load my alerts
    async function loadMyAlerts() {
        try {
            const response = await fetch('/alert/my-alerts');
            if (!response.ok) throw new Error('Failed to fetch alerts');
            const data = await response.json();
            
            if (data.success) {
                displayMyAlerts(data.alerts);
            }
        } catch (error) {
            console.error('Error loading alerts:', error);
            showNotification('Failed to load alerts', 'error');
        }
    }

    // Display my alerts in table
    function displayMyAlerts(alerts) {
        if (!elements.myAlertsTableBody) return;

        const alertsHtml = alerts.map(alert => `
            <tr data-alert-id="${alert.alertID}">
                <td>${formatDate(alert.dateCreated)}</td>
                <td>
                    <span class="category-badge" data-category="${alert.category}">
                        ${alert.category}
                    </span>
                </td>
                <td>${alert.details}</td>
                <td>${alert.orders.join(', ')}</td>
                <td>
                    <button class="delete-alert-btn" onclick="initiateDelete(${alert.alertID})">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');

        elements.myAlertsTableBody.innerHTML = alertsHtml;
    }

    // Delete alert functions
    window.initiateDelete = function(alertId) {
        state.alertToDelete = alertId;
        elements.deleteConfirmModal.style.display = 'block';
    };

    function closeDeleteModal() {
        elements.deleteConfirmModal.style.display = 'none';
        state.alertToDelete = null;
    }

    async function confirmDelete() {
        if (!state.alertToDelete) return;

        try {
            const response = await fetch(`/alert/delete/${state.alertToDelete}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete alert');
            }

            const row = elements.myAlertsTableBody.querySelector(`tr[data-alert-id="${state.alertToDelete}"]`);
            if (row) {
                row.classList.add('fade-out');
                setTimeout(() => {
                    row.remove();
                }, 300);
            }

            showNotification('Alert deleted successfully', 'success');
            closeDeleteModal();
        } catch (error) {
            console.error('Error deleting alert:', error);
            showNotification('Failed to delete alert', 'error');
        }
    }


  // Handle filters change
  function handleFiltersChange() {
      state.currentPage = 1;
      filterAndDisplayOrders();
  }

  // Filter and sort orders
  function filterAndDisplayOrders() {
      const statusFilter = elements.statusFilter.value;
      const sortBy = elements.sortSelect.value;

      // Filter orders
      state.filteredOrders = state.originalOrders.filter(order => 
          statusFilter === 'all' || order.status === statusFilter
      );

      // Sort orders
      state.filteredOrders.sort((a, b) => {
          const dateA = new Date(a.deliveryDate);
          const dateB = new Date(b.deliveryDate);
          return sortBy === 'dateDesc' ? dateB - dateA : dateA - dateB;
      });

      updatePagination();
      displayOrders();
  }

  // Display orders for current page
  function displayOrders() {
      const start = (state.currentPage - 1) * state.itemsPerPage;
      const end = start + state.itemsPerPage;
      const pageOrders = state.filteredOrders.slice(start, end);

      const tbody = elements.table.querySelector('tbody');
      tbody.innerHTML = pageOrders.map(order => `
          <tr>
              <td>
                  <input type="checkbox" 
                         class="order-checkbox" 
                         value="${order.OrderID}"
                         ${state.selectedOrders.has(order.OrderID) ? 'checked' : ''}>
              </td>
              <td>${order.OrderID}</td>
              <td>${order.customerName}</td>
              <td>${formatDate(order.deliveryDate)}</td>
              <td>
                  <span class="status-badge" data-status="${order.status}">
                      ${order.status}
                  </span>
              </td>
          </tr>
      `).join('');
  }

  // Update pagination controls
  function updatePagination() {
      const totalPages = Math.ceil(state.filteredOrders.length / state.itemsPerPage);
      elements.currentPageSpan.textContent = state.currentPage;
      elements.totalPagesSpan.textContent = totalPages;

      elements.prevPageBtn.disabled = state.currentPage === 1;
      elements.nextPageBtn.disabled = state.currentPage === totalPages;
  }

  // Handle page change
  function changePage(delta) {
      const newPage = state.currentPage + delta;
      const totalPages = Math.ceil(state.filteredOrders.length / state.itemsPerPage);
      
      if (newPage >= 1 && newPage <= totalPages) {
          state.currentPage = newPage;
          displayOrders();
          updatePagination();
      }
  }

  // Handle select all checkbox
  function handleSelectAll(e) {
      const checkboxes = elements.table.querySelectorAll('.order-checkbox');
      checkboxes.forEach(checkbox => {
          checkbox.checked = e.target.checked;
          if (e.target.checked) {
              state.selectedOrders.add(checkbox.value);
          } else {
              state.selectedOrders.delete(checkbox.value);
          }
      });
  }

  // Handle individual checkbox changes
  function handleCheckboxChange(e) {
      if (!e.target.matches('.order-checkbox')) return;

      if (e.target.checked) {
          state.selectedOrders.add(e.target.value);
      } else {
          state.selectedOrders.delete(e.target.value);
          elements.selectAllCheckbox.checked = false;
      }
  }

  // Open modal
  function openModal() {
      if (state.selectedOrders.size === 0) {
          showNotification('Please select at least one order', 'error');
          return;
      }

      updateSelectedOrdersList();
      elements.alertModal.style.display = 'block';
  }

  // Close modal
  function closeModal() {
      elements.alertModal.style.display = 'none';
      elements.alertForm.reset();
  }

  // Update selected orders list in modal
  function updateSelectedOrdersList() {
      const selectedOrders = Array.from(state.selectedOrders).map(orderId => {
          const order = state.originalOrders.find(o => o.OrderID === parseInt(orderId));
          return `<div>Order #${orderId} - ${order.customerName}</div>`;
      });

      elements.selectedOrdersList.innerHTML = selectedOrders.join('');
  }

  // Handle alert type change
  function handleAlertTypeChange(e) {
      if (e.target.value === 'Cancellation') {
          elements.cancelOrdersCheckbox.checked = true;
          elements.cancelOrdersCheckbox.disabled = true;
      } else {
          elements.cancelOrdersCheckbox.checked = false;
          elements.cancelOrdersCheckbox.disabled = false;
      }
  }

// Handle alert submission
async function handleAlertSubmission(e) {
    e.preventDefault();

    try {
        const formData = {
            concernType: elements.alertTypeSelect.value,
            details: document.getElementById('alertDetails').value,
            orders: Array.from(state.selectedOrders),
            cancelOrders: elements.cancelOrdersCheckbox.checked
        };

        const response = await fetch('/alert/create-batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to send alert');
        }

        showNotification('Alert sent successfully', 'success');
        closeModal();

        // Reset selected orders
        state.selectedOrders.clear();
        elements.selectAllCheckbox.checked = false;
        document.querySelectorAll('.order-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });

        await Promise.all([
            refreshOrders(),
            loadMyAlerts()
        ]);

    } catch (error) {
        console.error('Error sending alert:', error);
        showNotification(error.message, 'error');
    }
}

  // Refresh orders data
  async function refreshOrders() {
      try {
          const response = await fetch('/alert/api/orders');
          if (!response.ok) throw new Error('Failed to fetch orders');
          
          state.originalOrders = await response.json();
          filterAndDisplayOrders();
      } catch (error) {
          console.error('Error refreshing orders:', error);
          showNotification('Failed to refresh orders', 'error');
      }
  }

  // Show notification
  function showNotification(message, type) {
      const notification = document.createElement('div');
      notification.className = `alert-message ${type}-message`;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
          notification.remove();
      }, 3000);
  }

  // Format date helper
  function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
      });
  }

  // Initialize the page
  async function initialize() {
    try {
        await Promise.all([
            refreshOrders(),
            loadMyAlerts()
        ]);
        initializeEventListeners();
    } catch (error) {
        console.error('Error initializing page:', error);
        showNotification('Failed to load data', 'error');
    }
}

    // Utility function for formatting dates
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

  // Start the application
  initialize();
});