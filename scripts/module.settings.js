var Launcher = Launcher || {};
Launcher.Modules = Launcher.Modules || {};
Launcher.Modules.Settings = (function() {

    /**
     * Registers this module as a notification provider once the DOM is ready.
     */
    function init() {

        Launcher.NotificationBar.registerTool('settings', 'right', '⚙️', function(element) {

            element.addEventListener('click', (e) => {

                try
                {
                    const inputs = {
                        name: { type: 'text', label: 'Name', value: '', required: true },
                        age: { type: 'number', label: 'Age', value: 30, required: true },
                        email: { type: 'email', label: 'Email', value: '', required: true },
                        birth: { type: 'date', label: 'Birth Date', value: new Date(2000, 0, 1) },
                        meeting: { type: 'datetime', label: 'Meeting', value: new Date(), required: true }
                    };

                    Launcher.Dialogs.showModalDialog('User Form', 'Fill all required fields', inputs, function (res) {
                        console.log('Form result:', res);
                    });

                } catch(e) {
                    console.log(e);
                }
            });

        });

    }

    return {
        init: init
    };

})();

