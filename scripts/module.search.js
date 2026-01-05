var Launcher = Launcher || {};
Launcher.Modules = Launcher.Modules || {};
Launcher.Modules.Search = Launcher.Search = (function() {

    function init(settings) {
        Launcher.NotificationBar.registerTool('global-search', 'center', 
            '<div class="bar-search">' +
                '<input type="search" id="global-search-input" placeholder="Search Apps...">' +
            '</div>', (element) => {
                
            const searchInput = document.getElementById("global-search-input");

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

            return element;

        });
        
    }

    return {
        init: init
    };
})();