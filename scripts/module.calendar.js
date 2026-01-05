var Launcher = Launcher || {};
Launcher.Modules = Launcher.Modules || {};
Launcher.Modules.Calendar = (function() {
    
    function init() {

        const widgetInfo = { 
            "id": "calendar-widget", 
            "type": "custom", 
            "colSpan": 1, "rowSpan": 1, 
            "contentHTML": "<div class='calendar-widget'><div class='day'>Loading...</div><div class='date'>--</div></div>", 
        };

        function showCalendar() {
            // Dynamically load the calendar's CSS
            Launcher.loadStyle('styles/calendar.css');

            const today = new Date();
            let currentYear = today.getFullYear();
            let currentMonth = today.getMonth();

            function generateCalendarHTML(year, month) {
                const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
                const currentDate = today.getDate();
                let html = '<table class="calendar-modal"><thead><tr>';
                ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(day => html += `<th>${day}</th>`);
                html += '</tr></thead><tbody><tr>';
                const firstDay = new Date(year, month, 1).getDay();
                for (let i = 0; i < firstDay; i++) html += '<td></td>';
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                    const dayOfWeek = new Date(year, month, i).getDay();
                    if (dayOfWeek === 0 && i > 1) html += '</tr><tr>';
                    const isToday = (isCurrentMonth && i === currentDate) ? 'class="today"' : '';
                    html += `<td ${isToday}>${i}</td>`;
                }
                html += '</tr></tbody></table>';
                return html;
            }

            let headerHTML = '<div class="calendar-controls"><select id="month-select">';
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            monthNames.forEach((name, index) => {
                headerHTML += `<option value="${index}" ${index === currentMonth ? 'selected' : ''}>${name}</option>`;
            });
            headerHTML += '</select><select id="year-select">';
            for (let i = currentYear - 10; i <= currentYear + 10; i++) {
                headerHTML += `<option value="${i}" ${i === currentYear ? 'selected' : ''}>${i}</option>`;
            }
            headerHTML += '</select><button id="today-btn">Today</button></div>';
            
            Launcher.showContentModal("Calendar", headerHTML + '<div id="calendar-table-container"></div>');

            const monthSelect = document.getElementById('month-select');
            const yearSelect = document.getElementById('year-select');
            const todayBtn = document.getElementById('today-btn');
            const tableContainer = document.getElementById('calendar-table-container');

            function updateCalendar() {
                tableContainer.innerHTML = generateCalendarHTML(parseInt(yearSelect.value, 10), parseInt(monthSelect.value, 10));
            }

            updateCalendar();
            monthSelect.addEventListener('change', updateCalendar);
            yearSelect.addEventListener('change', updateCalendar);
            todayBtn.addEventListener('click', () => {
                monthSelect.value = today.getMonth();
                yearSelect.value = today.getFullYear();
                updateCalendar();
            });
        }


        widgetInfo["onAttach"] = function handleCalendar(widgetEl) {

            const dayEl = widgetEl.querySelector('.day');
            const dateEl = widgetEl.querySelector('.date');
            const now = new Date();
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            dayEl.textContent = days[now.getDay()];
            dateEl.textContent = now.getDate();

            widgetEl.addEventListener('click', showCalendar);

        };


        Launcher.Board.registerWidgetProvider((callback) => {
            callback(null, [widgetInfo]);
        });

        Launcher.NotificationBar.registerTool('calendar', 'right', new Date().toLocaleDateString(), (element) => {
            element.addEventListener('click', showCalendar);
                } );

        Launcher.NotificationBar.registerTool('clock', 'right', '00:00 AM', function(element) {
            function updateClock() {
                if (!element) return;
                const now = new Date();
                const options = { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false };
                element.textContent = now.toLocaleTimeString('en-US', options);
            }

            updateClock();
            setInterval(updateClock, 1000);
        } );                

    }
    return {
        init: init
    }
    
})();