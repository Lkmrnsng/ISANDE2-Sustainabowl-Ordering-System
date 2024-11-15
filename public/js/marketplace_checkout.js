// Pull up the cart data from local storage
cartItem = JSON.parse(localStorage.getItem('cartItem')) || [];
totalPrice = parseFloat(localStorage.getItem('totalPrice')) || 0;

// Declare local variables
// let inputName = document.getElementById('input-name').getAttribute('placeholder') || "";
// let inputContact = document.getElementById('input-contact').getAttribute('placeholder') || "";
// let inputAddress = "";
// let inputDates = [];
// let inputSchedule = "";
// let inputCustomization = "";
// let inputPayment = "";

// Display or hide the section divs
function toggleSection(sectionId, setting) {
  const sections = document.querySelectorAll('.section');
  const editButtons = document.querySelectorAll('.edit-button');
  const currentIndex = Array.from(sections).findIndex(section => section.id === sectionId);

  // If setting = 0, the user is moving forward
  if (setting == 0) {
    sections.forEach(section => {
      if (section.id === sectionId) {
        section.classList.toggle('active');
        editButtons[currentIndex - 1].style.display = 'block';
      } else {
        section.classList.remove('active');
      }
    });
  }
  
  // If setting = 1, the user is editing a previous toggle
  if (setting == 1) {
    for (let i = currentIndex; i < sections.length - 1; i++) {
      const inputSection = sections[i].id;
      const summaryId = inputSection.replace("section", "summary-section");
      const summary = document.getElementById(summaryId);
      summary.classList.remove('active');
      const button = editButtons[i];
      button.style.display = 'none';

      if (sections[i].id === sectionId) {
        sections[i].classList.toggle('active');
      } else {
        sections[i].classList.remove('active');
      }
    }
    document.getElementById("confirm-section").classList.remove('active');
  }
}

// Display or hide the summary divs
function toggleSummary(sectionId, setting) {
  const summaries = document.querySelectorAll('.section-summary');

  // Setting 0 means remove, setting 1 means add active attribute
  summaries.forEach(summary => {
    if (!summary.classList.contains('active') && summary.id === sectionId && setting == 1) {
      summary.classList.toggle('active');
    }
  });

  if (setting == 0) {
    const specificSummary = document.getElementById(sectionId.toString());
    specificSummary.classList.remove('active');
  }
}

// Display or hide the tab divs
function toggleTab(tabId) {
  const tabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab-button');
  
  tabs.forEach(tab => {
    tab.style.display = tab.id === tabId ? 'block' : 'none';
  });
  
  buttons.forEach(button => {
    button.classList.toggle('active', button.innerText.toLowerCase().includes(tabId));
  });
}

// Update the summary div with the inputted information
function updateSummaryDiv(sectionKey) {
  switch (sectionKey) {
    // Update the address summary with inputed information
    case "input-address":
      const inputName = document.getElementById('input-name').getAttribute('placeholder').toString().trim();
      const inputContact = document.getElementById('input-contact').getAttribute('placeholder').toString().trim();
      const inputHouseNo = document.getElementById('input-house-no').value.toString().trim();
      const inputStreet = document.getElementById('input-street').value.toString().trim();
      const inputRegion = document.getElementById('input-region').value.toString().trim();
      const deliverySummary = document.querySelector('#deliver-summary-section .delivery-summary');
      deliverySummary.querySelector('.head').textContent = inputHouseNo + ' ' + inputStreet + ', ' + inputRegion;
      deliverySummary.querySelector('.sub').textContent = inputName + ' • '+ inputContact;
      break;

    // Update the address summary with selected address
    case "old-address":
      // find the selection that is checked
      const selectedRadio = document.querySelector('input[name="address"]:checked');
      if (!selectedRadio) return;
      const selectedSavedInfo = selectedRadio.closest('.saved-info');
      const selectedAddress = selectedSavedInfo.querySelector('.saved-info-radio p:first-child').textContent.trim();
      const selectedNameAndContact = selectedSavedInfo.querySelector('.saved-info-radio p:last-child').textContent.trim();
      const deliverySummaryRadio = document.querySelector('#deliver-summary-section .delivery-summary');
      deliverySummaryRadio.querySelector('.head').textContent = selectedAddress;
      deliverySummaryRadio.querySelector('.sub').textContent = selectedNameAndContact;
      break;

    // Update the schedule summary with inputed information
    case "input-schedule":
      const inputDate = document.getElementById('input-date').value.toString().trim();
      const inputTime = document.getElementById('input-time').value.toString().trim();
      const inputCustomization = document.getElementById('input-customization').value.toString().trim() || "No Remarks";
      const scheduleSummary = document.querySelector('#schedule-summary-section .delivery-summary');
      scheduleSummary.querySelector('.head').textContent = inputDate + ' during batch ' + inputTime;
      scheduleSummary.querySelector('.sub').textContent = inputCustomization;
      break;

    // Update the payment summary with inputed information
    case "input-payment":
      const inputPayment = document.getElementById('input-payment-method').value.toString().trim();
      const paymentSummary = document.querySelector('#payment-summary-section .delivery-summary');
      paymentSummary.querySelector('.head').textContent = inputPayment;
      break;

    // If the sectionKey provided does not exist, return false
    default:
      break;
  }
}

// Check if all required fields have text
function checkValidity(sectionKey) {
  switch (sectionKey) {
    case "input-address":
      if (document.getElementById('input-house-no').value !== "" &&
          document.getElementById('input-street').value !== "" &&
          document.getElementById('input-region').value !== "") {
        updateSummaryDiv("input-address");
        return true;
      } else {
        return false;
      }
    
    case "old-address":
      updateSummaryDiv("old-address");
      return true;

    case "input-schedule":
      if (document.getElementById('input-date').value !== "" &&
          document.getElementById('input-time').value !== "Select Batch") {
        updateSummaryDiv("input-schedule");
        return true;
      } else {
        return false;
      }

    case "input-payment":
      updateSummaryDiv("input-payment");
      return true;

    default:
      return false;
  }
}

// Open the next section after validation
function proceedFunction(sectionKey, selectionKey, summaryKey) {
  const selectionName = selectionKey + '-section';
  const summaryName = summaryKey + '-summary-section';
  const isComplete = checkValidity(sectionKey);

  if (isComplete) {
    toggleSection(selectionName, 0); 
    toggleSummary(summaryName, 1);
  } else {
    alert('Please complete all required fields.');
  }
}

// Finish checkout
async function submitRequest() {
  const deliverySummary = document.querySelector('#deliver-summary-section .delivery-summary');
  const address = deliverySummary.querySelector('.head').textContent;
  const name = deliverySummary.querySelector('.sub').textContent.split("•")[0].trim();
  const contact = deliverySummary.querySelector('.sub').textContent.split("•")[1].trim();

  const scheduleSummary = document.querySelector('#schedule-summary-section .delivery-summary');
  const date = scheduleSummary.querySelector('.head').textContent.split("during batch")[0].trim();
  const time = scheduleSummary.querySelector('.head').textContent.split("during batch")[1].trim();
  const batch = time.split("(")[1].split(")")[0];
  const customization = scheduleSummary.querySelector('.sub').textContent;

  const paymentSummary = document.querySelector('#payment-summary-section .delivery-summary');
  const payment = paymentSummary.querySelector('.head').textContent;

  console.log(address, name, contact, date, batch, customization, payment);

  // todo: call controller function to add to db
  // todo: clear cart if success
}

// Initialize the first section as active
document.addEventListener('DOMContentLoaded', () => {
  // When first loading the page, set the deliver section to active  
  document.getElementById('deliver-section').classList.add('active');

  // Function to load cart data from local storage
  function loadCart() {
    const cartSummary = document.querySelector('.cart-summary');
    
    // Add each item to the dropdown before the hr
    const hr = cartSummary.querySelector('hr');
    cartItem.forEach(item => {
        const cartItemHTML = `
            <div class="cart-item">
                <img src="${item.itemImage}" alt="product-image">
                <div class="item-container">
                    <div class="item-details">
                        <p class="item-name">${item.itemName}</p>
                        <p class="item-weight">${item.quantity} kg</p>
                    </div>
                    
                    <div class="item-price">
                        <p class="item-price-per-kg">x ₱${item.itemPrice} / kg</p>
                        <p class="item-total-price">₱${item.total}</p>
                    </div>
                </div>
            </div>
        `;
        hr.insertAdjacentHTML('beforebegin', cartItemHTML);
    });

    // Update total price
    const totalElement = cartSummary.querySelector('.total-price');
    if (totalElement) {
        totalElement.textContent = `₱${totalPrice.toFixed(2)}`;
    }
  }

  loadCart();
});