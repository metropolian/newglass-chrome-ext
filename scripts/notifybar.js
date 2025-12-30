var Launcher = Launcher || {};
Launcher.Modules = Launcher.Modules || {};
Launcher.Modules.NotificationBar = Launcher.NotificationBar = (function() {
    // --- Module-level Variables ---
    let notificationBar, notificationDrawer, notificationList, notificationBadge,
        clockElement, searchInput, dashboardContainer, networkStatusIcon,
        barLeft, barCenter, barRight;

    let allNotifications = [];
    let isDragging = false;
    let initialY = 0;

    // --- Core UI Functions ---
    function updateClock() {
        if (!clockElement) return;
        const now = new Date();
        const options = { hour: 'numeric', minute: '2-digit', hour12: false };
        clockElement.textContent = now.toLocaleTimeString('en-US', options);
    }

    function updateNetworkStatus() {
        if (!networkStatusIcon) return;
        const onlineIcon = networkStatusIcon.querySelector('.icon-online');
        const offlineIcon = networkStatusIcon.querySelector('.icon-offline');
        if (navigator.onLine) {
            onlineIcon.classList.remove('hidden');
            offlineIcon.classList.add('hidden');
        } else {
            onlineIcon.classList.add('hidden');
            offlineIcon.classList.remove('hidden');
        }
    }

    function renderNotifications() {
        if (!notificationList || !notificationBadge) return;
        allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        notificationList.innerHTML = '';
        let unreadCount = 0;
        allNotifications.forEach(notif => {
            if (!notif.read) unreadCount++;
            const item = Launcher.newElement('div', 'notification-item');
            if (notif.read) item.classList.add('read');
            item.dataset.id = notif.id;
            item.dataset.provider = notif.provider;
            const time = new Date(notif.timestamp).toLocaleString();
            item.innerHTML = `<div class="notification-title">${notif.title}</div><div class="notification-timestamp">${time}</div>`;
            notificationList.appendChild(item);
        });
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    }
    
    // --- Event Handlers ---
    function handleDragStart(e) {
        if (e.target.matches('input, button')) return;
        if (notificationDrawer.classList.contains('open')) {
            notificationDrawer.classList.remove('open');
            isDragging = false;
            e.preventDefault();
            return;
        }
        isDragging = true;
        initialY = e.clientY;
        notificationDrawer.style.transition = 'none';
    }

    function handleDragMove(e) {
        if (!isDragging) return;
        const currentY = e.clientY;
        let deltaY = currentY - initialY;
        if (deltaY < 0) deltaY = 0;
        const drawerHeight = notificationDrawer.offsetHeight;
        const startPos = -drawerHeight;
        let newY = startPos + deltaY;
        if (newY > 0) newY = 0;
        notificationDrawer.style.transform = `translateY(${newY}px)`;
        notificationDrawer.style.opacity = '1';
    }

    function handleDragEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        notificationDrawer.style.transition = '';
        notificationDrawer.style.transform = '';
        notificationDrawer.style.opacity = '';
        const deltaY = e.clientY - initialY;
        const drawerHeight = notificationDrawer.offsetHeight;
        if (deltaY > drawerHeight * 0.3) {
            notificationDrawer.classList.add('open');
        } else {
            notificationDrawer.classList.remove('open');
        }
    }

    function handleNotificationClick(e) {
        const item = e.target.closest('.notification-item');
        if (!item) return;
        const notifId = item.dataset.id;
        const providerId = item.dataset.provider;
        const notification = allNotifications.find(n => n.id == notifId && n.provider === providerId);
        if (notification) {
            Launcher.showMessage(notification.message, notification.title);
            if (!notification.read) {
                notification.read = true;
                renderNotifications();
            }
        }
    }
    
    function handleDashboardClick() {
        if (notificationDrawer.classList.contains('open')) {
            notificationDrawer.classList.remove('open');
        }
    }

    // --- Public API ---
    function registerMessageProvider(id, providerFunction) {
        providerFunction(function(error, notifications) {
            if (error) {
                console.error(`Error from notification provider "${id}":`, error);
                return;
            }
            const taggedNotifications = notifications.map(n => ({...n, provider: id }));
            allNotifications = allNotifications.concat(taggedNotifications);
            renderNotifications();
        });
    }

    function registerTool(id, bar, toolbarFunction) {

        const element = Launcher.newElement('span', 'bar-tool', text);
        element.id = 'x' + id;

        
        
        notificationBar.getElementById('barleft');

        element.innerHTML = (typeof toolbarFunction == 'function') ? toolbarFunction() : toolbarFunction;


        return element;
    }

    function init() {
        notificationBar = document.getElementById('notification-bar');
        notificationDrawer = document.getElementById('notification-drawer');
        notificationList = document.getElementById('notification-list');
        notificationBadge = document.getElementById('notification-badge');
        dashboardContainer = document.querySelector('.dashboard-container');

        barLeft = document.getElement('bar-left');
        barCenter = document.getElementById('bar-center');
        barRight = document.getElementsById('bar-right');


        clockElement = document.getElementById('clock');
        searchInput = document.getElementById('global-search-input');
        networkStatusIcon = document.getElementById('network-status-icon');

        if (searchInput) {
            // Attach the new autocomplete functionality
            Launcher.attachAutocomplete(searchInput, 
                // onInput: This function provides the suggestions
                (term, showSuggestions) => {
                    const searchTerm = term.toLowerCase();
                    if (searchTerm.length === 0) {
                        showSuggestions([]);
                        // Clear highlights when search is empty
                        Launcher.Board.state.widgets.forEach(widget => widget.element.classList.remove('highlight'));
                        return;
                    }
                    const suggestions = Launcher.Board.state.widgets
                        .filter(widget => widget.name && widget.name.toLowerCase().includes(searchTerm))
                        .map(widget => widget.name);
                    
                    showSuggestions(suggestions);
                    
                    // Also highlight in real-time
                    Launcher.Board.state.widgets.forEach(widget => {
                         const isMatch = widget.name && widget.name.toLowerCase().includes(searchTerm);
                         widget.element.classList.toggle('highlight', isMatch);
                    });
                },
                // onSelect: This function runs when a user chooses an item
                (selectedValue) => {
                    const widget = Launcher.Board.state.widgets.find(w => w.name && w.name.toLowerCase() === selectedValue.toLowerCase());
                    if (widget) {
                        Launcher.Board.goTo(widget.pageId);
                        searchInput.value = ''; // Clear search bar
                        Launcher.Board.state.widgets.forEach(w => w.element.classList.remove('highlight'));
                    }
                }
            );
        }

        registerTool('network', 'right', () => {
            // Initialize and listen for network status changes
            updateNetworkStatus();
            window.addEventListener('online', updateNetworkStatus);
            window.addEventListener('offline', updateNetworkStatus);

        });

        registerTool('clock', 'left', function() {
            setInterval(updateClock, 1000);
            updateClock();
        } );


        notificationBar.addEventListener('mousedown', handleDragStart);
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        notificationList.addEventListener('click', handleNotificationClick);
        if (dashboardContainer) {
            dashboardContainer.addEventListener('click', handleDashboardClick);
        }
    }

    return {
        init: init,
        registerTool: registerTool,
        registerMessageProvider: registerMessageProvider
    };
})();

