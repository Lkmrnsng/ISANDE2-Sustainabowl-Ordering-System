function logoutUser() {
    // Create a new form element
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout?_method=DELETE'; // Action URL for logout
    
    // Append the form to the document body and submit
    document.body.appendChild(form);
    form.submit();
}