document.addEventListener("DOMContentLoaded", () => {
    const calendarElement = document.getElementById("calendar");
    const monthYearElement = document.getElementById("monthYear");
    let currentDate = new Date();

    // Sample data
    const tasks = [
        { task: "Task 1", details: "Details of task 1", date: "2024-11-13", status: "Pending" },
        { task: "Task 2", details: "Details of task 2", date: "2024-11-13", status: "Pending" },
        { task: "Task 3", details: "Details of task 3", date: "2024-11-13", status: "Pending" },
        { task: "Task 2", details: "Details of task 2", date: "2024-11-20", status: "Completed" },
        // Add more tasks as needed
    ];

    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const today = new Date();

        // Clear the calendar for re-rendering
        calendarElement.innerHTML = "";
        
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
        
        const startDay = firstDayOfMonth.getDay();
        const totalDays = lastDayOfMonth.getDate();
        
        monthYearElement.textContent = `${firstDayOfMonth.toLocaleString('default', { month: 'long' })} ${year}`;

        // Render previous month's days
        for (let i = startDay - 1; i >= 0; i--) {
            const day = document.createElement("div");
            day.classList.add("calendar-day", "prev-month");
            day.textContent = lastDayOfPrevMonth - i;
            calendarElement.appendChild(day);
        }

        // Render current month's days
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement("div");
            dayElement.classList.add("calendar-day");
            dayElement.textContent = day;

            // Check if this day is the current day
            if (today.getDate() === day && today.getMonth() === month && today.getFullYear() === year) {
                dayElement.classList.add("current-day");
            }

            // Check if there are any tasks on this day
            const taskDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTasks = tasks.filter(task => task.date === taskDate);

            dayTasks.forEach(task => {
                const taskDetail = document.createElement("div");
                taskDetail.classList.add("task-details");
                taskDetail.textContent = task.task;

                // Make task clickable to open overlay
                taskDetail.addEventListener("click", () => openOverlay(task));

                dayElement.appendChild(taskDetail);
            });

            calendarElement.appendChild(dayElement);
        }

        // Render next month's days to fill the grid
        const totalDaysInCalendar = Math.ceil((startDay + totalDays) / 7) * 7;
        const nextMonthDays = totalDaysInCalendar - (startDay + totalDays);
        for (let i = 1; i <= nextMonthDays; i++) {
            const day = document.createElement("div");
            day.classList.add("calendar-day", "next-month");
            day.textContent = i;
            calendarElement.appendChild(day);
        }
    }

    function changeMonth(step) {
        currentDate.setMonth(currentDate.getMonth() + step);
        renderCalendar(currentDate);
    }

    document.getElementById("prevMonth").addEventListener("click", () => changeMonth(-1));
    document.getElementById("nextMonth").addEventListener("click", () => changeMonth(1));

    renderCalendar(currentDate);


    // Function to open the overlay with task details
function openOverlay(task) {
    document.getElementById("overlayTitle").textContent = task.task;
    document.getElementById("overlayDescription").textContent = "Description: " + task.details;
    document.getElementById("overlayDate").textContent = "Date: " + task.date;
    document.getElementById("overlayStatus").textContent = "Status: " + task.status;
    document.getElementById("overlay").style.display = "block";
}

// Function to close the overlay
function closeOverlay() {
    document.getElementById("overlay").style.display = "none";
}

// Event listener for closing the overlay
document.getElementById("closeOverlay").addEventListener("click", closeOverlay);

// Close overlay when clicking outside the content box
window.addEventListener("click", function (event) {
    const overlay = document.getElementById("overlay");
    if (event.target === overlay) {
        closeOverlay();
    }});
});
