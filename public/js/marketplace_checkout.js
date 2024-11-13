// Pull up the cart data from local storage
cartItem = JSON.parse(localStorage.getItem('cartItem')) || [];
totalPrice = parseFloat(localStorage.getItem('totalPrice')) || 0;

// Example of displaying cart items on the checkout page
cartItem.forEach(item => {
  console.log(`Item: ${item.itemName}, Quantity: ${item.quantity}, Total: ${item.total}`);
});

// Display total price if needed
console.log(`Total Price: ₱${totalPrice.toFixed(2)}`);


function toggleSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    const clickedSection = document.getElementById(sectionId);
    
    sections.forEach(section => {
      if (section.id === sectionId) {
        section.classList.toggle('active');
      } else {
        section.classList.remove('active');
      }
    });
  }
  
function showTab(tabId) {
  const tabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab-button');
  
  tabs.forEach(tab => {
    tab.style.display = tab.id === tabId ? 'block' : 'none';
  });
  
  buttons.forEach(button => {
    button.classList.toggle('active', button.innerText.toLowerCase().includes(tabId));
  });
}

// Initialize the first section as active
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('deliver-section').classList.add('active');
});