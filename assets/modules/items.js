/**
 * items.js · Operaciones sobre items de la lista
 *
 *  - moveItem(id, delta)     : mueve ±1 posición
 *  - deleteItem(id)          : elimina un item
 *  - clearList()             : vacía todo
 *
 * Cada acción registra un snapshot en el historial (undo/redo).
 */

import { state, pushHistory } from './state.js';
import { rebuildList, updateStatus } from './list.js';
import { renderCanvas } from './canvas.js';
import { showToast } from './ui.js';
import { pad } from './utils.js';
import { selectItem } from './selection.js';

export function moveItem(id, delta) {
    const from = state.images.findIndex(x => x.id === id);
    const to   = from + delta;
    if (from < 0 || to < 0 || to >= state.images.length) return;

    pushHistory();
    const item = state.images.splice(from, 1)[0];
    state.images.splice(to, 0, item);
    state.selIdx = to;
    rebuildList();
    renderCanvas();
    showToast(`Movido: "${item.name}" → #${pad(to + 1)}`, 'move');
}

export function deleteItem(id) {
    const idx = state.images.findIndex(x => x.id === id);
    if (idx < 0) return;
    pushHistory();
    const removed = state.images.splice(idx, 1)[0];
    if (state.selIdx >= state.images.length) {
        state.selIdx = Math.max(0, state.images.length - 1);
    }
    rebuildList();
    renderCanvas();
    showToast(`Eliminada: "${removed.name}"`, 'delete');
}

export function clearList() {
    if (!state.images.length) return;
    if (!confirm('¿Deseas vaciar todas las imágenes de la lista?')) return;
    pushHistory();
    state.images = [];
    state.selIdx = 0;
    rebuildList();
    renderCanvas();
    showToast('Lista vaciada', 'clear');
}
