document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("sendAlertModal");
    const openModalBtn = document.querySelector(".send-alert-btn");
    const closeModalBtn = document.querySelector(".close-btn");
    const form = document.getElementById("sendAlertForm");

    // Open modal with selected request details
    openModalBtn.addEventListener("click", () => {
        const selectedRows = document.querySelectorAll("input[type='checkbox']:checked");
        if (selectedRows.length > 0) {
            const requestId = selectedRows[0].closest('tr').querySelector('td:nth-child(2)').textContent;
            document.getElementById("requestId").value = requestId;
            modal.style.display = "block";
        } else {
            alert("Please select at least one request.");
        }
    });

    // Close modal handlers
    closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Form submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const formData = {
            requestID: document.getElementById("requestId").value,
            concernType: document.getElementById("concernType").value,
            details: document.getElementById("details").value,
            cancelRequest: document.querySelector('input[name="cancelRequest"]:checked').value === "yes"
        };

        try {
            const response = await fetch('/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("Alert sent successfully!");
                modal.style.display = "none";
                form.reset();
                location.reload(); // Refresh the page to update the table
            } else {
                const result = await response.json();
                alert("Error sending alert: " + result.message);
            }
        } catch (error) {
            alert("Error: " + error.message);
        }
    });
});