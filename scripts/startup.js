// This module provides all widgets for the dashboard and initializes the desktop.
(function() {

    // --- Dynamic Widget Logic ---
    function handleSearch(widgetEl) {
        const input = widgetEl.querySelector('.search-input');

        widgetEl.addEventListener('click', function(e) {
            e.stopPropagation();            

            input.focus();
        });

        function filterBoard() {
            const searchTerm = input.value.toLowerCase();
            const widgets = Launcher.Board.state.widgets;
            let firstMatch = null;

            widgets.forEach(widget => {
                const isMatch = searchTerm.length > 0 && widget.name.toLowerCase().includes(searchTerm);
                if (isMatch) {
                    widget.element.classList.add('highlight');
                    if (!firstMatch) firstMatch = widget;
                } else {
                    widget.element.classList.remove('highlight');
                }
                
            });
            return firstMatch;
        }

        input.addEventListener('input', filterBoard);
        input.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const firstMatch = filterBoard();
                if (firstMatch) Launcher.Board.goTo(firstMatch.pageId);
            }
        });
    }

    

    function handleWeather(widgetEl) {
        const tempEl = widgetEl.querySelector('.temp');
        const condEl = widgetEl.querySelector('.condition');
        
        /*
        Launcher.request('GET', 'data/weather.php', {}, (err, data) => {
            if (err || !data) {
                condEl.textContent = 'Error';
                return;
            }
            tempEl.innerHTML = `${data.temperature}&deg;C`;
            condEl.textContent = data.condition;
        });
        */
    }

    async function getBackgroundUrls() {
        try {
            const response = await fetch('https://www.bing.com/hp/api/v1/imagegallery');
            if (!response.ok) throw new Error('Fetch failed');
            
            const html = await response.text();            
            // Extract all src attributes from <img> tags
            const matches = html.matchAll(/<img[^>]+src=["'](.*?)["']/gi);
            const urls = [];
            
            for (const match of matches) {
                let src = match[1];
                if (!src.startsWith('http')) {
                    src = 'https://www.bing.com' + src;
                }
                urls.push(src);
            }
            
            if (urls.length === 0) throw new Error('No images found');
            
            // Return first high-quality background (usually the main wallpaper)
            return urls;
        } catch (err) {
            console.error(err);
            return null;
        }
    }    

    // --- Wallpaper Changer ---
    function initWallpaperChanger() {
        let wallpapers = [];
        let currentIndex = 0;

        Launcher.Desktop.init();

        getBackgroundUrls().then((bgUrl) => {
            wallpapers = Array.isArray(bgUrl) ? bgUrl : [bgUrl];

            //Launcher.Desktop.change(wallpapers[currentIndex]);
            
            setInterval(() => {
                currentIndex = Math.floor(Math.random() * wallpapers.length);
                Launcher.Desktop.change(wallpapers[currentIndex]);
            }, 30000);

        });
    }

    
    function getFaviconUrl(url) {
        return url && url.startsWith('http') 
            ? 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(new URL(url).hostname) + '&sz=64'
            : 'images/icons/default_favicon.png';
    }

    // --- Widget Provider ---
    /*
        {
            "id": "app-facebook",
            "name": "Facebook",
            "description": "Connect with friends and the world.",
            "target": "https://www.facebook.com/",
            "image": "images/icons/Facebook.png",
            "type": "app"
        }
    */
    async function chromeGetRecentlyClosed(maxResults) {
        if (!maxResults)
            maxResults = chrome.sessions.MAX_SESSION_RESULTS;
        return new Promise((resolve) => {
            chrome.sessions.getRecentlyClosed({ maxResults: maxResults }, (sessions) => {
                const tabs = sessions.filter(s => s.tab).map(s => s.tab);
                resolve(tabs);
            });
        });
    }

    function flattenBookmarkTree(bookmarkNodes, depth = 2) {
        const result = [];
    
        function traverse(nodes, currentDepth) {
            if (!nodes || !Array.isArray(nodes)) return;            
            for (const node of nodes) {
                // Add the current node to results
                result.push({
                    id: node.id,
                    title: node.title,
                    url: node.url,
                    parentId: node.parentId,
                    index: node.index,
                    dateAdded: node.dateAdded,
                    dateGroupModified: node.dateGroupModified,
                    depth: currentDepth
                });
                
                // Only recurse if we haven't reached the target depth
                if (currentDepth < depth && node.children) {
                    traverse(node.children, currentDepth + 1);
                }
            }
        }
        
        traverse(bookmarkNodes, 0);
        return result;
    }


    async function chromeGetBookmarks() {       
        const bookmarks = await chrome.bookmarks.getTree();
        console.log('bookmarks:', bookmarks);
        const results = flattenBookmarkTree(bookmarks);
        return results
            .filter(b => b.url)
            .map(b => ({
                id: `bookmark-${b.id}`,
                name: b.title,
                type: 'app',
                target: b.url,
                image: getFaviconUrl(b.url)
            }));    
    }

    async function fetchAllWidgets(callback) {
        let allWidgets = [
            { "id": "google-search", "type": "custom", "colSpan": 3, "rowSpan": 1, "contentHTML": `<div class="search-widget"><svg class="google-icon" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22.46 12.312c0-.81-.07-1.62-.205-2.406H12v4.56h5.84a5.012 5.012 0 0 1-2.18 3.312v2.938h3.78c2.21-2.031 3.48-5.156 3.48-8.406z"></path><path d="M12 22.5c3.24 0 5.955-1.08 7.94-2.906l-3.78-2.937c-1.08.72-2.46 1.156-4.16 1.156-3.18 0-5.88-2.156-6.84-5.062H1.26v3.03C3.18 20.312 7.23 22.5 12 22.5z"></path><path d="M5.16 13.562a7.033 7.033 0 0 1 0-4.124v-3.03H1.26a11.21 11.21 0 0 0 0 10.183l3.9-3.03z"></path><path d="M12 5.156c1.77 0 3.345.615 4.59 1.844l3.36-3.36C17.955 1.95 15.24 0 12 0 7.23 0 3.18 2.187 1.26 5.594l3.9 3.03c.96-2.906 3.66-5.062 6.84-5.062z"></path></svg><input type="search" class="search-input" placeholder="Search Apps..."></div>`, "onAttach": handleSearch },
            { "id": "weather-widget", "type": "custom", "colSpan": 1, "rowSpan": 1, "contentHTML": "<div class='weather-widget'><div class='temp'>--°C</div><div class='condition'>Loading...</div></div>", "onAttach": handleWeather }
        ];

        const bookmarks = await chromeGetBookmarks();
        console.log('bookmarks:', bookmarks);
        allWidgets = allWidgets.concat( bookmarks );

        const recentTabs = await chromeGetRecentlyClosed();
        recentTabs.forEach((tab, index) => {
            allWidgets.push({
                "id": `recent-tab-${index}`,
                "name": tab.title || tab.url,
                "type": "app",
                "target": tab.url,
                "image": "" + tab.favIconUrl || "images/icons/default_favicon.png"
            });
        });


        console.log('allWidgets:', allWidgets);                
        callback(null, allWidgets);
    }

    // --- Initialization ---
    function init() {

        Launcher.NotificationBar.init();
        Launcher.Board.registerWidgetProvider(fetchAllWidgets);        

        Launcher.startup((settings) => {
            if (Launcher && Launcher.Board) {
                // Load initial widgets after settings are loaded
                Launcher.Board.init(settings);
            } else {
                console.error('Launcher.Board module not found for startup widgets.');
            }
            initWallpaperChanger();
        });

    }

    document.addEventListener('DOMContentLoaded', init);

})();
