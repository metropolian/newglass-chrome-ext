// This module provides notifications from the notify.php file.
(function() {

    /**
     * Fetches the system messages from notify.php.
     * @param {function} callback - The function to call with the results.
     */
    function fetchSystemMessages(callback) {
        if (typeof Launcher.request !== 'function') {
            return callback(new Error('Launcher.request utility is not available.'), null);
        }

        /*
        Launcher.request('GET', 'data/notify.php', {}, function(error, data) {
            if (error) {
                callback(error, null);
            } else {
                callback(null, data);
            }
        });
        */
    }

    /**
     * Registers this module as a notification provider once the DOM is ready.
     */
    function register() {
        if (Launcher && Launcher.NotificationBar) {
            // Correctly pass the ID and the function
            Launcher.NotificationBar.registerProvider('system-messages', fetchSystemMessages);
        } else {
            console.error('Launcher.NotificationBar module not found.');
        }
    }

    document.addEventListener('DOMContentLoaded', register);

})();
