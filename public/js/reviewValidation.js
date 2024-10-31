// Add this new file as public/js/reviewValidation.js

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('reviewForm');
  const overallRatingInputs = document.querySelectorAll('input[name="overallRating"]');
  const submitBtn = form.querySelector('.submit-btn');

  function validateOverallRating() {
      const isRatingSelected = Array.from(overallRatingInputs).some(input => input.checked);
      if (!isRatingSelected) {
          // Create error message if it doesn't exist
          let errorMsg = document.getElementById('overall-rating-error');
          if (!errorMsg) {
              errorMsg = document.createElement('div');
              errorMsg.id = 'overall-rating-error';
              errorMsg.className = 'error-message';
              errorMsg.textContent = 'Please select an overall rating';
              const ratingGroup = document.querySelector('.rating-group');
              ratingGroup.appendChild(errorMsg);
          }
          return false;
      }

      // Remove error message if rating is selected
      const errorMsg = document.getElementById('overall-rating-error');
      if (errorMsg) {
          errorMsg.remove();
      }
      return true;
  }

  // Add validation on form submission
  form.addEventListener('submit', function(e) {
      const isValid = validateOverallRating();
      if (!isValid) {
          e.preventDefault();
          // Scroll to error message
          document.querySelector('.rating-group').scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
          });
      }
  });

  // Add validation on rating selection
  overallRatingInputs.forEach(input => {
      input.addEventListener('change', validateOverallRating);
  });

  // Initial validation state
  validateOverallRating();
});