/**
 *  Dialogs for Auto Generated Input Fields
 * 
    input field scheme:

    {
        name: { type: 'text', label: 'Name', value: '', required: true },
        age: { type: 'number', label: 'Age', value: 30, required: true },
        email: { type: 'email', label: 'Email', value: '', required: true },
        birth: { type: 'date', label: 'Birth Date', value: new Date(2000, 0, 1) },
        meeting: { type: 'datetime', label: 'Meeting', value: new Date(), required: true }
    }
 */

var Dialogs = (function () {
    let currentCallback = null;
    let currentResult = false;

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

    function createInputFields(inputs) {
        let html = '';
        for (const key in inputs) {
            html += createField(key, inputs[key]);
        }
        return html;
    }    

    function validateInputFields(inputs) {
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
            return false;
        }
        return true;
    }

    function getInputValues(inputs) {
        const results = {};
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
            results[key] = parsed;
        }
        return results;
    }


    // Full multi-field dialog
    function showModalDialog(title, message, inputs, callback) {
        const body = (message ? `<p class="mb-3">${escapeHtml(message)}</p>` : '') +
                createInputFields(inputs);

        const footer = `
            <button id="modal-ok" class="primary">OK</button>
            <button id="modal-cancel">Cancel</button>
        `;

        const { overlay } = showModal({
            title: title,
            messageHTML: body,
            footerHTML: footer
        });

        const close = (result) => {
            hideModal(overlay);
            if (typeof callback === 'function') callback(result);
        };

        const submit = (result) => {
            if (!validateInputFields(inputs)) {
                return false;
            }
            hideModal(overlay);

            const results = getInputValues(inputs);
            if (typeof callback === 'function') callback(results);
        }

        document.getElementById('modal-ok').onclick = () => submit(true);
        document.getElementById('modal-cancel').onclick = () => close(false);                        
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

    // Public API
    return {
        showModalDialog: showModalDialog,
    };
})();
