/**
 * canvas.js · Motor de dibujo del lienzo 1980 × 980 px
 *
 *  - drawOnCanvas(canvas, item) : pinta un item en un canvas cualquiera
 *  - renderCanvas()              : pinta el item seleccionado en el canvas principal
 *
 * El canvas principal (#mainCanvas) mantiene su tamaño interno en
 * 1980×980 (alta resolución). CSS lo escala visualmente al viewport.
 */

import { state, CANVAS_W, CANVAS_H } from './state.js';
import { dom, svgIcon } from './dom.js';
import { pad } from './utils.js';

/**
 * Dibuja un item en el canvas respetando: fit mode, zoom, pan, rotación y márgenes.
 * NO consulta el state — recibe el item como argumento (puro, testeable).
 */
export function drawOnCanvas(targetCanvas, item) {
    const ctx = targetCanvas.getContext('2d');
    const margin = Math.max(0, parseInt(dom.marginInput()?.value) || 50);

    // 1) Fondo blanco nítido
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (!item?.imgObj) {
        ctx.restore();
        return;
    }

    // 2) Calcular escala base según fit mode
    const availW = Math.max(10, CANVAS_W - 2 * margin);
    const availH = Math.max(10, CANVAS_H - 2 * margin);

    const fitMode  = item.fitMode || 'contain';
    const zoom     = item.zoom || 1;
    const panX     = item.panX || 0;
    const panY     = item.panY || 0;
    const rotation = (item.rotation || 0) * (Math.PI / 180);

    let scale;
    if (fitMode === 'cover') {
        scale = Math.max(availW / item.imgObj.width, availH / item.imgObj.height);
    } else {
        scale = Math.min(availW / item.imgObj.width, availH / item.imgObj.height);
    }
    scale *= zoom;

    const baseW = item.imgObj.width  * scale;
    const baseH = item.imgObj.height * scale;

    // 3) Componer: centrar + pan + rotación
    const centerX = (CANVAS_W / 2) + panX;
    const centerY = (CANVAS_H / 2) + panY;

    ctx.translate(centerX, centerY);
    if (rotation !== 0) ctx.rotate(rotation);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(item.imgObj, -baseW / 2, -baseH / 2, baseW, baseH);

    ctx.restore();
}

/**
 * Pinta el item actualmente seleccionado en el canvas principal.
 * Si no hay nada, no hace nada (la UI muestra el placeholder).
 */
export function renderCanvas() {
    if (!state.images.length || state.selIdx >= state.images.length) return;
    const cur = state.images[state.selIdx];
    const folderLabel = cur.folder
        ? `<span style="color:var(--text-muted);font-size:0.74rem;font-weight:400">${cur.folder}/</span>`
        : '';
    dom.canvasTitle().innerHTML =
        svgIcon('image') + ` #${pad(state.selIdx + 1)} — ${folderLabel}${cur.name}`;
    dom.navCounter().textContent = `${state.selIdx + 1} / ${state.images.length}`;

    dom.mainCanvas().classList.add('can-pan');
    drawOnCanvas(dom.mainCanvas(), cur);
}

/** Crea un canvas off-screen con tamaño fijo 1980×980 (para export). */
export function createExportCanvas() {
    return Object.assign(document.createElement('canvas'), {
        width:  CANVAS_W,
        height: CANVAS_H
    });
}
