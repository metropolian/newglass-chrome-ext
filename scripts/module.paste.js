var Launcher = Launcher || {};
Launcher.Modules = Launcher.Modules || {};
Launcher.Modules.Paste = Launcher.Paste = (function() {

    /**
     * Registers this module as a notification provider once the DOM is ready.
     */
    function init() {

        document.addEventListener('paste', function(e) {
            const items = e.clipboardData.items;
            

            const contents = "";
            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'string') {
                    items[i].getAsString(function(str) {
                        Launcher.showContentModal('Pasted Text', 
                            `<p>You pasted the following text content:</p><textarea style="width:100%;height:200px;">${str}</textarea>`, 'Close');
                    });
                } else if (items[i].kind === 'file') {  
                    const file = items[i].getAsFile();
                    const reader = new FileReader();
                    reader.onload = function(event) {

                        if (!file) return;
                        
                        Launcher.showContentModal('Pasted File', 
                            `<img width="100%" src="${event.target.result}" />`, 'Close');

                    };
                    reader.readAsDataURL(file);
                }
            }
        });

    }

    return {
        init: init
    };

})();

