document.addEventListener("DOMContentLoaded", async () => {
    console.log('Calendar initialization started');
    const calendarElement = document.getElementById("calendar");
    const monthYearElement = document.getElementById("monthYear");
    let currentDate = new Date();
    let orders = [];

    async function fetchOrders() {
        try {
            console.log('Fetching orders...');
            const response = await fetch('/sales/api/orders');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Raw API response:', data);

            if (!Array.isArray(data)) {
                throw new Error('Expected array of orders, got:', typeof data);
            }

            orders = data.map(order => {
                const formattedDate = new Date(order.deliveryDate);
                console.log('Processing order:', order.OrderID, 'date:', formattedDate);
                
                return {
                    OrderID: order.OrderID,
                    task: `Order #${order.OrderID}`,
                    details: order.items.map(item => 
                        `${item.name} (${item.quantity}kg)`
                    ).join(', '),
                    date: formattedDate.toISOString().split('T')[0],
                    status: order.status,
                    customer: order.customer?.name || 'Unknown Customer',
                    restaurant: order.restaurant || 'Unknown Restaurant',
                    customizations: order.customizations,
                    deliveryTimeRange: order.deliveryTimeRange,
                    deliveryAddress: order.deliveryAddress,
                    totalAmount: order.totalAmount
                };
            });

            console.log('Processed orders:', orders);
            
            // Update both views
            renderCalendar(currentDate);
            updateTasklist(currentDate.getMonth(), currentDate.getFullYear());
            
        } catch (error) {
            console.error('Error fetching orders:', error);
            orders = [];
            
            // Show error state in UI
            document.getElementById('taskListBody').innerHTML = `
                <tr>
                    <td colspan="4" class="error-state">
                        Failed to load orders. Please try refreshing the page.
                    </td>
                </tr>
            `;
        }
    }

    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const today = new Date();

        calendarElement.innerHTML = "";
        
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
        
        const startDay = firstDayOfMonth.getDay();
        const totalDays = lastDayOfMonth.getDate();
        
        monthYearElement.textContent = `${firstDayOfMonth.toLocaleString('default', { month: 'long' })} ${year}`;

        // Previous month days
        for (let i = startDay - 1; i >= 0; i--) {
            const day = document.createElement("div");
            day.classList.add("calendar-day", "prev-month");
            day.textContent = lastDayOfPrevMonth - i;
            calendarElement.appendChild(day);
        }

        // Current month days
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement("div");
            dayElement.classList.add("calendar-day");
            dayElement.textContent = day;

            if (today.getDate() === day && today.getMonth() === month && today.getFullYear() === year) {
                dayElement.classList.add("current-day");
            }

            // Format date string to match order date format
            const orderDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Debug log
            console.log('Checking date:', orderDate);
            
            const dayOrders = orders.filter(order => {
                console.log('Order date:', order.date, 'Comparing with:', orderDate);
                return order.date === orderDate;
            });

            // Update the calendar task display section
            if (dayOrders.length > 0) {
                dayOrders.forEach(order => {
                    const orderDetail = document.createElement("div");
                    // Separate base class from status class
                    orderDetail.classList.add("task-details");
                    
                    // Add status class only if valid status exists
                    if (order.status) {
                        const statusClass = order.status.toLowerCase().replace(/\s+/g, '-');
                        orderDetail.classList.add(`status-${statusClass}`);
                        console.log('Adding status class:', statusClass); // Debug log
                    }

                    orderDetail.innerHTML = `
                        <div class="task-content">
                            <span class="restaurant">${order.restaurant}</span>
                            <span class="time">${order.deliveryTimeRange}</span>
                        </div>
                    `;
                    
                    orderDetail.addEventListener("click", () => openOverlay(order));
                    dayElement.appendChild(orderDetail);
                });
            }

            calendarElement.appendChild(dayElement);
        }

        // Next month days
        const totalDaysInCalendar = Math.ceil((startDay + totalDays) / 7) * 7;
        const nextMonthDays = totalDaysInCalendar - (startDay + totalDays);
        for (let i = 1; i <= nextMonthDays; i++) {
            const day = document.createElement("div");
            day.classList.add("calendar-day", "next-month");
            day.textContent = i;
            calendarElement.appendChild(day);
        }
    }

    function changeMonth(step) {
        currentDate.setMonth(currentDate.getMonth() + step);
        renderCalendar(currentDate);
    }

    document.getElementById("prevMonth").addEventListener("click", () => {
        changeMonth(-1);
        updateTasklist(currentDate.getMonth(), currentDate.getFullYear());
    });

    document.getElementById("nextMonth").addEventListener("click", () => {
        changeMonth(1);
        updateTasklist(currentDate.getMonth(), currentDate.getFullYear());
    });

    // Add this helper function
    function validateDate(dateString) {
        const date = new Date(dateString);
        console.log('Validating date:', dateString, 'parsed as:', date);
        return !isNaN(date.getTime());
    }

    // Modify updateTasklist to include debug logging
    function updateTasklist(currentMonth, currentYear) {
        console.log('Updating tasklist for:', currentMonth, currentYear);
        console.log('Available orders:', orders.length);

        const tbody = document.getElementById('taskListBody');
        
        // Filter orders for current month
        const filteredOrders = orders.filter(order => {
            const orderDate = new Date(order.date);
            if (!validateDate(order.date)) {
                console.error('Invalid date for order:', order);
                return false;
            }
            return orderDate.getMonth() === currentMonth && 
                   orderDate.getFullYear() === currentYear;
        });

        console.log('Filtered orders for current month:', filteredOrders.length);
        // ... rest of updateTasklist code
        console.log('Filtered orders:', filteredOrders); // Debug log

        // Clear existing rows
        tbody.innerHTML = '';

        if (filteredOrders.length === 0) {
            const emptyRow = `
                <tr>
                    <td colspan="4" class="empty-state">
                        No deliveries scheduled for ${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })}
                    </td>
                </tr>
            `;
            tbody.innerHTML = emptyRow;
            return;
        }

        // Create table rows
        const tableContent = filteredOrders.map(order => {
            const orderDate = new Date(order.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            const statusClass = order.status.toLowerCase().replace(/\s+/g, '-');
            
            return `
                <tr class="task-row" data-order-id="${order.OrderID}">
                    <td class="task-cell">
                        <div class="task-title">${order.task}</div>
                        <div class="task-restaurant">${order.restaurant}</div>
                    </td>
                    <td class="details-cell">
                        ${order.details.substring(0, 50)}${order.details.length > 50 ? '...' : ''}
                    </td>
                    <td class="date-cell">${orderDate}</td>
                    <td class="status-cell">
                        <span class="status-badge ${statusClass}">${order.status}</span>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = tableContent;

        // Add click handlers
        document.querySelectorAll('.task-row').forEach(row => {
            row.addEventListener('click', () => {
                const orderId = row.dataset.orderId;
                const order = filteredOrders.find(o => o.OrderID === parseInt(orderId));
                if (order) openOverlay(order);
            });
        });
    }

    // Initialize
    await fetchOrders();
    console.log('Initial orders loaded:', orders);
    renderCalendar(currentDate);

    // Overlay functions remain the same
    function openOverlay(order) {
        document.getElementById("overlayTitle").textContent = order.task;
        
        // Format date nicely
        const dateObj = new Date(order.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Create status with color coding
        const statusClass = order.status.toLowerCase().replace(/\s+/g, '-');
        const statusHTML = `<span class="status-badge ${statusClass}">${order.status}</span>`;

        // Create structured description
        const description = `
            <div id="overlayDescription">
                <div class="overlay-section">
                    <div class="order-header">
                        <div class="order-date">${formattedDate}</div>
                        ${statusHTML}
                    </div>

                    <div class="customer-details">
                        <h3>Customer Information</h3>
                        <p><strong>Restaurant:</strong> ${order.restaurant}</p>
                        <p><strong>Contact Person:</strong> ${order.customer}</p>
                    </div>
                </div>

                <div class="overlay-section">
                    <div class="order-details">
                        <h3>Order Information</h3>
                        <p><strong>Items:</strong></p>
                        <ul>
                            ${order.details.split(',').map(item => `<li>${item.trim()}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <div class="overlay-section">
                    <div class="delivery-details">
                        <h3>Delivery Information</h3>
                        <p><strong>Address:</strong> ${order.deliveryAddress}</p>
                        <p><strong>Time Range:</strong> ${order.deliveryTimeRange}</p>
                    </div>
                </div>

                <div class="overlay-section">
                    <div class="special-instructions">
                        <h3>Special Instructions</h3>
                        <p>${order.customizations || 'No Remarks'}</p>
                    </div>
                </div>
            </div>

        `;

        document.getElementById("overlayDescription").innerHTML = description;
        document.getElementById("overlayDate").style.display = 'none'; // Hide separate date element
        document.getElementById("overlayStatus").style.display = 'none'; // Hide separate status element
        document.getElementById("overlay").style.display = "block";
    }

    // Add close handlers after openOverlay function
    function closeOverlay() {
        const overlay = document.getElementById("overlay");
        overlay.classList.add('fade-out');
        
        setTimeout(() => {
            overlay.style.display = "none";
            overlay.classList.remove('fade-out');
            // Clear content
            document.getElementById("overlayTitle").textContent = '';
            document.getElementById("overlayDescription").innerHTML = '';
        }, 200);
    }

    // Add event listeners after initialization
    document.getElementById("closeOverlay").addEventListener("click", closeOverlay);

    // Close on background click
    document.getElementById("overlay").addEventListener("click", (event) => {
        if (event.target === event.currentTarget) {
            closeOverlay();
        }
    });

    // Close on escape key
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && document.getElementById("overlay").style.display === "block") {
            closeOverlay();
        }
    });
});