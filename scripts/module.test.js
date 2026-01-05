var Launcher = Launcher || {};
Launcher.Modules = Launcher.Modules || {};
Launcher.Modules.Tester = (function() {
    
    function init() {


        Launcher.NotificationBar.registerTool('about', 'right', 'About', (element) => {        

            element.addEventListener('click', (e) => {

                Launcher.showMessage("About me", "About title", (ok) => {

                });
                
            });

        });
    }

    return {
        init: init
    }
    
})();