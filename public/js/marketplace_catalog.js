document.querySelectorAll('.fa-square-minus, .fa-square-plus').forEach(button => {
    button.addEventListener('click', function(event) {
        const itemId = event.target.getAttribute('data-item-id');
        const delta = parseInt(event.target.getAttribute('data-delta'));
        changeQuantity(itemId, delta, event);
    });
});

function changeQuantity(itemId, delta, event) {
    event.stopPropagation(); // Prevents the click from triggering showOverlay
    const quantityElement = document.querySelector(`#quantity-${itemId}`);
    let quantity = parseInt(quantityElement.textContent) + delta;
    if (quantity < 1) quantity = 1; // Ensure quantity doesn’t go below 1
    quantityElement.textContent = `${quantity} kg`;
}

function showOverlay(card) {
    // Extract product information from the card element
    const itemName = card.getAttribute('data-name');
    const itemPrice = card.getAttribute('data-price');
    const itemDescription = card.getAttribute('data-description');
    const itemImage = card.getAttribute('data-image');

    // Populate the overlay with the product information
    document.getElementById('overlay-name').textContent = itemName;
    document.getElementById('overlay-price').textContent = `₱${itemPrice} / kg`;
    document.getElementById('overlay-description').textContent = itemDescription;
    document.getElementById('overlay-image').src = `${itemImage}`;

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