/**
 * canvas-interactions.js · Interacción directa con el lienzo
 *
 *  - Pan (arrastrar con el ratón)  → modifica cur.panX / panY
 *  - Wheel zoom (rueda del ratón)  → modifica cur.zoom
 *
 * La pulsación se inicia en el canvas y se sigue en window
 * (para no perder el movimiento si el cursor sale del canvas).
 */

import { state, CANVAS_W } from './state.js';
import { dom } from './dom.js';
import { renderCanvas } from './canvas.js';

let isPanning  = false;
let panStartX  = 0;
let panStartY  = 0;
let initialPanX = 0;
let initialPanY = 0;

export function initCanvasInteractions() {
    const canvas = dom.mainCanvas();
    if (!canvas) return;

    // ── Pan ───────────────────────────────────────────────────
    canvas.addEventListener('mousedown', (e) => {
        if (!state.images.length || state.selIdx >= state.images.length) return;
        isPanning = true;
        canvas.classList.add('panning');
        panStartX = e.clientX;
        panStartY = e.clientY;
        const cur = state.images[state.selIdx];
        initialPanX = cur.panX || 0;
        initialPanY = cur.panY || 0;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning || !state.images.length || state.selIdx >= state.images.length) return;
        const cur = state.images[state.selIdx];
        const dx = e.clientX - panStartX;
        const dy = e.clientY - panStartY;

        // Conversión px-de-pantalla → px-de-canvas (escala CSS)
        const rect = canvas.getBoundingClientRect();
        const scaleFactor = CANVAS_W / (rect.width || 1);

        cur.panX = initialPanX + (dx * scaleFactor);
        cur.panY = initialPanY + (dy * scaleFactor);
        renderCanvas();
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            canvas.classList.remove('panning');
        }
    });

    // ── Wheel zoom ────────────────────────────────────────────
    canvas.addEventListener('wheel', (e) => {
        if (!state.images.length || state.selIdx >= state.images.length) return;
        e.preventDefault();
        const cur = state.images[state.selIdx];
        let z = (cur.zoom || 1) + (e.deltaY < 0 ? 0.05 : -0.05);
        z = Math.max(0.5, Math.min(2.5, z));
        cur.zoom = z;
        // Sincronizar el slider; se hace vía callback para evitar ciclo
        onZoomChanged?.(z);
        renderCanvas();
    }, { passive: false });
}

// Callback inyectado por adjustments.js para sincronizar el slider
let onZoomChanged = null;
export function setZoomChangedCallback(fn) {
    onZoomChanged = fn;
}
