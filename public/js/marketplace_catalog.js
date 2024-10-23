document.addEventListener('DOMContentLoaded', () => {
    // Get all the product cards
    const productCards = document.querySelectorAll('.card-element img[alt="product-image"]');

    productCards.forEach(card => {
        card.addEventListener('click', function() {
            // Extract product information from data attributes
            // const productName = this.getAttribute('data-name');
            // const productPrice = this.getAttribute('data-price');
            // const productDescription = this.getAttribute('data-description');
            // const productImage = this.getAttribute('data-image');

            const productName = "Tomato";
            const productPrice = "50";
            const productDescription = "Fresh and ripe tomatoes sourced locally from sustainable farms.";
            const productImage = "tomato.jpg";

            // Populate the overlay with the product information
            document.getElementById('overlay-name').textContent = productName;
            document.getElementById('overlay-price').textContent = `₱ ${productPrice} / kg`;
            document.getElementById('overlay-description').textContent = productDescription;
            document.getElementById('overlay-image').src = `/img/${productImage}`;

            // Show the overlay
            document.getElementById('description-overlay').style.display = 'flex';
        });
    });
});

function closeOverlay() {
    // Hide the overlay when the close button is clicked
    document.getElementById('description-overlay').style.display = 'none';
}



