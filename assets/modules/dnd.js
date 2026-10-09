/**
 * dnd.js · Drag & Drop
 *
 *  - refreshSortables()   : crea (o recrea) SortableJS en `sortableList`
 *                           y en cada `.folder-group__items` para que las
 *                           imágenes puedan moverse DENTRO y ENTRE grupos.
 *  - initFileDrop()       : arrastrar archivos del explorador a la ventana
 *
 * SortableJS ya está cargado por CDN en index.html. Si en el futuro
 * se quiere reemplazar, este es el único archivo a tocar.
 *
 * NOTA: refreshSortables() debe llamarse cada vez que rebuildList() cambia
 * el DOM (porque se crean nuevos `.folder-group__items`). La función
 * destruye los Sortables anteriores para evitar fugas de memoria.
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

// ── SORTABLEJS (reordenar dentro y entre grupos) ──────────────
let sortableInstances = [];

/** Destruye todas las instancias Sortable y libera memoria. */
function destroySortables() {
    sortableInstances.forEach(s => { try { s.destroy(); } catch (_) {} });
    sortableInstances = [];
}

/**
 * Handler único de fin de drag, compartido por todos los Sortables.
 *
 * Estrategia:
 *   1) Recorremos el DOM en orden visual: `sortableList` y, si tiene
 *      grupos, cada `.folder-group` con su `.folder-group__items`.
 *   2) Vamos re-construyendo `state.images` en ese mismo orden,
 *      asignando a cada item el `folder` del grupo en el que quedó.
 *   3) Actualizamos `selIdx` al nuevo índice del item que se movió.
 */
function handleSortEnd(movedId, movedFromContainer, movedToContainer) {
    if (!state.images.length) return;

    const root = dom.sortableList();

    // Construimos el nuevo orden leyendo los .item-card en el DOM
    const newOrder = [];
    const groupContainers = Array.from(root.children).filter(el => el.classList.contains('folder-group'));
    const hasGroups = groupContainers.length > 0;

    if (hasGroups) {
        // Hay subcarpetas: recorremos cada grupo y su contenedor
        groupContainers.forEach(groupEl => {
            const folderName = groupEl.dataset.folderName || '__root__';
            const container = groupEl.querySelector('.folder-group__items');
            if (container) {
                Array.from(container.children)
                    .filter(el => el.classList.contains('item-card'))
                    .forEach(card => {
                        const id = card.dataset.id;
                        const item = state.images.find(it => it.id === id);
                        if (item) {
                            item.folder = folderName === '__root__' ? '' : folderName;
                            newOrder.push(item);
                        }
                    });
            }
        });
        // También: items sueltos fuera de los grupos (caso "root sin grupo")
        Array.from(root.children)
            .filter(el => el.classList.contains('item-card'))
            .forEach(card => {
                const id = card.dataset.id;
                const item = state.images.find(it => it.id === id);
                if (item) {
                    item.folder = '';
                    newOrder.push(item);
                }
            });
    } else {
        // Sin grupos: todo está en sortableList directamente
        Array.from(root.children)
            .filter(el => el.classList.contains('item-card'))
            .forEach(card => {
                const id = card.dataset.id;
                const item = state.images.find(it => it.id === id);
                if (item) newOrder.push(item);
            });
    }

    // Reemplazar el array in-place
    state.images.length = 0;
    state.images.push(...newOrder);

    // Actualizar selIdx
    const newIdx = state.images.findIndex(it => it.id === movedId);
    if (newIdx >= 0) state.selIdx = newIdx;

    onCommitReorder();
    patchBadges();
    updateActiveClass();
    renderCanvas();
    updateStatus();

    const moved = state.images[state.selIdx];
    if (moved) {
        showToast(`Reordenado: "${moved.name}" → #${pad(state.selIdx + 1)}`, 'move');
    }
}

/** Crea una instancia Sortable sobre un contenedor dado. */
function makeSortable(containerEl) {
    if (typeof Sortable === 'undefined') {
        console.warn('[dnd] SortableJS no está cargado');
        return null;
    }
    const inst = new Sortable(containerEl, {
        animation: 160,
        easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        ghostClass:  'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass:   'sortable-drag',
        handle:      '.drag-handle',
        forceFallback: false,
        delay: 0,
        delayOnTouchOnly: true,
        group:       'shared-list',  // permite mover entre contenedores

        onStart() { state.isDragging = true; },
        onEnd(evt) {
            state.isDragging = false;
            if (evt.oldIndex === evt.newIndex &&
                evt.from === evt.to) return;
            pushHistory();
            const card = evt.item;
            handleSortEnd(card.dataset.id, evt.from, evt.to);
        }
    });
    sortableInstances.push(inst);
    return inst;
}

/**
 * (Re)crea SortableJS en el contenedor principal y en cada
 * `.folder-group__items` que exista en el DOM. Llamar después de
 * cada rebuildList().
 */
export function refreshSortables() {
    destroySortables();
    const root = dom.sortableList();
    if (!root) return;
    makeSortable(root);
    // Crear Sortable en cada grupo de carpeta para que sus items también sean arrastrables
    root.querySelectorAll('.folder-group__items').forEach(container => {
        makeSortable(container);
    });
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
