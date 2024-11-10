

// public/js/weekly-tasks.js
class WeeklyTaskList {
    constructor() {
      this.currentDate = new Date();
      this.tasks = {
        'Wed Nov 13 2024': [
          { id: 1, text: 'Team Meeting', status: 'completed' },
          { id: 2, text: 'Project Review', status: 'completed' },
          { id: 3, text: 'Client Call', status: 'pending' }
        ],
        'Fri Nov 15 2024': [
          { id: 4, text: 'Weekly Report', status: 'pending' },
          { id: 5, text: 'Team Sync', status: 'pending' }
        ]
      };
      
      this.init();
    }
  
    init() {
      this.bindEvents();
      this.renderCalendar();
    }
  
    bindEvents() {
      document.getElementById('prevWeek').addEventListener('click', () => this.navigateWeek('prev'));
      document.getElementById('nextWeek').addEventListener('click', () => this.navigateWeek('next'));
    }
  
    getWeekDates(date) {
      const start = new Date(date);
      start.setDate(start.getDate() - start.getDay());
      const dates = [];
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        dates.push(day);
      }
      return dates;
    }
  
    navigateWeek(direction) {
      const newDate = new Date(this.currentDate);
      newDate.setDate(this.currentDate.getDate() + (direction === 'next' ? 7 : -7));
      this.currentDate = newDate;
      this.renderCalendar();
    }
  
    isToday(date) {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }
  
    formatDate(date) {
      return date.toDateString();
    }
  
    async renderCalendar() {
      const weekDates = this.getWeekDates(this.currentDate);
      const weekData = weekDates.map(date => {
        const dateStr = this.formatDate(date);
        return {
          date: dateStr,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
          dayNumber: date.getDate(),
          isToday: this.isToday(date),
          tasks: this.tasks[dateStr] || []
        };
      });
  
      // In a real application, you would use server-side rendering with HBS
      // Here we're updating the DOM directly for demonstration
      this.updateCalendarHeader(weekData);
      this.updateCalendarBody(weekData);
    }
  
    updateCalendarHeader(weekData) {
      const headerHtml = weekData.map(day => `
        <div class="calendar-header-cell ${day.isToday ? 'today' : ''}">
          <div class="day-name">${day.dayName}</div>
          <div class="day-number">${day.dayNumber}</div>
        </div>
      `).join('');
  
      document.getElementById('calendarHeader').innerHTML = headerHtml;
    }
  
    updateCalendarBody(weekData) {
      const bodyHtml = weekData.map(day => `
        <div class="calendar-day-column" data-date="${day.date}">
          ${day.tasks.map(task => `
            <div class="task-card" data-task-id="${task.id}">
              <div class="task-content">
                <button 
                  class="status-button ${task.status === 'completed' ? 'completed' : 'pending'}"
                  onclick="weeklyTaskList.toggleTaskStatus('${day.date}', ${task.id})"
                >
                  ${task.status === 'completed' 
                    ? '<svg class="status-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
                    : '<svg class="status-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>'
                  }
                </button>
                <span class="task-text ${task.status === 'completed' ? 'completed' : ''}">${task.text}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `).join('');
  
      document.getElementById('calendarBody').innerHTML = bodyHtml;
    }
  
    toggleTaskStatus(dateStr, taskId) {
      if (this.tasks[dateStr]) {
        const taskIndex = this.tasks[dateStr].findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          this.tasks[dateStr][taskIndex].status = 
            this.tasks[dateStr][taskIndex].status === 'completed' ? 'pending' : 'completed';
          this.renderCalendar();
        }
      }
    }
  }
  
  // Initialize the weekly task list
  let weeklyTaskList;
  document.addEventListener('DOMContentLoaded', () => {
    weeklyTaskList = new WeeklyTaskList();
  });