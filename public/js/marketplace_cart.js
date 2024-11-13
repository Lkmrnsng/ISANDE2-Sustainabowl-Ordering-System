// Cart state management using the same structure as in navbar
let cartItem = JSON.parse(localStorage.getItem('cartItem')) || [];
let totalPrice = parseFloat(localStorage.getItem('totalPrice')) || 0;

// Update cart display
function updateCartDisplay() {
    const cartDropdown = document.getElementById('cart-dropdown');
    
    // Clear existing items (preserve the hr and checkout button)
    const itemsToRemove = cartDropdown.querySelectorAll('.cart-item');
    itemsToRemove.forEach(item => item.remove());
    
    // Add each item to the dropdown before the hr
    const hr = cartDropdown.querySelector('hr');
    cartItem.forEach(item => {
        const cartItemHTML = `
            <div class="cart-item">
                <img src="${item.itemImage}" alt="product-image">
                <div class="item-container">
                    <div class="item-details">
                        <p class="item-name">${item.itemName}</p>
                        <p class="item-weight">${item.quantity} kg</p>
                        <p class="item-price-per-kg">x ₱${item.itemPrice} / kg</p>
                    </div>
                    
                    <div class="item-price">
                        <p class="delete-item" onclick="deleteCartItem('${item.itemName}')">Delete item</p>
                        <p class="item-total-price">₱${item.total}</p>
                    </div>
                </div>
            </div>
        `;
        hr.insertAdjacentHTML('beforebegin', cartItemHTML);
    });

    // Update total price
    totalPrice = cartItem.reduce((sum, item) => sum + parseFloat(item.total), 0);
    const totalElement = cartDropdown.querySelector('.total-price');
    if (totalElement) {
        totalElement.textContent = `₱${totalPrice.toFixed(2)}`;
    }

    // Save cart to localStorage
    localStorage.setItem('cartItem', JSON.stringify(cartItem));
    localStorage.setItem('totalPrice', totalPrice.toFixed(2));
}

// Add item to cart
function addToCart(itemData, quantity) {
    const existingItemIndex = cartItem.findIndex(item => item.itemName === itemData.name);
    
    const newItem = {
        itemName: itemData.name,
        itemPrice: parseFloat(itemData.price),
        quantity: quantity,
        itemImage: itemData.image,
        total: (parseFloat(itemData.price) * quantity).toFixed(2)
    };
    
    if (existingItemIndex !== -1) {
        // Update quantity if item exists
        cartItem[existingItemIndex].quantity += quantity;
        cartItem[existingItemIndex].total = 
            (cartItem[existingItemIndex].itemPrice * cartItem[existingItemIndex].quantity).toFixed(2);
    } else {
        // Add new item
        cartItem.push(newItem);
    }
    
    // Update display
    updateCartDisplay();
    
    // Show success message
    showMessage("Item added to cart!");
}

// Delete an item from cart
function deleteCartItem(itemName) {
    const findItem = cartItem.findIndex(item => item.itemName === itemName);

    if(findItem >= 0) {
        cartItem.splice(findItem, 1);
        updateCartDisplay();
        showMessage("Item removed from cart!");
    }
}

// Show message on the lower-right of screen
function showMessage(message) {
    let messageDiv = document.getElementById('cart-success-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'cart-success-message';
        messageDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            padding: 15px;
            border-radius: 5px;
            display: none;
            z-index: 1000;
        `;
        document.body.appendChild(messageDiv);
    }
    
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 2000);
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartDisplay();
    
    // Handle "Add to Request" buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const card = e.target.closest('.card-element') || e.target.closest('.overlay-content');
            const itemId = button.getAttribute('data-item-id');
            const quantityElement = card.querySelector(`#quantity-${itemId}`) || 
                                  document.getElementById('overlay-quantity');
            const quantity = parseInt(quantityElement.textContent);
            
            const itemData = {
                name: button.getAttribute('data-name'),
                price: button.getAttribute('data-price'),
                image: button.getAttribute('data-image')
            };
            
            addToCart(itemData, quantity);
            
            // Reset quantity to 1
            if (quantityElement) {
                quantityElement.textContent = '1 kg';
            }
            
            // Close overlay if open
            const overlay = document.getElementById('description-overlay');
            if (overlay && overlay.style.display === 'flex') {
                closeOverlay();
            }
        });
    });
    
    // Handle checkout button
    const checkoutButton = document.querySelector('.checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (cartItem.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            window.location.href = '/marketplace/checkout';
        });
    }
});