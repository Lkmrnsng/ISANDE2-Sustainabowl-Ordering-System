document.addEventListener("DOMContentLoaded", function() {
    // Get the edit buttons, modal, and the close button elements
    const editButtons = document.querySelectorAll('.edit-icon');
    const editModal = document.getElementById('edit-modal');
    const cancelButtons = document.querySelectorAll('.cancel-btn'); // Use querySelectorAll for multiple buttons
    const confirmBtn = document.getElementById('confirm-btn');
    const quantityInput = document.getElementById('new-quantity');

    // Function to show the modal
    function openModal(currentRow) {
        const currentQuantity = currentRow.querySelector('td:nth-child(2)').innerText;
        quantityInput.value = currentQuantity;
        editModal.style.display = 'flex';
    }

    // Function to close the modal
    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Add event listeners to each edit button
    editButtons.forEach((button) => {
        button.addEventListener('click', function() {
            const currentRow = button.closest('tr');
            openModal(currentRow);
        });
    });

    // Add event listeners for cancel buttons (both modals)
    cancelButtons.forEach((button) => {
        button.addEventListener('click', function() {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });

    // Add event listener for confirm button (you can add actual saving functionality here)
    confirmBtn.addEventListener('click', function() {
        const newQuantity = quantityInput.value;
        const currentRow = document.querySelector('.inventory-table tr.selected');
        currentRow.querySelector('td:nth-child(2)').innerText = newQuantity;
        closeModal(editModal);
    });

    // Close modal if user clicks outside of the modal content
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
});
