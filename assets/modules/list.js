/**
 * list.js · Render de la barra lateral (lista de imágenes con cards)
 *
 * Funciones:
 *   - rebuildList()             : reconstruye toda la lista (carga, clear, undo)
 *   - createCard()              : crea un nodo .item-card
 *   - patchBadges()             : actualiza solo los números de posición (drag-sort)
 *   - updateActiveClass()       : marca la card seleccionada
 *   - toggleGroup()             : colapsa/expande un grupo de carpeta
 *   - updateStatus()            : texto de la status bar
 *   - updateImgCount()          : contador "N imágenes"
 *   - showEmptyState()          : pinta el estado vacío
 *
 * Nota: el reordenamiento por drag se hace en dnd.js (SortableJS).
 */

import { state } from './state.js';
import { dom, svgIcon } from './dom.js';
import { groupByFolder, truncate, pad } from './utils.js';

// Callbacks inyectados por el entry point (evita acoplamiento circular)
let onSelect  = () => {};
let onMove    = () => {};
let onDelete  = () => {};

/** Inicializa los callbacks que la lista debe invocar. */
export function initList({ onSelect: sel, onMove: mv, onDelete: del }) {
    onSelect = sel;
    onMove   = mv;
    onDelete = del;
}

// ── RENDER PRINCIPAL ──────────────────────────────────────────
export function rebuildList() {
    const list = dom.sortableList();

    if (state.images.length === 0) {
        showEmptyState(list);
        dom.placeholder().style.display = 'flex';
        dom.mainCanvas().style.display  = 'none';
        dom.canvasTitle().innerHTML     = svgIcon('image') + ' Ninguna imagen seleccionada';
        dom.navCounter().textContent    = '0 / 0';
        dom.imgCount().textContent      = '0 imágenes';
        dom.statusText().innerHTML      = '<span class="status-dot"></span>Listo para cargar imágenes';
        return;
    }

    list.innerHTML = '';
    dom.placeholder().style.display = 'none';
    dom.mainCanvas().style.display  = 'block';

    const groups = groupByFolder(state.images);
    let visualIdx = 0;

    for (const [folder, items] of groups) {
        if (folder !== '__root__') {
            const gh = document.createElement('div');
            gh.className = 'folder-group';
            gh.innerHTML =
                `<div class="folder-group__header" data-toggle="1">` +
                    `${svgIcon('folder')}` +
                    `<span>${folder}</span>` +
                    `<span class="folder-group__count">${items.length}</span>` +
                    `${svgIcon('chevron-down')}` +
                `</div>` +
                `<div class="folder-group__items"></div>`;
            gh.querySelector('[data-toggle]').addEventListener('click', () => toggleGroup(gh));
            list.appendChild(gh);
            const container = gh.querySelector('.folder-group__items');
            items.forEach(item => {
                const i = state.images.indexOf(item);
                container.appendChild(createCard(item, i, visualIdx++));
            });
        } else {
            items.forEach(item => {
                const i = state.images.indexOf(item);
                list.appendChild(createCard(item, i, visualIdx++));
            });
        }
    }

    patchBadges();
    updateActiveClass();
    updateStatus();
    syncAdjustmentControls();   // delegado a adjustments.js
    updateImgCount();
}

// ── ESTADO VACÍO ──────────────────────────────────────────────
function showEmptyState(list) {
    list.innerHTML =
        `<div class="no-items-msg">` +
            `<svg style="width:34px;height:34px;color:var(--border)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">` +
                `<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>` +
            `</svg>` +
            `<strong>Ninguna imagen cargada</strong>` +
            `<p>Carga un ZIP o imágenes sueltas.<br>Las carpetas del ZIP se agrupan automáticamente.</p>` +
        `</div>`;
}

// ── CREACIÓN DE UNA CARD ──────────────────────────────────────
function createCard(item, dataIdx, visualIdx) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.id = item.id;

    card.addEventListener('click', (e) => {
        if (state.isDragging) return;
        if (e.target.closest('.item-btns')) return;
        const i = state.images.findIndex(x => x.id === item.id);
        if (i >= 0) onSelect(i);
    });

    const shortName = truncate(item.name, 28);

    card.innerHTML =
        `<span class="drag-handle" title="Arrastra para reordenar">` +
            `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">` +
                `<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>` +
            `</svg>` +
        `</span>` +
        `<span class="pos-badge">#${pad(visualIdx + 1)}</span>` +
        `<div class="item-thumb"><img src="${item.dataUrl}" alt="${item.name}" loading="lazy"></div>` +
        `<div class="item-details"><div class="item-name" title="${item.name}">${shortName}</div></div>` +
        `<div class="item-btns">` +
            (dataIdx > 0
                ? `<button class="btn-mini" title="Subir (↑)" data-act="up">` +
                    `<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>` +
                  `</button>` : '') +
            (dataIdx < state.images.length - 1
                ? `<button class="btn-mini" title="Bajar (↓)" data-act="down">` +
                    `<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>` +
                  `</button>` : '') +
            `<button class="btn-danger" title="Eliminar (Supr)" data-act="del">` +
                `<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">` +
                    `<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>` +
                `</svg>` +
            `</button>` +
        `</div>`;

    // Botones ↑/↓/✕ (no usamos inline onclick para no exponer funciones globales)
    card.querySelectorAll('.item-btns button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const act = btn.dataset.act;
            if (act === 'up')   onMove(item.id, -1);
            if (act === 'down') onMove(item.id, +1);
            if (act === 'del')  onDelete(item.id);
        });
    });

    return card;
}

// ── PATCH (sin reconstruir todo) ──────────────────────────────
export function patchBadges() {
    const cards = dom.sortableList().querySelectorAll('.item-card');
    cards.forEach((card, i) => {
        const badge = card.querySelector('.pos-badge');
        if (badge) badge.textContent = '#' + pad(i + 1);
    });
    updateImgCount();
}

export function updateActiveClass() {
    const cards = dom.sortableList().querySelectorAll('.item-card');
    cards.forEach((card, i) => {
        card.classList.toggle('active', i === state.selIdx);
    });
    const active = dom.sortableList().querySelector('.item-card.active');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function toggleGroup(groupEl) {
    const items = groupEl.querySelector('.folder-group__items');
    const isOpen = items.style.display !== 'none';
    items.style.display = isOpen ? 'none' : 'flex';
    const chevron = groupEl.querySelector('.icon-chevron');
    if (chevron) chevron.style.transform = isOpen ? 'rotate(-90deg)' : '';
}

// ── STATUS / CONTADORES ───────────────────────────────────────
export function updateStatus() {
    if (!state.images.length) {
        dom.statusText().innerHTML = '<span class="status-dot"></span>Listo para cargar imágenes';
    } else {
        const item = state.images[state.selIdx];
        const loc  = item.folder ? `${item.folder}/` : '';
        dom.statusText().innerHTML =
            `<span class="status-dot"></span>${state.images.length} imágenes &nbsp;|&nbsp; ` +
            `#${pad(state.selIdx + 1)}: ${loc}${item.name}`;
    }
    updateHistoryButtons();   // función importada vía ui.js
}

function updateImgCount() {
    dom.imgCount().textContent = `${state.images.length} imágenes`;
}

// Las funciones de ajuste se inyectan desde adjustments.js para
// evitar import circular (adjustments.js → list.js → adjustments.js).
let syncAdjustmentControls = () => {};
export function setSyncAdjustmentsFn(fn) {
    syncAdjustmentControls = fn;
}
