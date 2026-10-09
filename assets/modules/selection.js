/**
 * selection.js · Navegación y selección de items
 *
 *  - selectItem(idx)   : activa un item por índice
 *  - prevImg()         : anterior
 *  - nextImg()         : siguiente
 */

import { state } from './state.js';
import { updateActiveClass, updateStatus } from './list.js';
import { renderCanvas } from './canvas.js';
import { syncAdjustmentControls } from './adjustments.js';

export function selectItem(idx) {
    if (idx < 0 || idx >= state.images.length) return;
    state.selIdx = idx;
    updateActiveClass();
    syncAdjustmentControls();
    renderCanvas();
    updateStatus();
}

export function prevImg() {
    if (state.selIdx > 0) selectItem(state.selIdx - 1);
}

export function nextImg() {
    if (state.selIdx < state.images.length - 1) selectItem(state.selIdx + 1);
}
