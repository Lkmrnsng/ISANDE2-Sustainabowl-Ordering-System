document.querySelectorAll('.fa-square-minus, .fa-square-plus').forEach(button => {
    button.addEventListener('click', function(event) {
        const itemId = event.target.getAttribute('data-item-id');
        const delta = parseInt(event.target.getAttribute('data-delta'));
        changeQuantity(itemId, delta, event);
    });
});

// Add input event listeners to all quantity inputs
document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('input', function(event) {
        const itemId = this.id.replace('quantity-input-', '');
        handleQuantityInput(itemId, event);
    });
});

function handleQuantityInput(itemId, event) {
    const input = event.target;
    const stock = parseInt(input.getAttribute('data-stock'));
    let quantity = parseInt(input.value) || 1;

    // Ensure minimum value is 1
    if (quantity < 1) {
        quantity = 1;
    }

    // Apply grace amount limit
    const maxAllowed = stock + 10;
    if (quantity > maxAllowed) {
        quantity = maxAllowed;
    }

    // Update input value
    input.value = quantity;

    // Show appropriate warning
    updateStockWarning(itemId, quantity, stock);
}

function changeQuantity(itemId, delta, event) {
    event.stopPropagation();
    const input = document.querySelector(`#quantity-input-${itemId}`);
    const currentQuantity = parseInt(input.value) || 1;
    const stock = parseInt(input.getAttribute('data-stock'));
    
    let newQuantity = currentQuantity + delta;
    
    // Ensure minimum value is 1
    if (newQuantity < 1) {
        newQuantity = 1;
    }
    
    // Apply grace amount limit
    const maxAllowed = stock + 10;
    if (newQuantity > maxAllowed) {
        newQuantity = maxAllowed;
    }
    
    // Update input value
    input.value = newQuantity;
    
    // Show appropriate warning
    updateStockWarning(itemId, newQuantity, stock);
}

function updateStockWarning(itemId, quantity, stock) {
    const warningElement = document.querySelector(`#warning-${itemId}`);
    
    if (quantity > stock + 10) {
        warningElement.textContent = `Maximum order exceeded. Limited to ${stock + 10}kg.`;
    } else if (quantity > stock) {
        warningElement.textContent = 'Exceeds current stock. No guarantee on full quantity fulfillment.';
    } else {
        warningElement.textContent = '';
    }
}

function showOverlay(card) {
    // Extract product information from the card element
    const itemName = card.getAttribute('data-name');
    const itemPrice = card.getAttribute('data-price');
    const itemDescription = card.getAttribute('data-description');
    const itemImage = card.getAttribute('data-image');
    const itemStock = card.getAttribute('data-stock');

    // Populate the overlay with the product information
    document.getElementById('overlay-name').textContent = itemName;
    document.getElementById('overlay-price').textContent = `₱${itemPrice} / kg`;
    document.getElementById('overlay-description').textContent = itemDescription;
    document.getElementById('overlay-image').src = `${itemImage}`;
    document.getElementById('overlay-stock').textContent = `Current Stock: ${itemStock} kg`;

    // Show the overlay
    document.getElementById('description-overlay').style.display = 'flex';
}

function closeOverlay() {
    // Hide the overlay when the close button is clicked
    document.getElementById('description-overlay').style.display = 'none';
}

function closeOverlayOutside(event) {
    const overlayContent = document.querySelector(".overlay-content");
    if (!overlayContent.contains(event.target)) {
        closeOverlay();
    }
}