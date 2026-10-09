/**
 * dom.js · Referencias cacheadas al DOM + biblioteca de iconos SVG
 *
 * Centraliza todos los `getElementById` para evitar accesos repetidos
 * al DOM y para que cualquier módulo pueda pedir una referencia.
 */

// ── Referencias al DOM ────────────────────────────────────────
export const $ = id => document.getElementById(id);

export const dom = {
    sortableList:    () => $('sortableList'),
    mainCanvas:      () => $('mainCanvas'),
    placeholder:     () => $('placeholder'),
    canvasTitle:     () => $('canvasTitle'),
    navCounter:      () => $('navCounter'),
    marginInput:     () => $('marginInput'),
    fileInput:       () => $('fileInput'),
    dropZone:        () => $('dropZone'),
    statusText:      () => $('statusText'),
    imgCount:        () => $('imgCount'),
    zoomRange:       () => $('zoomRange'),
    zoomVal:         () => $('zoomVal'),
    fitModeSelect:   () => $('fitModeSelect'),
    btnUndo:         () => $('btnUndo'),
    btnRedo:         () => $('btnRedo'),

    // Modal de nombre
    nameDialog:      () => $('nameDialog'),
    dlgTitle:        () => $('dlgTitle'),
    dlgDesc:         () => $('dlgDesc'),
    dlgInput:        () => $('dlgInput'),
    dlgConfirmBtn:   () => $('dlgConfirmBtn'),

    // Modal de progreso
    progressModal:   () => $('progressModal'),
    progTitle:       () => $('progTitle'),
    progSub:         () => $('progSub'),
    progFill:        () => $('progFill'),
    progText:        () => $('progText'),
    progPercent:     () => $('progPercent'),

    // Toast
    toast:           () => $('toast'),
    toastIcon:       () => $('toastIcon'),
    toastMsg:        () => $('toastMsg')
};

// ── Biblioteca de iconos SVG ──────────────────────────────────
const SVG_ICONS = {
    image: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
           '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' +
           '<polyline points="21 15 16 10 5 21"/></svg>',
    folder: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
            '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
    clock: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
           '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    'chevron-down': '<svg class="icon icon-chevron" style="transition:transform 0.2s" viewBox="0 0 24 24" ' +
                    'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
                    '<polyline points="6 9 12 15 18 9"/></svg>'
};

export function svgIcon(name) {
    return SVG_ICONS[name] || '';
}

// Iconos para el sistema de toasts
const TOAST_ICONS = {
    ok:     '<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    warn:   '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
    error:  '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    move:   '<polyline points="17 1 21 5 17 9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M3 11V9a4 4 0 014-4h14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
    delete: '<polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" fill="none"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" stroke-width="2" fill="none"/>',
    clear:  '<line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
};

export function toastIcon(type) {
    return TOAST_ICONS[type] || TOAST_ICONS.ok;
}
