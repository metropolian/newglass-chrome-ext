class Modal {
    constructor(element, options = {}) {
        this.element = element;
        this.options = Object.assign({
            backdrop: true,
            keyboard: true,
            focus: true
        }, options);
        
        this.isShown = false;
        this.backdrop = null;
        this.scrollbarWidth = 0;
        
        this._bindEvents();
    }
    
    _bindEvents() {
        // Keyboard events
        if (this.options.keyboard) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isShown) {
                    this.hide();
                }
            });
        }
    }
    
    show() {
        if (this.isShown) return;
        
        this.isShown = true;
        
        // Hide scrollbar and store width
        this.scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = this.scrollbarWidth + 'px';
        
        // Show backdrop
        if (this.options.backdrop) {
            this._showBackdrop();
        }
        
        // Show modal
        this.element.style.display = 'block';
        this.element.setAttribute('aria-modal', 'true');
        this.element.setAttribute('role', 'dialog');
        this.element.removeAttribute('aria-hidden');
        
        // Trigger show event
        this._triggerEvent('show.bs.modal');
        
        // Add show class with slight delay for fade animation
        setTimeout(() => {
            this.element.classList.add('show');
            
            // Focus on modal
            if (this.options.focus) {
                this.element.focus();
            }
            
            // Trigger shown event after transition
            setTimeout(() => {
                this._triggerEvent('shown.bs.modal');
            }, 300);
        }, 10);
    }
    
    hide() {
        if (!this.isShown) return;
        
        this.isShown = false;
        
        // Trigger hide event
        this._triggerEvent('hide.bs.modal');
        
        // Remove show class for fade animation
        this.element.classList.remove('show');
        
        // Hide backdrop
        if (this.backdrop) {
            this.backdrop.classList.remove('show');
        }
        
        // Wait for transition to complete
        setTimeout(() => {
            this.element.style.display = 'none';
            this.element.setAttribute('aria-hidden', 'true');
            this.element.removeAttribute('aria-modal');
            this.element.removeAttribute('role');
            
            // Remove backdrop
            if (this.backdrop) {
                this.backdrop.remove();
                this.backdrop = null;
            }
            
            // Restore scrollbar
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
            // Trigger hidden event
            this._triggerEvent('hidden.bs.modal');
        }, 300);
    }
    
    _showBackdrop() {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop fade';
        document.body.appendChild(this.backdrop);
        
        // Add click handler to close on backdrop click
        this.backdrop.addEventListener('click', () => {
            if (this.options.backdrop === true) {
                this.hide();
            }
        });
        
        // Trigger fade animation
        setTimeout(() => {
            this.backdrop.classList.add('show');
        }, 10);
    }
    
    _triggerEvent(eventName) {
        const event = new CustomEvent(eventName, {
            bubbles: true,
            cancelable: true
        });
        this.element.dispatchEvent(event);
    }
    
    dispose() {
        this.hide();
        this.element = null;
        this.options = null;
        this.backdrop = null;
    }
}

// For compatibility with bootstrap.Modal syntax
const bootstrap = {
    Modal: Modal
};


const Dialogs = (function () {
    // Auto-create modal if not exists
    let modalEl = document.getElementById('dialogsModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'dialogsModal';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = '-1';
        modalEl.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="dialogsTitle">Title</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="dialogsBody"></div>
                    <div class="modal-footer" id="dialogsFooter"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modalEl);
    }

    const modal = new bootstrap.Modal(modalEl);
    let currentCallback = null;
    let currentResult = false;

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function show(title, bodyHtml, footerHtml, callback) {
        document.getElementById('dialogsTitle').textContent = title || 'Dialog';
        document.getElementById('dialogsBody').innerHTML = bodyHtml;
        document.getElementById('dialogsFooter').innerHTML = footerHtml;

        currentCallback = callback;
        currentResult = false;

        const okBtn = document.querySelector('#dialogsFooter .btn-primary');
        const cancelBtn = document.querySelector('#dialogsFooter .btn-secondary');
        const closeBtn = document.querySelector('#dialogsModal .btn-close');

        const closeHandler = () => { modal.hide(); };
        const okHandler = () => { currentResult = true; modal.hide(); };

        if (okBtn) okBtn.onclick = okHandler;
        if (cancelBtn) cancelBtn.onclick = closeHandler;
        if (closeBtn) closeBtn.onclick = closeHandler;

        const hiddenHandler = () => {
            if (currentCallback) {
                currentCallback(currentResult);
            }
            currentCallback = null;
            modalEl.removeEventListener('hidden.bs.modal', hiddenHandler);
        };
        modalEl.addEventListener('hidden.bs.modal', hiddenHandler);

        modal.show();
    }

    // -------------------------------------------------
    // showMessage(message, title, options, callback)
    // -------------------------------------------------
    function showMessage(message, title, options, callback) {
        if (typeof options === 'function') { callback = options; options = {}; }
        options = options || {};
        const btnText = options.okText || 'OK';

        const body = `<p class="mb-0">${escapeHtml(message)}</p>`;
        const footer = `<button type="button" class="btn btn-primary">${btnText}</button>`;

        show(title || 'Message', body, footer, function () {
            if (callback) callback();
        });
    }

    // -------------------------------------------------
    // confirmBox(message, title, options, callback)
    //   callback(true) on Yes, callback(false) on No/Cancel
    // -------------------------------------------------
    function confirmBox(message, title, options, callback) {
        if (typeof options === 'function') { callback = options; options = {}; }
        options = options || {};
        const yesText = options.yesText || 'Yes';
        const noText = options.noText || 'No';

        const body = `<p class="mb-0">${escapeHtml(message)}</p>`;
        const footer = `
            <button type="button" class="btn btn-secondary">${noText}</button>
            <button type="button" class="btn btn-primary">${yesText}</button>
        `;

        show(title || 'Confirm', body, footer, function (result) {
            callback(result); // true = Yes, false = No/Cancel
        });
    }

    // -------------------------------------------------
    // Input & Multi-field (existing logic moved here)
    // -------------------------------------------------
    function formatForInput(val, type) {
        if (!val) return '';
        if (!(val instanceof Date)) return String(val);
        const d = val;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const ii = String(d.getMinutes()).padStart(2, '0');
        switch (type) {
            case 'date': return `${dd}-${mm}-${yyyy}`;
            case 'datetime': return `${dd}-${mm}-${yyyy} ${hh}:${ii}`;
            case 'time': return `${hh}:${ii}`;
            default: return '';
        }
    }

    function parseDate(str) {
        if (!str) return null;
        const p = str.trim().split('-');
        if (p.length !== 3) return null;
        const d = parseInt(p[0], 10), m = parseInt(p[1], 10) - 1, y = parseInt(p[2], 10);
        const date = new Date(y, m, d);
        if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) return null;
        return date;
    }

    function parseTime(str) {
        if (!str) return null;
        const p = str.trim().split(':');
        if (p.length !== 2) return null;
        const h = parseInt(p[0], 10), m = parseInt(p[1], 10);
        if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
        return new Date(1970, 0, 1, h, m);
    }

    function parseDateTime(str) {
        if (!str) return null;
        const parts = str.trim().split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '';
        const d = parseDate(datePart);
        if (!d) return null;
        if (!timePart) return d;
        const t = parseTime(timePart);
        if (!t) return null;
        d.setHours(t.getHours());
        d.setMinutes(t.getMinutes());
        return d;
    }

    function isEpochDate(date) {
        return date && date.getTime() === 0;
    }

    function isValid(type, val, required) {
        const v = val.trim();
        if (required && v === '') return false;
        if (v === '') return true;
        switch (type) {
            case 'number': return !isNaN(parseInt(v));
            case 'float': return !isNaN(parseFloat(v));
            case 'email': return /\S+@\S+\.\S+/.test(v);
            case 'date': return parseDate(v) !== null;
            case 'time': return parseTime(v) !== null;
            case 'datetime':
                const dt = parseDateTime(v);
                return dt !== null && !isEpochDate(dt);
            default: return true;
        }
    }

    function applyMask(el, type) {
        el.addEventListener('input', function () {
            let v = this.value;
            if (type === 'date') {
                v = v.replace(/\D/g, '').substring(0, 8);
                if (v.length >= 2) v = v.substring(0, 2) + '-' + v.substring(2);
                if (v.length >= 5) v = v.substring(0, 5) + '-' + v.substring(5);
                this.value = v.substring(0, 10);
            } else if (type === 'time') {
                v = v.replace(/\D/g, '').substring(0, 4);
                if (v.length >= 2) v = v.substring(0, 2) + ':' + v.substring(2);
                this.value = v.substring(0, 5);
            } else if (type === 'datetime') {
                let date = v.substring(0, 10).replace(/\D/g, '').substring(0, 8);
                let time = v.length > 11 ? v.substring(11).replace(/\D/g, '').substring(0, 4) : '';
                if (date.length >= 2) date = date.substring(0, 2) + '-' + date.substring(2);
                if (date.length >= 5) date = date.substring(0, 5) + '-' + date.substring(5);
                if (time.length >= 2) time = time.substring(0, 2) + ':' + time.substring(2);
                this.value = (date.length >= 10 ? date : date) + (time && date.length >= 10 ? ' ' + time : '');
            }
        });
    }

    function createField(key, cfg) {
        const val = formatForInput(cfg.value, cfg.type);
        const label = cfg.label ? `<label class="form-label">${escapeHtml(cfg.label)}${cfg.required ? ' <span class="text-danger">*</span>' : ''}</label>` : '';
        let input = '';
        const common = `id="${key}" class="form-control"`;
        switch (cfg.type) {
            case 'textarea':
                input = `<textarea ${common} rows="3">${escapeHtml(val)}</textarea>`;
                break;
            case 'number':
                input = `<input type="number" ${common} value="${val}" ${cfg.min !== undefined ? 'min="' + cfg.min + '"' : ''} ${cfg.max !== undefined ? 'max="' + cfg.max + '"' : ''}>`;
                break;
            case 'float':
                input = `<input type="number" step="any" ${common} value="${val}" ${cfg.min !== undefined ? 'min="' + cfg.min + '"' : ''} ${cfg.max !== undefined ? 'max="' + cfg.max + '"' : ''}>`;
                break;
            case 'email':
                input = `<input type="email" ${common} value="${val}">`;
                break;
            case 'date':
            case 'datetime':
            case 'time':
                const ph = cfg.type === 'date' ? 'dd-mm-yyyy' : cfg.type === 'time' ? 'hh:ii' : 'dd-mm-yyyy hh:ii';
                input = `<input type="text" ${common} placeholder="${ph}" value="${val}">`;
                break;
            default:
                input = `<input type="text" ${common} value="${val}">`;
        }
        return `<div class="mb-3">${label}${input}</div>`;
    }

    // inputBox wrapper
    function inputBox(message, title, value, type, maxlength, required, callback) {
        const inputs = {
            field: { type: type || 'text', label: '', value: value || '', required: !!required }
        };
        if (maxlength && (type === 'text' || type === 'textarea' || type === 'email')) {
            inputs.field.maxlength = maxlength;
        }
        showModalDialog(title, message, inputs, function (res) {
            callback(res ? res.field : null);
        });
    }

    // Full multi-field dialog
    function showModalDialog(title, message, inputs, callback) {
        let html = message ? `<p class="mb-3">${escapeHtml(message)}</p>` : '';
        for (const key in inputs) {
            html += createField(key, inputs[key]);
        }

        const footer = `
            <button type="button" class="btn btn-secondary">Cancel</button>
            <button type="button" class="btn btn-primary">OK</button>
        `;

        show(title, html, footer, function (ok) {
            if (!ok) return callback(null);

            let firstInvalid = null;
            for (const key in inputs) {
                const el = document.getElementById(key);
                const valid = isValid(inputs[key].type, el.value, inputs[key].required);
                if (!valid) {
                    el.classList.add('is-invalid');
                    if (!firstInvalid) firstInvalid = el;
                } else {
                    el.classList.remove('is-invalid');
                }
                if (['date', 'datetime', 'time'].includes(inputs[key].type)) {
                    applyMask(el, inputs[key].type);
                }
            }
            if (firstInvalid) {
                firstInvalid.focus();
                return;
            }

            const result = {};
            for (const key in inputs) {
                const el = document.getElementById(key);
                const val = el.value.trim();
                const type = inputs[key].type;
                let parsed = val;
                if (type === 'number') parsed = val === '' ? null : parseInt(val);
                else if (type === 'float') parsed = val === '' ? null : parseFloat(val);
                else if (type === 'date') parsed = parseDate(val);
                else if (type === 'time') parsed = parseTime(val);
                else if (type === 'datetime') parsed = parseDateTime(val);
                result[key] = parsed;
            }
            callback(result);
        });
    }

    // Public API
    return {
        message: showMessage,
        confirm: confirmBox,
        inputBox: inputBox,
        showModal: showModalDialog,
        showModalDialog: showModalDialog,

        // Short aliases
        alert: showMessage,
        confirmBox: confirmBox
    };
})();

// Test multi-field
function testMulti() {
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
}