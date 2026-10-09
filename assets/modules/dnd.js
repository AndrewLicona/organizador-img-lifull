/**
 * dnd.js · Drag & Drop
 *
 *  - initSortable()  : reordenar cards dentro del sidebar con SortableJS
 *  - initFileDrop()  : arrastrar archivos del explorador a la ventana
 *
 * SortableJS ya está cargado por CDN en index.html. Si en el futuro
 * se quiere reemplazar, este es el único archivo a tocar.
 */

import { state, pushHistory } from './state.js';
import { dom } from './dom.js';
import { showToast } from './ui.js';
import { patchBadges, updateActiveClass, updateStatus } from './list.js';
import { renderCanvas } from './canvas.js';
import { pad } from './utils.js';
import { handleFiles } from './importer.js';

// Callbacks inyectados
let onCommitReorder = () => {};

/** Inicializa los callbacks que dnd.js puede invocar. */
export function initDnd({ onCommitReorder: cb }) {
    onCommitReorder = cb;
}

// ── SORTABLEJS (reordenar dentro del sidebar) ─────────────────
let sortableInst = null;

export function initSortable() {
    if (typeof Sortable === 'undefined') {
        console.warn('[dnd] SortableJS no está cargado');
        return null;
    }
    sortableInst = new Sortable(dom.sortableList(), {
        animation: 160,
        easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        ghostClass:  'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass:   'sortable-drag',
        handle:      '.drag-handle',
        forceFallback: false,
        delay: 0,
        delayOnTouchOnly: true,

        onStart() {
            state.isDragging = true;
        },
        onEnd(evt) {
            state.isDragging = false;
            if (evt.oldIndex === evt.newIndex) return;

            // Mapeo: SortableJS opera sobre los nodos DOM renderizados en orden.
            // Recorremos los nodos en su nuevo orden y reordenamos `state.images`
            // para que coincida.
            pushHistory();

            const cards = Array.from(dom.sortableList().querySelectorAll('.item-card'));
            const newOrderIds = cards.map(c => c.dataset.id);
            const currentIds  = state.images.map(it => it.id);

            // Si las longitudes difieren, abortamos (raro, pero defensivo)
            if (newOrderIds.length !== currentIds.length) return;

            // Reordenar el array `state.images` según `newOrderIds`
            const byId = new Map(state.images.map(it => [it.id, it]));
            state.images = newOrderIds.map(id => byId.get(id)).filter(Boolean);
            state.selIdx = newOrderIds.indexOf(currentIds[evt.oldIndex]);
            if (state.selIdx < 0) state.selIdx = evt.newIndex;

            onCommitReorder();
            patchBadges();
            updateActiveClass();
            renderCanvas();
            updateStatus();

            const moved = state.images[state.selIdx];
            showToast(`Reordenado: "${moved.name}" → #${pad(state.selIdx + 1)}`, 'move');
        }
    });
    return sortableInst;
}

// ── DROP DE ARCHIVOS DEL EXPLORADOR ───────────────────────────
let _fileDropBound = false;

export function initFileDrop() {
    if (_fileDropBound) return;
    _fileDropBound = true;

    const dropZone = dom.dropZone();

    window.addEventListener('dragover', (e) => {
        if (state.isDragging) return;
        if (e.dataTransfer?.types?.includes('Files')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            if (dropZone) dropZone.style.display = 'flex';
        }
    });

    window.addEventListener('dragleave', (e) => {
        if (state.isDragging) return;
        if (e.clientX <= 0 || e.clientY <= 0 ||
            e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
            if (dropZone) dropZone.style.display = 'none';
        }
    });

    window.addEventListener('drop', (e) => {
        if (state.isDragging) return;
        if (dropZone) dropZone.style.display = 'none';
        if (e.dataTransfer?.files?.length) {
            e.preventDefault();
            handleFiles(Array.from(e.dataTransfer.files));
        }
    });
}
