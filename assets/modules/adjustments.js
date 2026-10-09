/**
 * adjustments.js · Controles de ajuste por imagen
 *
 *  - syncAdjustmentControls()  : lee del item actual → actualiza UI
 *  - changeZoom(val)           : zoom por slider/rango
 *  - changeFitMode(val)        : 'contain' | 'cover'
 *  - rotateImg(deg)            : 90 / -90
 *  - resetAdjustments()        : todo a defaults
 *  - changeGlobalMargin(val)   : margen del lienzo (afecta el render)
 *
 * Estos handlers se conectan al `oninput` de los inputs en index.html
 * y al callback del slider para mantener la UI sincronizada.
 */

import { state, pushHistory } from './state.js';
import { dom } from './dom.js';
import { renderCanvas } from './canvas.js';
import { showToast } from './ui.js';
import { setSyncAdjustmentsFn } from './list.js';
import { setZoomChangedCallback } from './canvas-interactions.js';

// Sincroniza la UI con el item actual
export function syncAdjustmentControls() {
    if (!state.images.length || state.selIdx >= state.images.length) return;
    const cur = state.images[state.selIdx];
    const zoom = Math.round((cur.zoom || 1) * 100);
    const range = dom.zoomRange();
    const val   = dom.zoomVal();
    const fit   = dom.fitModeSelect();
    if (range) range.value = zoom;
    if (val)   val.textContent = zoom + '%';
    if (fit)   fit.value = cur.fitMode || 'contain';
}

// Permitir que list.js nos llame sin crear ciclo de imports
setSyncAdjustmentsFn(syncAdjustmentControls);

// Handlers expuestos al HTML (atributos oninput / onclick → window.*)
export function changeZoom(val) {
    if (!state.images.length || state.selIdx >= state.images.length) return;
    const cur = state.images[state.selIdx];
    cur.zoom = parseFloat(val) / 100;
    const v = dom.zoomVal();
    if (v) v.textContent = val + '%';
    renderCanvas();
}

export function changeFitMode(val) {
    if (!state.images.length || state.selIdx >= state.images.length) return;
    pushHistory();
    state.images[state.selIdx].fitMode = val;
    renderCanvas();
    showToast(`Modo: ${val === 'cover' ? 'Llenar lienzo' : 'Contener completo'}`, 'ok');
}

export function rotateImg(deltaDeg = 90) {
    if (!state.images.length || state.selIdx >= state.images.length) return;
    pushHistory();
    const cur = state.images[state.selIdx];
    cur.rotation = ((cur.rotation || 0) + deltaDeg) % 360;
    renderCanvas();
    showToast(`Rotación: ${cur.rotation}°`, 'ok');
}

export function resetAdjustments() {
    if (!state.images.length || state.selIdx >= state.images.length) return;
    pushHistory();
    const cur = state.images[state.selIdx];
    cur.zoom = 1;
    cur.panX = 0;
    cur.panY = 0;
    cur.rotation = 0;
    cur.fitMode = 'contain';
    syncAdjustmentControls();
    renderCanvas();
    showToast('Ajustes restablecidos', 'ok');
}

export function changeGlobalMargin(/* val */) {
    renderCanvas();
}

// Conectar el callback del wheel-zoom para que actualice el slider
setZoomChangedCallback((z) => {
    const range = dom.zoomRange();
    const val   = dom.zoomVal();
    if (range) range.value = Math.round(z * 100);
    if (val)   val.textContent = Math.round(z * 100) + '%';
});
