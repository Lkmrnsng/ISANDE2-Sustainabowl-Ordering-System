let cart = [];

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
    const productName = card.getAttribute('data-name');
    const productPrice = card.getAttribute('data-price');
    const productDescription = card.getAttribute('data-description');
    const productImage = card.getAttribute('data-image');

    // Populate the overlay with the product information
    document.getElementById('overlay-name').textContent = productName;
    document.getElementById('overlay-price').textContent = `₱${productPrice} / kg`;
    document.getElementById('overlay-description').textContent = productDescription;
    document.getElementById('overlay-image').src = `${productImage}`;

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

function addToCart(card) {
    // Extract product information from the card element
    const productName = card.getAttribute('data-name');
    const productPrice = card.getAttribute('data-price');
    const productQuantity = 1; // Assuming a default quantity of 1
    const productTotalPrice = productPrice * productQuantity;
    const productImage = card.getAttribute('data-image');
    
    // Create a new cart item object
    const cartItem = {
        name: productName,
        price: productPrice,
        quantity: productQuantity,
        totalPrice: productTotalPrice,
        image: productImage
    };
    
    // Add the cart item to the cart array
    cart.push(cartItem);
    
    // Update the cart count and total price
    updateCartCount();
    updateCartTotal();
    
    // Display a success message
    document.getElementById('cart-success-message').style.display = 'block';
    setTimeout(() => {
        document.getElementById('cart-success-message').style.display = 'none';
    }, 2000);
}

function updateCartCount() {
    const cartCount = cart.length;
    document.getElementById('cart-count').textContent = cartCount;
}

function updateCartTotal() {
    const cartTotal = cart.reduce((total, item) => total + item.totalPrice, 0);
    document.getElementById('cart-total').textContent = `₱${cartTotal.toFixed(2)}`;
}