var Launcher = Launcher || {};
Launcher.Modules = Launcher.Modules || {};
Launcher.Modules.NotificationMessages = (function() {

    /**
     * Fetches the system messages from notify.php.
     * @param {function} callback - The function to call with the results.
     */
    function fetchSystemMessages(callback) {
        if (typeof Launcher.request !== 'function') {
            return callback(new Error('Launcher.request utility is not available.'), null);
        }

        chrome.notifications.getAll(function(notifications) {
            console.log('Fetched notifications:', notifications);
            const messages = Object.keys(notifications).map(id => ({
                id: id,
                title: notifications[id].title || 'Notification',
                message: notifications[id].message || '',
                read: false
            }));
            callback(null, messages);
        });
        
    }

    /**
     * Registers this module as a notification provider once the DOM is ready.
     */
    function init() {

        if (Launcher && Launcher.Modules.NotificationBar) {
            // Correctly pass the ID and the function
            Launcher.Modules.NotificationBar.registerMessageProvider('system-messages', fetchSystemMessages);
        } else {
            console.error('Launcher.NotificationBar module not found.');
        }
    }

    return {
        init: init
    };

})();
