var Launcher = Launcher || {};
Launcher.Modules = Launcher.Modules || {};
Launcher.Modules.Tester = (function() {
    
    function init() {

        document.getElementById('settings').addEventListener('click', () => {
            
            try
            {
                const inputs = {
                    name: { type: 'text', label: 'Name', value: '', required: true },
                    age: { type: 'number', label: 'Age', value: 30, required: true },
                    email: { type: 'email', label: 'Email', value: '', required: true },
                    birth: { type: 'date', label: 'Birth Date', value: new Date(2000, 0, 1) },
                    meeting: { type: 'datetime', label: 'Meeting', value: new Date(), required: true }
                };

                Dialogs.showModalDialog('User Form', 'Fill all required fields', inputs, function (res) {
                    console.log('Form result:', res);
                });

            } catch(e) {
                console.log(e);
            }

        });
    }

    return {
        init: init
    }
    
})();