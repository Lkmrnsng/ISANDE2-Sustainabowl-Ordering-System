document.addEventListener('DOMContentLoaded', function() {
  // Star Rating Functionality
  initializeStarRatings();
  
  // Review Form Validation
  initializeFormValidation();
  
  // Dashboard Filters
  initializeDashboardFilters();
  
  // Response Modal
  initializeResponseModal();
});

function initializeStarRatings() {
  const starRatings = document.querySelectorAll('.star-rating');
  
  starRatings.forEach(ratingGroup => {
      const stars = ratingGroup.querySelectorAll('.star');
      const inputName = ratingGroup.dataset.ratingInput;
      const hiddenInput = document.querySelector(`input[name="${inputName}"]`);
      
      stars.forEach(star => {
          // Hover effect
          star.addEventListener('mouseover', () => {
              const value = star.dataset.value;
              highlightStars(stars, value);
          });
          
          // Click handler
          star.addEventListener('click', () => {
              const value = star.dataset.value;
              hiddenInput.value = value;
              highlightStars(stars, value);
              // Add permanent highlight class
              stars.forEach(s => {
                  s.classList.remove('selected');
                  if (s.dataset.value <= value) {
                      s.classList.add('selected');
                  }
              });
          });
      });
      
      // Reset on mouse leave if no rating selected
      ratingGroup.addEventListener('mouseleave', () => {
          if (!hiddenInput.value) {
              highlightStars(stars, 0);
          } else {
              highlightStars(stars, hiddenInput.value);
          }
      });
  });
}

function highlightStars(stars, value) {
  stars.forEach(star => {
      star.classList.toggle('active', star.dataset.value <= value);
  });
}

function initializeFormValidation() {
  const form = document.getElementById('reviewForm');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Check required overall rating
      const overallRating = form.querySelector('input[name="overallRating"]');
      if (!overallRating.value) {
          alert('Please provide an overall rating');
          return;
      }
      
      // Submit form if validation passes
      form.submit();
  });
}

function initializeDashboardFilters() {
  const filterTags = document.querySelectorAll('.filter-tag');
  const ratingFilter = document.getElementById('ratingFilter');
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  const applyFiltersBtn = document.getElementById('applyFilters');
  
  if (!applyFiltersBtn) return;
  
  // Tag filter click handler
  filterTags.forEach(tag => {
      tag.addEventListener('click', () => {
          tag.classList.toggle('active');
          updateFilters();
      });
  });
  
  // Apply filters button click handler
  applyFiltersBtn.addEventListener('click', updateFilters);
  
  function updateFilters() {
      const params = new URLSearchParams();
      
      // Add active tags
      const activeTags = Array.from(filterTags)
          .filter(tag => tag.classList.contains('active'))
          .map(tag => tag.dataset.tag);
          
      if (activeTags.length) {
          params.set('tag', activeTags.join(','));
      }
      
      // Add rating filter
      if (ratingFilter.value) {
          params.set('rating', ratingFilter.value);
      }
      
      // Add date range
      if (startDate.value && endDate.value) {
          params.set('startDate', startDate.value);
          params.set('endDate', endDate.value);
      }
      
      // Update URL and reload page
      window.location.search = params.toString();
  }
}

function initializeResponseModal() {
  const respondButtons = document.querySelectorAll('.respond-btn');
  
  respondButtons.forEach(button => {
      button.addEventListener('click', () => {
          const reviewId = button.dataset.reviewId;
          showResponseModal(reviewId);
      });
  });
}

function showResponseModal(reviewId) {
  // Create modal HTML
  const modal = document.createElement('div');
  modal.className = 'response-modal';
  modal.innerHTML = `
      <div class="modal-content">
          <h3>Respond to Review #${reviewId}</h3>
          <textarea id="responseText" placeholder="Type your response..."></textarea>
          <div class="modal-actions">
              <button class="cancel-btn">Cancel</button>
              <button class="submit-btn">Submit Response</button>
          </div>
      </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  const cancelBtn = modal.querySelector('.cancel-btn');
  const submitBtn = modal.querySelector('.submit-btn');
  const textarea = modal.querySelector('#responseText');
  
  cancelBtn.addEventListener('click', () => {
      modal.remove();
  });
  
  submitBtn.addEventListener('click', async () => {
      const response = textarea.value.trim();
      if (!response) {
          alert('Please enter a response');
          return;
      }
      
      try {
          const res = await fetch(`/review/${reviewId}/respond`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ response })
          });
          
          if (!res.ok) throw new Error('Failed to submit response');
          
          // Reload page to show new response
          window.location.reload();
      } catch (error) {
          console.error('Error submitting response:', error);
          alert('Failed to submit response. Please try again.');
      }
  });
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
      if (e.target === modal) {
          modal.remove();
      }
  });
}

// Helper function to format dates
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
  });
}

// Add CSS for modal
const modalStyles = `
  .response-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
  }

  .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .modal-content h3 {
      margin-top: 0;
      margin-bottom: 1rem;
  }

  .modal-content textarea {
      width: 100%;
      min-height: 150px;
      padding: 1rem;
      margin-bottom: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      resize: vertical;
  }

  .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
  }
`;

// Insert modal styles
const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);

// Animation helpers for ratings
function animateRating(element, targetValue) {
  const duration = 1000; // 1 second
  const start = parseFloat(element.textContent) || 0;
  const startTime = performance.now();
  
  function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = t => 1 - Math.pow(1 - t, 3);
      const currentValue = start + (targetValue - start) * easeOut(progress);
      
      element.textContent = currentValue.toFixed(1);
      
      if (progress < 1) {
          requestAnimationFrame(update);
      }
  }
  
  requestAnimationFrame(update);
}

// Initialize rating animations on dashboard load
function initializeRatingAnimations() {
  const ratingElements = document.querySelectorAll('.stat-value');
  ratingElements.forEach(element => {
      const targetValue = parseFloat(element.textContent);
      element.textContent = '0';
      animateRating(element, targetValue);
  });
}

// Initialize tooltips for ratings
function initializeTooltips() {
  const ratingItems = document.querySelectorAll('.rating-item');
  ratingItems.forEach(item => {
      const label = item.querySelector('.rating-label');
      const originalText = label.textContent;
      const description = getRatingDescription(originalText);
      
      item.setAttribute('title', description);
      item.style.cursor = 'help';
  });
}

function getRatingDescription(category) {
  const descriptions = {
      'customerService': 'Rating for the quality of customer service and support',
      'delivery': 'Rating for delivery timeliness and handling',
      'freshness': 'Rating for the freshness of products',
      'quality': 'Rating for overall product quality',
      'price': 'Rating for price fairness and value',
      'packaging': 'Rating for packaging quality and protection',
      'convenience': 'Rating for ease of ordering and delivery process',
      'customization': 'Rating for product customization options'
  };
  
  return descriptions[category.toLowerCase()] || 'Rating for ' + category;
}

// Export filter state for sharing
function getFilterState() {
  const activeTags = Array.from(document.querySelectorAll('.filter-tag.active'))
      .map(tag => tag.dataset.tag);
  
  const ratingFilter = document.getElementById('ratingFilter')?.value;
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  
  return {
      tags: activeTags,
      rating: ratingFilter,
      dateRange: {
          start: startDate,
          end: endDate
      }
  };
}

// Share filter state
function initializeFilterSharing() {
  const shareButton = document.getElementById('shareFilters');
  if (!shareButton) return;
  
  shareButton.addEventListener('click', () => {
      const filterState = getFilterState();
      const queryString = new URLSearchParams();
      
      if (filterState.tags.length) {
          queryString.set('tags', filterState.tags.join(','));
      }
      if (filterState.rating) {
          queryString.set('rating', filterState.rating);
      }
      if (filterState.dateRange.start && filterState.dateRange.end) {
          queryString.set('startDate', filterState.dateRange.start);
          queryString.set('endDate', filterState.dateRange.end);
      }
      
      const shareUrl = `${window.location.origin}${window.location.pathname}?${queryString.toString()}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl)
          .then(() => {
              alert('Filter URL copied to clipboard!');
          })
          .catch(err => {
              console.error('Failed to copy URL:', err);
              alert('Failed to copy URL to clipboard');
          });
  });
}

// Initialize all features
document.addEventListener('DOMContentLoaded', () => {
  initializeStarRatings();
  initializeFormValidation();
  initializeDashboardFilters();
  initializeResponseModal();
  initializeRatingAnimations();
  initializeTooltips();
  initializeFilterSharing();
});