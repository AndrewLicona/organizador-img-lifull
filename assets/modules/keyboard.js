/**
 * keyboard.js · Atajos de teclado globales
 *
 *  - Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z   → undo / redo
 *  - ← / →                            → imagen anterior / siguiente
 *  - ↑ / ↓                            → mover item seleccionado
 *  - Supr / Backspace                 → borrar item seleccionado
 *  - F11                               → pantalla completa (lo maneja el navegador)
 *
 * Ignora los atajos cuando el foco está en un input/select/textarea.
 */

import { state, undo as doUndo, redo as doRedo } from './state.js';
import { showToast, updateHistoryButtons } from './ui.js';
import { prevImg, nextImg, selectItem } from './selection.js';
import { moveItem, deleteItem } from './items.js';
import { rebuildList, updateStatus } from './list.js';
import { renderCanvas } from './canvas.js';
import { syncAdjustmentControls } from './adjustments.js';

function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (isTypingTarget(e.target)) return;

        // ── Undo / Redo ─────────────────────────────────────
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            if (e.shiftKey) doRedoFromUI();
            else            doUndoFromUI();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            doRedoFromUI();
            return;
        }

        if (!state.images.length) return;

        // ── Navegación / acciones ───────────────────────────
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                prevImg();
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextImg();
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (state.selIdx > 0) moveItem(state.images[state.selIdx].id, -1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (state.selIdx < state.images.length - 1) moveItem(state.images[state.selIdx].id, +1);
                break;
            case 'Delete':
            case 'Backspace':
                if (state.selIdx >= 0 && state.selIdx < state.images.length) {
                    e.preventDefault();
                    deleteItem(state.images[state.selIdx].id);
                }
                break;
        }
    });
}

function doUndoFromUI() {
    const snap = doUndo();
    if (!snap) { showToast('Nada que deshacer', 'warn'); return; }
    rebuildList();
    syncAdjustmentControls();
    renderCanvas();
    updateStatus();
    updateHistoryButtons();
    showToast('Acción deshecha', 'ok');
}

function doRedoFromUI() {
    const snap = doRedo();
    if (!snap) { showToast('Nada que rehacer', 'warn'); return; }
    rebuildList();
    syncAdjustmentControls();
    renderCanvas();
    updateStatus();
    updateHistoryButtons();
    showToast('Acción rehecha', 'ok');
}
