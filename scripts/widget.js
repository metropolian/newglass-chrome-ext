class Widget {
    constructor({
        id, type = 'app', name = 'Widget', description = '', target = '#', image = '',
        colSpan = 1, rowSpan = 1, contentHTML = '', pageId = 0, gridRowStart = 1, gridColumnStart = 1,
        backgroundColor = null, backgroundImage = null, onAttach = null,
    }) {
        this.id = id || `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.type = type; this.name = name; this.description = description; this.target = target;
        this.image = image; this.colSpan = parseInt(colSpan, 10); this.rowSpan = parseInt(rowSpan, 10);
        this.contentHTML = contentHTML; this.pageId = pageId; this.gridRowStart = parseInt(gridRowStart, 10);
        this.gridColumnStart = parseInt(gridColumnStart, 10);
        this.backgroundColor = backgroundColor;
        this.backgroundImage = backgroundImage;
        
        this.createElement();
        this.addEventListeners();
        this.onAttach = onAttach;
    }

    createElement() {
        const widgetEl = Launcher.newElement('div', `widget widget-${this.type} widget-id-${this.id}`);
        widgetEl.dataset.widgetId = this.id;
        widgetEl.draggable = true;
        if (this.backgroundImage) {
            widgetEl.style.backgroundImage = `url('${this.backgroundImage}')`;
            widgetEl.style.backgroundSize = 'cover';
            widgetEl.style.backgroundPosition = 'center';
            widgetEl.style.color = 'white';
        } else if (this.backgroundColor) {
            widgetEl.style.backgroundColor = this.backgroundColor;
        }

        let content = '';
        if (this.type === 'custom') {
            if (this.id === 'about-me') widgetEl.classList.add('widget-about-me');
            content = this.contentHTML;
        } else {
            widgetEl.classList.add('widget-app');
            content = `
                ${this.image ? `<img src="${this.image}" alt="${this.name}" class="app-icon">` : '<div class="app-icon-placeholder"></div>'}
                <div class="app-name">${this.name}</div>
                ${this.description ? `<div class="app-description">${this.description}</div>` : ''}
            `;
        }
        widgetEl.innerHTML = content;
        
        // This line is the critical fix.
        this.element = widgetEl;
        
        this.updatePosition();

    }
    
    attach(pageElement) {
        if (this.element && pageElement) {
            pageElement.appendChild(this.element);
            if (typeof this.onAttach === 'function') {
                this.onAttach(this.element);
            }
        }
    }

    detach() {
        if (this.element && this.element.parentElement) {
            this.element.remove();
        }
    }

    render() {
        this.updatePosition();
    }

    updatePosition() {
        if (!this.element) return;
        this.element.style.gridColumnStart = this.gridColumnStart;
        this.element.style.gridColumnEnd = `span ${this.colSpan}`;
        this.element.style.gridRowStart = this.gridRowStart;
        this.element.style.gridRowEnd = `span ${this.rowSpan}`;
    }

    addEventListeners() {
        this.element.addEventListener('click', () => {
            Launcher.Board.state.currentContextMenuWidget = this; 
            if (this.element.classList.contains('dragging') || document.getElementById('contextMenu').style.display === 'block') {
                return;
            }
            if (this.type === 'app') {
                this.launch();
            } else if (this.type === 'web') {
                Launcher.showBrowser(this.target);
            } 
        });

        this.element.addEventListener('dragstart', (e) => {
            Launcher.Board.state.draggedWidget = this;
            e.dataTransfer.setData('text/plain', this.id);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => this.element.classList.add('dragging'), 0);
            Launcher.Board.createDropPlaceholder();
        });

        this.element.addEventListener('dragend', () => {
            this.element.classList.remove('dragging');
            Launcher.Board.removeDropPlaceholder();
            Launcher.Board.state.draggedWidget = null;
        });

        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            Launcher.Board.state.currentContextMenuWidget = this;
            showContextMenu(e.clientX, e.clientY, this);
        });
    }

    launch() {
        Launcher.start(this.target);
    }

    remove() {
        this.detach();
        Launcher.Board.state.widgets = Launcher.Board.state.widgets.filter(w => w.id !== this.id);
        const pageInfo = Launcher.Board.state.pages.find(p => p.id === this.pageId);
        if (pageInfo) Launcher.Board.clearWidgetFromGridState(pageInfo, this);
        Launcher.Board.saveState();
    }
}