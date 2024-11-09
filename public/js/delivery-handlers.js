const deliveryHandlers = {
    bookDelivery: async (requestId) => {
        // Show the popup modal
        const modal = document.getElementById('delivery-service-modal');
        modal.style.display = 'block';

        // Handle form submission
        document.getElementById('book-delivery-form').onsubmit = async (e) => {
            e.preventDefault();
            
            const formData = {
                pickupLocation: document.getElementById('pickup-location').value,
                dropOffLocation: document.getElementById('drop-off-location').value,
                totalWeight: document.getElementById('total-weight').value
            };

            try {
                const response = await fetch(`/api/deliveries/${requestId}/book`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    modal.style.display = 'none';
                    // Refresh the delivery tasks table
                    location.reload();
                }
            } catch (error) {
                console.error('Error booking delivery:', error);
            }
        };
    },

    completeDelivery: async (requestId) => {
        try {
            const response = await fetch(`/api/deliveries/${requestId}/complete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Refresh the delivery tasks table
                location.reload();
            }
        } catch (error) {
            console.error('Error completing delivery:', error);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.getElementById('delivery-service-modal');
            modal.style.display = 'none';
        });
    });
});