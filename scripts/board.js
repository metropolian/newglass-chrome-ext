var Launcher = Launcher || {};

// --- Board Module ---
Launcher.Board = (function() {
    const contextMenuId = 'contextMenu';

    // --- Module-level State ---
    let state = {
        widgets: [],
        pages: [],
        actions: {},
        draggedWidget: null,
        dropPlaceholder: null,
        currentContextMenuWidget: null,
        widgetProviders: [],
        currentPageIndex: 0
    };

    const GRID_COLS = 5;
    const GRID_ROWS = 5;

    // --- Page Navigation Functions ---
    function goTo(index) {
        const pagesContainer = document.getElementById('pagesContainer');
        if (!pagesContainer) return;

        // Clamp the index to be within the valid range
        const newIndex = Math.max(0, Math.min(index, state.pages.length - 1));
        
        const pageElement = state.pages[newIndex].element;
        if (pageElement) {
            pagesContainer.scrollTo({
                left: pageElement.offsetLeft,
                behavior: 'smooth'
            });
            state.currentPageIndex = newIndex;
        }
    }

    function goToLeft() {
        goTo(state.currentPageIndex - 1);
    }

    function goToRight() {
        goTo(state.currentPageIndex + 1);
    }

    // --- Grid Management Functions ---
    function createPage(pageIndex) {
        const pagesContainer = document.getElementById('pagesContainer');
        const pageElement = Launcher.newElement('div', 'page');
        pageElement.id = `page-${pageIndex}`;
        pageElement.dataset.pageId = pageIndex;
        pagesContainer.appendChild(pageElement);
        const pageInfo = { id: pageIndex, element: pageElement, gridState: createGridState() };
        state.pages.push(pageInfo);
        addDragAndDropListenersToPage(pageInfo);
        return pageInfo;
    }

    function createGridState() {
        return Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
    }

    function updateGridStateForWidget(pageInfo, widget, action = 'add') {
        for (let r = 0; r < widget.rowSpan; r++) {
            for (let c = 0; c < widget.colSpan; c++) {
                const row = widget.gridRowStart - 1 + r;
                const col = widget.gridColumnStart - 1 + c;
                if (row < GRID_ROWS && col < GRID_COLS) {
                    pageInfo.gridState[row][col] = action === 'add' ? widget.id : null;
                }
            }
        }
    }

    function clearWidgetFromGridState(pageInfo, widget) {
        updateGridStateForWidget(pageInfo, widget, 'remove');
    }

    function findNextAvailableSlot(pageInfo, colSpan, rowSpan) {
        for (let r = 0; r <= GRID_ROWS - rowSpan; r++) {
            for (let c = 0; c <= GRID_COLS - colSpan; c++) {
                if (isSpaceAvailable(pageInfo, r + 1, c + 1, colSpan, rowSpan)) {
                    return { gridRowStart: r + 1, gridColumnStart: c + 1 };
                }
            }
        }
        return null;
    }

    function isSpaceAvailable(pageInfo, targetRow, targetCol, colSpan, rowSpan, ignoreWidgetId = null) {
        if (!pageInfo || !pageInfo.gridState) return false;
        for (let r = 0; r < rowSpan; r++) {
            for (let c = 0; c < colSpan; c++) {
                const R = targetRow - 1 + r;
                const C = targetCol - 1 + c;
                if (R >= GRID_ROWS || C >= GRID_COLS) return false;
                const cellContent = pageInfo.gridState[R][C];
                if (cellContent !== null && cellContent !== ignoreWidgetId) return false;
            }
        }
        return true;
    }

    function getWidgetAtPosition(pageInfo, row, col) {
        if (!pageInfo.gridState || row - 1 < 0 || row - 1 >= GRID_ROWS || col - 1 < 0 || col - 1 >= GRID_COLS) return null;
        const widgetId = pageInfo.gridState[row - 1][col - 1];
        return state.widgets.find(w => w.id === widgetId);
    }

    function createDropPlaceholder() {
        if (!state.dropPlaceholder) {
            state.dropPlaceholder = Launcher.newElement('div', 'widget drop-placeholder');
        }
        state.dropPlaceholder.style.gridColumnStart = state.draggedWidget.gridColumnStart;
        state.dropPlaceholder.style.gridColumnEnd = `span ${state.draggedWidget.colSpan}`;
        state.dropPlaceholder.style.gridRowStart = state.draggedWidget.gridRowStart;
        state.dropPlaceholder.style.gridRowEnd = `span ${state.draggedWidget.rowSpan}`;
    }

    function updateDropPlaceholderPosition(pageElement, row, col) {
        if (!state.dropPlaceholder) return;
        state.dropPlaceholder.style.gridRowStart = row;
        state.dropPlaceholder.style.gridColumnStart = col;
        state.dropPlaceholder.style.gridRowEnd = `span ${state.draggedWidget.rowSpan}`;
        state.dropPlaceholder.style.gridColumnEnd = `span ${state.draggedWidget.colSpan}`;
        if (!state.dropPlaceholder.parentElement) pageElement.appendChild(state.dropPlaceholder);
    }

    function removeDropPlaceholder() {
        if (state.dropPlaceholder && state.dropPlaceholder.parentElement) state.dropPlaceholder.remove();
    }

    function addDragAndDropListenersToPage(pageInfo) {
        const pageElement = pageInfo.element;
        pageElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (!state.draggedWidget) return;
            if (state.dropPlaceholder && state.dropPlaceholder.parentElement !== pageElement) {
                pageElement.appendChild(state.dropPlaceholder);
            }
            const rect = pageElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cellWidth = rect.width / GRID_COLS;
            const cellHeight = rect.height / GRID_ROWS;
            let targetCol = Math.max(1, Math.min(Math.floor(x / cellWidth) + 1, GRID_COLS - state.draggedWidget.colSpan + 1));
            let targetRow = Math.max(1, Math.min(Math.floor(y / cellHeight) + 1, GRID_ROWS - state.draggedWidget.rowSpan + 1));
            updateDropPlaceholderPosition(pageElement, targetRow, targetCol);
        });
        pageElement.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!state.draggedWidget) return;
            removeDropPlaceholder();
            const sourcePageInfo = state.pages.find(p => p.id === state.draggedWidget.pageId);
            const rect = pageElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cellWidth = rect.width / GRID_COLS;
            const cellHeight = rect.height / GRID_ROWS;
            let newCol = Math.max(1, Math.min(Math.floor(x / cellWidth) + 1, GRID_COLS - state.draggedWidget.colSpan + 1));
            let newRow = Math.max(1, Math.min(Math.floor(y / cellHeight) + 1, GRID_ROWS - state.draggedWidget.rowSpan + 1));

            if (isSpaceAvailable(pageInfo, newRow, newCol, state.draggedWidget.colSpan, state.draggedWidget.rowSpan, state.draggedWidget.id)) {
                clearWidgetFromGridState(sourcePageInfo, state.draggedWidget);
                state.draggedWidget.pageId = pageInfo.id;
                state.draggedWidget.gridRowStart = newRow;
                state.draggedWidget.gridColumnStart = newCol;
                state.draggedWidget.attach(pageElement);
                state.draggedWidget.updatePosition();
                updateGridStateForWidget(pageInfo, state.draggedWidget);
                Launcher.showToast(`${state.draggedWidget.name} moved.`, 'success');
                saveState();
                return;
            }
            const targetWidget = getWidgetAtPosition(pageInfo, newRow, newCol);
            if (targetWidget && targetWidget !== state.draggedWidget && targetWidget.colSpan === state.draggedWidget.colSpan && targetWidget.rowSpan === state.draggedWidget.rowSpan) {
                const oldPageId = state.draggedWidget.pageId, oldRow = state.draggedWidget.gridRowStart, oldCol = state.draggedWidget.gridColumnStart;
                const oldPageInfo = state.pages.find(p => p.id === oldPageId);
                clearWidgetFromGridState(oldPageInfo, state.draggedWidget);
                clearWidgetFromGridState(pageInfo, targetWidget);
                targetWidget.pageId = oldPageId;
                targetWidget.gridRowStart = oldRow;
                targetWidget.gridColumnStart = oldCol;
                targetWidget.attach(oldPageInfo.element);
                targetWidget.updatePosition();
                updateGridStateForWidget(oldPageInfo, targetWidget);
                state.draggedWidget.pageId = pageInfo.id;
                state.draggedWidget.gridRowStart = newRow;
                state.draggedWidget.gridColumnStart = newCol;
                state.draggedWidget.attach(pageInfo.element);
                state.draggedWidget.updatePosition();
                updateGridStateForWidget(pageInfo, state.draggedWidget);
                Launcher.showToast(`Swapped ${state.draggedWidget.name} with ${targetWidget.name}.`, 'success');
                saveState();
            } else {
                Launcher.showToast('Cannot place widget here. Widgets must be the same size to swap.', 'error');
            }
        });
    }

    // --- State Management ---
    function saveState() {
        const layout = state.widgets.map(w => ({
            id: w.id, pageId: w.pageId, gridRowStart: w.gridRowStart, gridColumnStart: w.gridColumnStart
        }));
        localStorage.setItem('dashboard-layout', JSON.stringify(layout));
    }

    function loadState() {
        const savedLayout = localStorage.getItem('dashboard-layout');        
        if (!savedLayout) return;
        
        const layout = JSON.parse(savedLayout);        
        const widgetMap = new Map(state.widgets.map(w => [w.id, w]));
        const maxPageId = Math.max(...layout.map(w => w.pageId), 0);
        
        for (let i = 0; i <= maxPageId; i++) {
            if (!state.pages.find(p => p.id === i)) createPage(i);
        }
        state.pages.forEach(p => p.gridState = createGridState());                

        
        layout.forEach(savedWidget => {
            const widget = widgetMap.get(savedWidget.id);
            if (widget) {
                const targetPageInfo = state.pages.find(p => p.id === savedWidget.pageId);
                widget.pageId = savedWidget.pageId;
                widget.gridRowStart = savedWidget.gridRowStart;
                widget.gridColumnStart = savedWidget.gridColumnStart;
                widget.attach(targetPageInfo.element);
                widget.updatePosition();
                if (targetPageInfo) updateGridStateForWidget(targetPageInfo, widget);
            }
        });

        Launcher.showToast('Layout loaded successfully!', 'success');
    }

    // --- Parallax Effect ---
    function initParallax() {
        const pagesContainer = document.getElementById('pagesContainer');
        if (!pagesContainer) return;

        const parallaxIntensity = 20;

        const updateParallax = (e) => {
            const mouseX = e ? e.clientX : window.innerWidth / 2;
            const mouseY = e ? e.clientY : window.innerHeight / 2;
            
            const xPercent = (mouseX / window.innerWidth - 0.5) * 2;
            const yPercent = (mouseY / window.innerHeight - 0.5) * 2;

            const mouseOffsetX = xPercent * parallaxIntensity;
            const mouseOffsetY = yPercent * parallaxIntensity;

            const scrollWidth = pagesContainer.scrollWidth - pagesContainer.clientWidth;
            const scrollPercent = scrollWidth > 0 ? (pagesContainer.scrollLeft / scrollWidth - 0.5) * 2 : 0;

            const scrollOffsetX = scrollPercent * parallaxIntensity;

            const finalX = `calc(50% + ${mouseOffsetX + scrollOffsetX}px)`;
            const finalY = `calc(50% + ${mouseOffsetY}px)`;

            document.body.style.backgroundPosition = `${finalX} ${finalY}`;
        };

        window.addEventListener('mousemove', updateParallax);
        pagesContainer.addEventListener('scroll', updateParallax);
        
        updateParallax(null);
    }
    
    // --- Navigation Event Listeners ---
    function initNavigationListeners() {
        const pagesContainer = document.getElementById('pagesContainer');
        if (!pagesContainer) return;

        // Mouse Wheel Navigation
        let isWheeling = false;
        pagesContainer.addEventListener('wheel', (e) => {
            if (isWheeling) return;
            e.preventDefault();
            
            if (e.deltaY > 0) {
                goToRight();
            } else {
                goToLeft();
            }

            isWheeling = true;
            setTimeout(() => { isWheeling = false; }, 500); // Throttle wheel events
        });

        // Mouse Swipe Navigation
        let isPageSwiping = false;
        let startX = 0;
        let startScrollLeft = 0;

        const swipeMove = (e) => {
            if (!isPageSwiping) return;
            e.preventDefault();
            const x = e.pageX || e.touches[0].pageX;
            const deltaX = x - startX;
            pagesContainer.scrollLeft = startScrollLeft - deltaX;
        };

        const swipeEnd = (e) => {
            if (!isPageSwiping) return;
            isPageSwiping = false;
            
            const x = e.pageX || e.changedTouches[0].pageX;
            const deltaX = x - startX;
            const threshold = pagesContainer.clientWidth / 4;

            if (deltaX < -threshold) {
                goToRight();
            } else if (deltaX > threshold) {
                goToLeft();
            } else {
                goTo(state.currentPageIndex); // Snap back
            }

            window.removeEventListener('mousemove', swipeMove);
            window.removeEventListener('mouseup', swipeEnd);
            window.removeEventListener('touchmove', swipeMove);
            window.removeEventListener('touchend', swipeEnd);
        };

        pagesContainer.addEventListener('mousedown', (e) => {
            // Only start a page swipe if the target is the page itself, not a widget
            if (e.target.classList.contains('page')) {
                isPageSwiping = true;
                startX = e.pageX;
                startScrollLeft = pagesContainer.scrollLeft;
                window.addEventListener('mousemove', swipeMove);
                window.addEventListener('mouseup', swipeEnd);
            }
        });

        pagesContainer.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('page')) {
                isPageSwiping = true;
                startX = e.touches[0].pageX;
                startScrollLeft = pagesContainer.scrollLeft;
                window.addEventListener('touchmove', swipeMove);
                window.addEventListener('touchend', swipeEnd);
            }
        });

        
        Launcher.Inputs.registerHotkey('ArrowLeft', () => {
            goToLeft();
        });
        Launcher.Inputs.registerHotkey('ArrowRight', () => {
            goToRight();
        });
        
    }


    // --- Initialization ---
    function registerWidgetProvider(provider) {
        state.widgetProviders.push(provider);
    }

    function loadWidgets() {
        let currentPageIndex = 0;
        let currentPageInfo = createPage(currentPageIndex);
        function processNextProvider(providerIndex) {
            if (providerIndex >= state.widgetProviders.length) {
                loadState();
                return;
            } 

            const provider = state.widgetProviders[providerIndex];
            provider(function(error, widgetData) {
                if (error) {
                    Launcher.showToast('Could not load widget data from a provider.', 'error');
                } else {
                    try {
                        (widgetData || []).forEach(widgetInfo => {
                            const colSpan = widgetInfo.colSpan || 1;
                            const rowSpan = widgetInfo.rowSpan || 1;

                            let slot = findNextAvailableSlot(currentPageInfo, colSpan, rowSpan);
                            if (!slot) {
                                currentPageIndex++;
                                currentPageInfo = createPage(currentPageIndex);
                                slot = findNextAvailableSlot(currentPageInfo, colSpan, rowSpan);
                            }
                            if (slot) {
                                const fullWidgetInfo = { ...widgetInfo, pageId: currentPageIndex, ...slot };
                                const widget = new Widget(fullWidgetInfo);
                                state.widgets.push(widget);
                                widget.attach(currentPageInfo.element);
                                updateGridStateForWidget(currentPageInfo, widget);
                            }
                        });
                        processNextProvider(providerIndex + 1);

                    } catch (e) {
                        Launcher.showToast('Error processing widget data from a provider.', 'error');
                        console.error(e);
                        processNextProvider(providerIndex + 1);
                    }
                    
                }
            });
        }
        processNextProvider(0);
    }

    function registerWidgetAction(actionId, actionFunction) {
        if (typeof actionFunction !== 'function') {
            console.error(`Action for "${actionId}" must be a function.`);
            return;        
        }
        if (Array.isArray(state.actions[actionId])) {
            state.actions[actionId].push(actionFunction);
        } else {
            state.actions[actionId] = [actionFunction];
        }
    }

    function executeAction(actionId, widget) {
        const actionFunction = state.actions[actionId];
        if (actionFunction) {
            actionFunction(widget);
        }
    }    

    function unregisterWidgetAction(actionId, actionFunction) {
        if (Array.isArray(state.actions[actionId])) {
            state.actions[actionId] = state.actions[actionId].filter(fn => fn !== actionFunction);
        }
    }

    function registerContextMenuAction(actionId, actionFunction) {
        registerWidgetAction(actionId, actionFunction);
    }

    function unregisterContextMenuAction(actionId, actionFunction) {
        unregisterWidgetAction(actionId, actionFunction);
    }

    function showContextMenu(x, y, widget) {        
        Launcher.ContextMenu.show(contextMenuId, x, y, widget);
        state.currentContextMenuWidget = widget;
    }

    function hideContextMenu() {
        Launcher.ContextMenu.hide(contextMenuId);
        state.currentContextMenuWidget = null;
    };    

    function init() {

        loadWidgets();
        initParallax();
        initNavigationListeners(); // Initialize the new navigation listeners
    
        Launcher.ContextMenu.registerMenuAction(contextMenuId, 'launch', (sender, widget) => {
            widget.launch(true);
        });

        Launcher.ContextMenu.registerMenuAction(contextMenuId, 'edit', (sender, widget) => {
            widget.edit();
        });

        Launcher.ContextMenu.registerMenuAction(contextMenuId, 'delete', (sender, widget) => {
            Launcher.showDialog(`Are you sure you want to delete "${widget.name}"?`, (confirmed) => {
                if (confirmed) {
                    widget.remove();
                    Launcher.showToast(`"${widget.name}" was deleted.`, 'success');
                }
            });
        });

        document.addEventListener('click', (e) => {
            Launcher.Board.hideContextMenu();
        });        
    }

    // --- Public API ---
    return {
        state: state,
        init: init,
        registerWidgetProvider: registerWidgetProvider,
        registerWidgetAction: registerWidgetAction,
        showContextMenu: showContextMenu,
        hideContextMenu: hideContextMenu,
        registerContextMenuAction: registerContextMenuAction,
        unregisterContextMenuAction: unregisterContextMenuAction,
        executeAction: executeAction,

        createPage: createPage,
        createGridState: createGridState,
        updateGridStateForWidget: updateGridStateForWidget,
        clearWidgetFromGridState: clearWidgetFromGridState,
        findNextAvailableSlot: findNextAvailableSlot,
        isSpaceAvailable: isSpaceAvailable,
        getWidgetAtPosition: getWidgetAtPosition,
        createDropPlaceholder: createDropPlaceholder,
        updateDropPlaceholderPosition: updateDropPlaceholderPosition,
        removeDropPlaceholder: removeDropPlaceholder,
        saveState: saveState,
        loadState: loadState,        
        goTo: goTo,
        goToLeft: goToLeft,
        goToRight: goToRight
    };

    

})();

Launcher.Modules = Launcher.Modules || {};
Launcher.Modules.Board = Launcher.Board;