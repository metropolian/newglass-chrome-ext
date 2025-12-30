/**
 * system.js
 * 
 * This module provides core system functions for the Launcher application,
 */
var Launcher = Launcher || {};

Launcher.settings = {}; // Cache for settings
Launcher.Modules = {}; // Namespace for modules
Launcher.Desktop = {}; // Namespace for desktop functions
Launcher.Inputs = {}; // Namespace for input management
Launcher.ContextMenu = {}; // Namespace for context menu management

// --- Event Management System ---
Launcher.events = {};
Launcher.addEventListener = function(eventName, callback) {
    console.log(`Event addListener ${eventName} `);
    if (!Launcher.events[eventName]) Launcher.events[eventName] = [];
    Launcher.events[eventName].push(callback);
};

Launcher.on = Launcher.addEventListener;

Launcher.removeEventListener = function(eventName, callback) {
    if (!Launcher.events[eventName]) return;
    const index = Launcher.events[eventName].indexOf(callback);
    if (index !== -1) {
        Launcher.events[eventName].splice(index, 1);
    }
};

Launcher.off = Launcher.removeEventListener;

/**
 * Triggers an event with the given name and data.    
 */
Launcher.trigger = function(eventName, eventData) {
    console.log(`Event: ${eventName}`, eventData);
    if (Launcher.events[eventName]) {
        Launcher.events[eventName].forEach(callback => callback(eventData));
    }
};

Launcher.invoke = Launcher.trigger;

// --- Dynamic Asset Loading ---

/**
 * Dynamically loads a JavaScript file.
 * @param {string} url - The URL of the script to load.
 */
Launcher.loadScript = function(url) {
    if (document.querySelector(`script[src="${url}"]`)) return; // Don't load if already present
    const script = document.createElement('script');
    script.src = url;
    document.head.appendChild(script);
};

/**
 * Dynamically loads a CSS stylesheet.
 * @param {string} url - The URL of the stylesheet to load.
 */
Launcher.loadStyle = function(url) {
    if (document.querySelector(`link[href="${url}"]`)) return; // Don't load if already present
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
};


// --- Settings Management ---
/**
 * Saves the current settings to localStorage and the server.
 */
Launcher.saveSettings = function() {
    localStorage.setItem('launcher-settings', JSON.stringify(Launcher.settings));
    /*Launcher.request('POST', 'data/settings.php', { data: Launcher.settings }, (err, result) => {
        if (err) {
            Launcher.showToast('Could not save settings to server.', 'error');
        } else {
            Launcher.showToast('Settings saved.', 'success');
        }
    });*/
};

/**
 * Loads settings from localStorage and/or a server.
 * @param {function} callback - Function to call after settings are loaded.
 */
Launcher.loadSettings = function(callback) {
    // 1. Load from localStorage first for speed
    const localSettings = localStorage.getItem('launcher-settings');
    if (localSettings) {
        try {
            Launcher.settings = JSON.parse(localSettings);
        } catch (e) {
            console.error("Failed to parse local settings.", e);
        }
    }

    // 2. Final callback
    if (typeof callback === 'function') {
        callback(Launcher.settings);
    }
};

// --- Elemental System Functions ---
function createElement(elementName, className, innerHTML, settings) {
    function applySettings(el, settings) {
        for (const key in settings) {
            if (typeof settings[key] === 'object' && key in el) {
                applySettings(el[key], settings[key]);
            } else {
                el[key] = settings[key];
            }
        }
    }

    const element = document.createElement(elementName);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    if (settings && typeof settings === 'object') {
        applySettings(element, settings);
    }
    return element;
};

Launcher.createElement = createElement
Launcher.newElement = createElement

// --- Other System Functions ---
Launcher.request = function(method, url, options, callback) {
    const xhr = new XMLHttpRequest();
    const data = options.data || null;
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (options.headers) {
        for (const header in options.headers) {
            xhr.setRequestHeader(header, options.headers[header]);
        }
    }
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                callback(null, JSON.parse(xhr.responseText));
            } catch (e) {
                callback(new Error('Failed to parse JSON response'), null);
            }
        } else {
            callback(new Error(`Request failed with status ${xhr.status}`), null);
        }
    };
    xhr.onerror = () => callback(new Error('Network error'), null);
    xhr.send(data ? JSON.stringify(data) : null);
};

// Input Functions
Launcher.Inputs.hotkeys = {};

Launcher.Inputs.init = function() {
    console.log('Initializing input management...');

    document.addEventListener('keydown', (e) => {
        Launcher.trigger('keydown', e);
    });

    document.addEventListener('keyup', (e) => {
        if (Launcher.Inputs.isCombinationPressed(keyCombination, e)) {
            const callback = Launcher.Inputs.hotkeys[keyCombination];
            if (callback(e))
                return true;
        }

        Launcher.trigger('keyup', e);
    }); 

    document.addEventListener('mousedown', (e) => {
        Launcher.trigger('mousedown', e);
    });

    document.addEventListener('mouseup', (e) => {
        Launcher.trigger('mouseup', e);
    });

    document.addEventListener('click', (e) => {
        Launcher.trigger('click', e);
    });
    
};

Launcher.Inputs.registerHotkey = function(keyCombination, callback) {
    if (typeof callback !== 'function') {
        console.error('registerHotkey callback must be a function.');
        return;
    }
    Launcher.Inputs.hotkeys[keyCombination] = callback;        
};

Launcher.Inputs.isCombinationPressed = function(keyCombination, event) {
    const keys = keyCombination.toLowerCase().split('+').map(k => k.trim());
    const keyPressed = event.key.toLowerCase();
    const ctrl = keys.includes('ctrl') ? event.ctrlKey : true;
    const alt = keys.includes('alt') ? event.altKey : true;
    const shift = keys.includes('shift') ? event.shiftKey : true;
    const keyMatch = keys.includes(keyPressed);
    return ctrl && alt && shift && keyMatch;
};

Launcher.Inputs.unregisterHotkey = function(keyCombination) {
    delete Launcher.Inputs.hotkeys[keyCombination];
};


// GUI Functions    
Launcher.Desktop.init = function() {
    const lastBg = Launcher.Desktop.getLastBackground();
    if (lastBg) {
        Launcher.Desktop.change(lastBg);
    }
};

Launcher.Desktop.change = function(url) {
    document.body.style.backgroundImage = `url('${url}')`;
    localStorage.setItem('launcher-desktop-bg', url);
};

Launcher.Desktop.getLastBackground = function() {
    return localStorage.getItem('launcher-desktop-bg');
};



Launcher.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = Launcher.newElement('div', `toast ${type}`, message);
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
};

Launcher.start = function(url, blank) {
    if (!url || url === '#') {
        Launcher.showToast('No URL to open.', 'error');
        return;
    }
    window.open(url, blank ? '_blank' : '_self');
    Launcher.trigger('launch', url);
};

function showModal(options) {
    const overlay = document.getElementById('modal-overlay');
    const contentEl = document.getElementById('modal-content');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const footerEl = document.getElementById('modal-footer');
    contentEl.style.width = options.width || '';
    contentEl.style.height = options.height || '';
    contentEl.style.maxWidth = options.maxWidth || '';
    contentEl.className = options.className || 'modal-content-dialog';
    titleEl.style.display = options.title ? 'block' : 'none';
    titleEl.textContent = options.title || '';
    messageEl.innerHTML = options.messageHTML || '';
    footerEl.innerHTML = options.footerHTML || '';
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('visible'), 10);
    
    Launcher.trigger('modalShown', options.title);
    return { overlay, contentEl, titleEl, messageEl, footerEl };
}

function hideModal(overlay) {
    overlay.classList.remove('visible');
    setTimeout(() => {
        overlay.classList.add('hidden');
        const contentEl = document.getElementById('modal-content');
        contentEl.style.width = '';
        contentEl.style.height = '';
        contentEl.style.maxWidth = '';
        Launcher.trigger('modalHidden', contentEl);

    }, 500);
}

Launcher.showMessage = function(text, title, callback) {
    const { overlay } = showModal({
        title: title || 'Message',
        messageHTML: `<p>${text}</p>`,
        footerHTML: '<button id="modal-ok" class="primary">OK</button>'
    });
    document.getElementById('modal-ok').onclick = function() {
        hideModal(overlay);
        if (typeof callback === 'function') callback();
    };
};

Launcher.showDialog = function(text, callback) {
    const { overlay } = showModal({
        title: 'Confirmation',
        messageHTML: `<p>${text}</p>`,
        footerHTML: `<button id="modal-cancel">Cancel</button><button id="modal-ok" class="primary">OK</button>`
    });
    const close = (result) => {
        hideModal(overlay);
        if (typeof callback === 'function') callback(result);
    };
    document.getElementById('modal-ok').onclick = () => close(true);
    document.getElementById('modal-cancel').onclick = () => close(false);
};

Launcher.showBrowser = function(url) {
    const { overlay, contentEl, messageEl } = showModal({
        className: 'modal-content-iframe',
        width: '1280px',
        maxWidth: '95vw',
        height: '90vh',
        messageHTML: ''
    });
    const iframe = Launcher.newElement('iframe');
    iframe.src = url;
    iframe.frameBorder = '0';
    messageEl.appendChild(iframe);
    const closeButton = Launcher.newElement('button', 'modal-close-btn', '&times;');
    contentEl.appendChild(closeButton);
    const resizers = [];
    ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(pos => {
        const resizer = Launcher.newElement('div', `resizer ${pos}`);
        contentEl.appendChild(resizer);
        resizers.push(resizer);
    });
    let original_width = 0, original_height = 0, original_x = 0, original_y = 0;
    const resize = (e) => {
        contentEl.style.width = (original_width + (e.pageX - original_x)) + 'px';
        contentEl.style.height = (original_height + (e.pageY - original_y)) + 'px';
    };
    const stopResize = () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResize);
    };
    resizers.forEach(resizer => {
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            original_width = parseFloat(getComputedStyle(contentEl, null).getPropertyValue('width').replace('px', ''));
            original_height = parseFloat(getComputedStyle(contentEl, null).getPropertyValue('height').replace('px', ''));
            original_x = e.pageX;
            original_y = e.pageY;
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResize);
        });
    });
    const close = () => {
        iframe.src = 'about:blank';
        hideModal(overlay);
        setTimeout(() => {
            closeButton.remove();
            resizers.forEach(r => r.remove());
        }, 500);
    };
    closeButton.onclick = close;
};

Launcher.showContentModal = function(title, contentHTML) {
    const { overlay } = showModal({
        title: title,
        messageHTML: contentHTML,
        footerHTML: '<button id="modal-ok" class="primary">Close</button>'
    });
    document.getElementById('modal-ok').onclick = () => hideModal(overlay);
};


Launcher.ContextMenu.init = function(settings) {
    console.log('Initializing context menus...');
    Launcher.ContextMenu.menus = {};
    Launcher.ContextMenu.currentContextMenu = null;
    Launcher.ContextMenu.currentContextMenuData = null;

    const menus = document.querySelectorAll('.context-menu');
    menus.forEach(menu => {
        const menuitems = menu.querySelectorAll('.context-menu [data-action]');

        Launcher.ContextMenu.registerMenu(menu.id);
        menuitems.forEach(item => {
            const action = item.dataset.action;
            Launcher.ContextMenu.registerMenuItem(menu.id, action, item);
        });

        console.log(`Registered context menu: ${menu.id} with ${menuitems.length} items.`);
    });

    Launcher.trigger('ContextMenuInit', settings);
};

Launcher.ContextMenu.registerMenu = function(menuId) {
    const contextMenuElement = document.getElementById(menuId);
    if (!contextMenuElement) {
        console.error(`ContextMenu.registerMenu ID "${menuId}" not found.`);
        return;    
    }
    contextMenuElement.dataset.menuId = menuId;    
    contextMenuElement.classList.add(`context-menu-${menuId}`);

    /*const menu = Launcher.newElement('div', `context-menu context-menu-${menuId}`);
    menu.dataset.menuId = menuId;
    contextMenuElement.appendChild(menu); */
    Launcher.ContextMenu.menus[menuId] = {};
};

Launcher.ContextMenu.registerMenuItem = function(menuId, action, element) {
    if (element) {
        element.addEventListener('click', () => {
            Launcher.ContextMenu.executeAction(action, element);
        });

        Launcher.ContextMenu.menus[menuId][action] = element;
        Launcher.ContextMenu.hide(menuId);
    }
};

Launcher.ContextMenu.unregisterMenuItem = function(menuId, action) {
    const menu = Launcher.ContextMenu.menus[menuId];
    if (menu && menu[action]) {
        menu[action].remove();        
        delete menu[action];
    }
};

Launcher.ContextMenu.registerMenuAction = function(menuId, actionId, actionFunction) {
    const menu = Launcher.ContextMenu.menus[menuId];
    if (menu) {
        menu[actionId] = actionFunction;
    }
};

Launcher.ContextMenu.executeAction = function(actionId, element, data) {
    const menuId = Launcher.ContextMenu.currentContextMenu;

    const menu = Launcher.ContextMenu.menus[menuId];
    if (menu && menu[actionId] && typeof menu[actionId] === 'function') {
        menu[actionId](element, data || Launcher.ContextMenu.currentContextMenuData);
    }   
    
    Launcher.trigger('executeAction', { actionId, element, data});
};

Launcher.ContextMenu.show = function(menuId, x, y, data) {
    const el = document.getElementById(menuId);
    if (!el) { 
        console.error(`ContextMenu.show ID "${menuId}" not found.`);
        return;
    }

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.display = 'block';
    Launcher.ContextMenu.currentContextMenu = menuId;
    Launcher.ContextMenu.currentContextMenuData = data;
};

Launcher.ContextMenu.hide = function(menuId) {
    if (!menuId && Launcher.ContextMenu.currentContextMenu) {
        menuId = Launcher.ContextMenu.currentContextMenu;
    }

    const el = document.getElementById(menuId);
    if (!el) { 
        console.error(`ContextMenu.hide ID "${menuId}" not found.`);
        return;
    }

    if (el.style.display === 'block') {
        el.style.display = 'none';
        Launcher.ContextMenu.currentContextMenu = null;
        Launcher.ContextMenu.currentContextMenuData = null;
    } 
};



// --- Autocomplete System ---
/**
 * Attaches a keyboard-navigable autocomplete list to a text input element.
 * @param {HTMLInputElement} inputEl - The input element to attach to.
 * @param {function} onInput - A callback function(term, showSuggestions) that provides suggestions.
 * @param {function} onSelect - A callback function(selectedValue) that runs when a user selects an item.
 */
Launcher.attachAutocomplete = function(inputEl, onInput, onSelect) {
    let currentFocus;
    const list = Launcher.newElement('div', 'autocomplete-list');
    inputEl.parentNode.appendChild(list);

    const showSuggestions = (suggestions) => {
        list.innerHTML = "";
        if (!suggestions || suggestions.length === 0) {
            list.classList.remove('active');
            return;
        }
        suggestions.forEach(itemText => {
            const item = Launcher.newElement('div', 'autocomplete-item', itemText);
            item.addEventListener('click', function() {
                inputEl.value = this.innerText;
                closeList();
                onSelect(this.innerText);
            });
            list.appendChild(item);
        });
        list.classList.add('active');
        currentFocus = -1;
    };

    inputEl.addEventListener('input', function() {
        onInput(this.value, showSuggestions);
    });

    inputEl.addEventListener('keydown', function(e) {
        const items = list.getElementsByTagName('div');
        if (!items.length) {
            if (e.keyCode === 13) { // Enter
                 onSelect(this.value);
            }
            return;
        };

        if (e.keyCode === 40) { // Arrow DOWN
            currentFocus++;
            addActive(items);
        } else if (e.keyCode === 38) { // Arrow UP
            currentFocus--;
            addActive(items);
        } else if (e.keyCode === 13) { // Enter
            e.preventDefault();
            if (currentFocus > -1) {
                // Set the input value from the highlighted item before calling onSelect
                const selectedValue = items[currentFocus].innerText;
                inputEl.value = selectedValue;
                closeList();
                onSelect(selectedValue);
            } else {
                onSelect(this.value);
            }
        }
    });

    function addActive(items) {
        if (!items) return false;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (items.length - 1);
        items[currentFocus].classList.add('autocomplete-active');
    }

    function removeActive(items) {
        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove('autocomplete-active');
        }
    }

    function closeList() {
        list.innerHTML = "";
        list.classList.remove('active');
    }

    document.addEventListener('click', (e) => {
        if (e.target !== inputEl) {
            closeList();
        }
    });
};




/**
 * The main entry point for the application. Loads settings then starts the app.
 * @param {function} callback - The main application function to run after setup.
 */
Launcher.startup = function(callback) {
    Launcher.trigger('startup');

    Launcher.loadSettings((settings) => {
        Launcher.Desktop.init(settings);
        Launcher.ContextMenu.init(settings);

        for (const moduleId in Launcher.Modules) {
            const module = Launcher.Modules[moduleId];

            try {
                console.log(`Initializing module: ${moduleId}`);
                if (typeof module.init === 'function') {
                    module.init(settings);
                    Launcher.trigger('moduleInitialized', { moduleId, module });
                }
            } catch (e) {
                console.error(`Error initializing module: ${moduleId}`, e);
            }
        }

        if (typeof callback === 'function') {
            callback(settings);            
        }

        Launcher.trigger('initialized');
    });
};