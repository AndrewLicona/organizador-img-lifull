/**
 * ui.js · Notificaciones, modales y barras de progreso
 *
 * Tres sistemas visuales:
 *   - showToast()     : banner fugaz en la esquina inferior
 *   - showProgress()  : modal bloqueante con barra de progreso
 *   - askName()       : prompt modal para pedir un nombre
 */

import { dom, svgIcon, toastIcon } from './dom.js';
import { tick } from './utils.js';
import { canUndo, canRedo } from './state.js';

// ── TOAST ─────────────────────────────────────────────────────
let toastTimer = null;

const TOAST_COLORS = {
    ok:     'var(--success)',
    warn:   'var(--warning)',
    error:  'var(--danger)',
    move:   'var(--success)',
    delete: 'var(--danger)',
    clear:  'var(--warning)'
};

/**
 * Muestra una notificación breve.
 * @param {string} msg   - Mensaje a mostrar
 * @param {'ok'|'warn'|'error'|'move'|'delete'|'clear'} type
 */
export function showToast(msg, type = 'ok') {
    const t = dom.toast();
    dom.toastMsg().textContent = msg;
    dom.toastIcon().innerHTML  = toastIcon(type);
    t.style.borderColor = TOAST_COLORS[type] || TOAST_COLORS.ok;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ── PROGRESS MODAL ────────────────────────────────────────────
export function showProgress(title, subtitle) {
    dom.progTitle().innerHTML    = svgIcon('clock') + ' ' + title;
    dom.progSub().textContent    = subtitle;
    dom.progFill().style.width   = '0%';
    dom.progText().textContent   = 'Iniciando...';
    dom.progPercent().textContent = '0%';
    dom.progressModal().style.display = 'flex';
}

export function updateProgress(current, total, detail) {
    const pct = Math.round((current / Math.max(1, total)) * 100);
    dom.progFill().style.width    = pct + '%';
    dom.progText().textContent    = detail || `${current} / ${total}`;
    dom.progPercent().textContent = pct + '%';
}

export function hideProgress() {
    dom.progressModal().style.display = 'none';
}

// ── NAME DIALOG ───────────────────────────────────────────────
let _dlgResolve = null;

/**
 * Pide al usuario un nombre (carpeta o archivo ZIP).
 * Resuelve con el string (trim) o null si canceló.
 */
export function askName(title, description, defaultValue) {
    return new Promise(resolve => {
        dom.dlgTitle().textContent = title;
        dom.dlgDesc().textContent  = description;
        const input = dom.dlgInput();
        input.value = defaultValue || '';
        _dlgResolve = resolve;
        dom.nameDialog().classList.add('visible');
        setTimeout(() => { input.focus(); input.select(); }, 60);
        input.onkeydown = (e) => {
            if (e.key === 'Enter')  { e.preventDefault(); confirmDialog(); }
            if (e.key === 'Escape') { e.preventDefault(); closeDialog(); }
        };
        dom.dlgConfirmBtn().onclick = confirmDialog;
    });
}

function confirmDialog() {
    const val = dom.dlgInput().value.trim();
    dom.nameDialog().classList.remove('visible');
    if (_dlgResolve) { _dlgResolve(val || null); _dlgResolve = null; }
}

function closeDialog() {
    dom.nameDialog().classList.remove('visible');
    if (_dlgResolve) { _dlgResolve(null); _dlgResolve = null; }
}

// Llamada por el botón "Cancelar" del HTML (atributo onclick)
window.closeDlg = closeDialog;

// ── HISTORY BUTTONS ───────────────────────────────────────────
/** Habilita/deshabilita los botones de undo/redo según las pilas. */
export function updateHistoryButtons() {
    const u = dom.btnUndo();
    const r = dom.btnRedo();
    if (u) u.disabled = !canUndo();
    if (r) r.disabled = !canRedo();
}
