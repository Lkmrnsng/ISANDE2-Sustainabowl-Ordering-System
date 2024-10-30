document.addEventListener('DOMContentLoaded', function() {
    initializeFormValidation();
});

function initializeFormValidation() {
    const form = document.getElementById('reviewForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = {
            orderId: form.orderId.value,
            overallRating: parseInt(form.overallRating.value) || 0,
            comment: form.comment.value
        };

        // Validate overall rating
        if (!formData.overallRating) {
            alert('Please provide an overall rating');
            return;
        }

        // Add optional ratings
        const optionalRatings = [
            'customerService', 'delivery', 'freshness', 'quality',
            'price', 'packaging', 'convenience', 'customization'
        ];

        optionalRatings.forEach(rating => {
            const ratingInput = form.querySelector(`input[name="${rating}Rating"]:checked`);
            if (ratingInput) {
                formData[`${rating}Rating`] = parseInt(ratingInput.value);
            }
        });

        try {
            const isEditing = form.dataset.isEditing === 'true';
            const action = isEditing ? 
                `/review/edit/${form.dataset.reviewId}` : 
                '/review/submit';

            const response = await fetch(action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save review');
            }

            window.location.href = '/review/my-reviews';
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Failed to save review. Please try again.');
        }
    });
}

// In review.js
window.deleteReview = async function(reviewId) {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/review/delete/${reviewId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'same-origin'
        });

        if (response.ok) {
            window.location.href = '/review/my-reviews';
        } else {
            throw new Error('Failed to delete review');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete review. Please try again.');
    }
}