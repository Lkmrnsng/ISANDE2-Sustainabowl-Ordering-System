// public/js/weekly-tasks.js
class WeeklyCalendar {
    constructor() {
        this.currentDate = new Date();
        this.orders = [];
    }

    async init() {
        await this.fetchOrders();
        this.bindEvents();
        this.bindOverlayEvents(); // Add overlay event binding
        this.renderWeekView();
    }

    bindEvents() {
        document.getElementById('prevWeek').addEventListener('click', () => this.navigateWeek('prev'));
        document.getElementById('nextWeek').addEventListener('click', () => this.navigateWeek('next'));
    }

    bindOverlayEvents() {
        const closeButton = document.getElementById('orderCloseOverlay');
        const overlay = document.getElementById('orderOverlay');

        if (!closeButton || !overlay) {
            console.error('Overlay elements not found!');
            return;
        }

        // Close button click
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeOverlay();
        });

        // Click outside overlay
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                this.closeOverlay();
            }
        });

        // Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && overlay.style.display === 'block') {
                this.closeOverlay();
            }
        });
    }

    async fetchOrders() {
        try {
            const response = await fetch('/sales/api/orders');
            if (!response.ok) throw new Error('Failed to fetch orders');
            const data = await response.json();

            this.orders = data.map(order => ({
                OrderID: order.OrderID,
                task: `Order #${order.OrderID}`,
                details: order.items.map(item => 
                    `${item.name} (${item.quantity}kg)`
                ).join(', '),
                date: new Date(order.deliveryDate).toISOString().split('T')[0],
                status: order.status,
                customer: order.customer,
                restaurant: order.restaurant,
                customizations: order.customizations,
                deliveryTimeRange: order.deliveryTimeRange,
                deliveryAddress: order.deliveryAddress
            }));
        } catch (error) {
            console.error('Error fetching orders:', error);
            this.orders = [];
        }
    }

    getWeekDates() {
        const start = new Date(this.currentDate);
        start.setDate(start.getDate() - start.getDay());
        
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            dates.push(date);
        }
        return dates;
    }

    navigateWeek(direction) {
        const days = direction === 'next' ? 7 : -7;
        this.currentDate.setDate(this.currentDate.getDate() + days);
        this.renderWeekView();
    }

    renderWeekView() {
        const weekDates = this.getWeekDates();
        const headerContainer = document.getElementById('calendarHeader');
        const bodyContainer = document.getElementById('calendarBody');

        // Render header
        headerContainer.innerHTML = weekDates.map(date => `
            <div class="calendar-header-cell ${this.isToday(date) ? 'today' : ''}">
                <div class="day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="day-number">${date.getDate()}</div>
            </div>
        `).join('');

        // Render body with fixed date handling
        bodyContainer.innerHTML = weekDates.map(date => {
            // Normalize date to local timezone midnight
            const localDate = new Date(date);
            localDate.setHours(0, 0, 0, 0);
            
            // Format date string using local timezone
            const dateStr = localDate.toISOString().slice(0, 10);
            
            // Filter orders for this day
            const dayOrders = this.orders.filter(order => {
                const orderDate = new Date(order.date);
                orderDate.setHours(0, 0, 0, 0);
                return orderDate.toISOString().slice(0, 10) === dateStr;
            });

            return `
                <div class="calendar-day-column ${this.isToday(date) ? 'today' : ''}" data-date="${dateStr}">
                    ${dayOrders.map(order => `
                        <div class="task-card status-${order.status.toLowerCase()}" data-order-id="${order.OrderID}">
                            <div class="task-content">
                                <div class="order-title">${order.task}</div>
                                <div class="order-info">
                                    <span class="restaurant">${order.restaurant}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }).join('');

        // Add click handlers
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', () => {
                const orderId = card.dataset.orderId;
                const order = this.orders.find(o => o.OrderID === parseInt(orderId));
                if (order) this.openOverlay(order);
            });
        });
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    openOverlay(order) {
        console.log('Opening overlay for order:', order);
        const overlay = document.getElementById('orderOverlay');
        const title = document.getElementById('orderOverlayTitle');
        const description = document.getElementById('orderOverlayDescription');

        if (!overlay || !title || !description) {
            console.error('Overlay elements not found in openOverlay');
            return;
        }

        title.textContent = order.task;

        description.innerHTML = `
            <div class="overlay-section">
                <div class="order-header">
                    <div class="order-date">${new Date(order.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</div>
                    <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
                </div>

                <div class="customer-details">
                    <h3>Customer Information</h3>
                    <p><strong>Restaurant:</strong> ${order.restaurant}</p>
                    <p><strong>Contact Person:</strong> ${order.customer}</p>
                </div>

                <div class="order-details">
                    <h3>Order Information</h3>
                    <p><strong>Items:</strong></p>
                    <ul>${order.details.split(',').map(item => `<li>${item.trim()}</li>`).join('')}</ul>
                </div>

                <div class="delivery-details">
                    <h3>Delivery Information</h3>
                    <p><strong>Address:</strong> ${order.deliveryAddress}</p>
                    <p><strong>Time Range:</strong> ${order.deliveryTimeRange}</p>
                </div>

                <div class="special-instructions">
                    <h3>Special Instructions</h3>
                    <p>${order.customizations || 'No special instructions'}</p>
                </div>
            </div>
        `;

        overlay.style.display = 'block';
    }

    closeOverlay() {
        const overlay = document.getElementById('orderOverlay');
        const title = document.getElementById('orderOverlayTitle');
        const description = document.getElementById('orderOverlayDescription');

        if (!overlay) {
            console.error('Overlay element not found');
            return;
        }

        // Add fade out animation
        overlay.classList.add('fade-out');
        
        // Remove after animation
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.classList.remove('fade-out');
            if (title) title.textContent = '';
            if (description) description.innerHTML = '';
        }, 200);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const calendar = new WeeklyCalendar();
    calendar.init().catch(error => {
        console.error('Failed to initialize calendar:', error);
    });
});