/**
 * state.js · Almacén central del estado de la aplicación
 *
 * Es la ÚNICA fuente de verdad. Cualquier módulo que necesite leer o
 * modificar el estado lo hace a través de las funciones exportadas aquí.
 *
 * Modelo de cada item:
 *   {
 *     id, name, folder, blob, dataUrl, imgObj,
 *     zoom, panX, panY, rotation, fitMode
 *   }
 */

// ── Constantes globales del lienzo ───────────────────────────
export const CANVAS_W  = 1980;
export const CANVAS_H  = 980;
export const MAX_BYTES = 1.5 * 1024 * 1024;
export const MAX_HISTORY = 40;

// ── Estado mutable ────────────────────────────────────────────
export const state = {
    images:    [],   // Array<Item>
    selIdx:    0,
    zipBase:   'Imagenes_Organizadas',
    isDragging: false
};

// ── Pilas de deshacer / rehacer ───────────────────────────────
export const undoStack = [];
export const redoStack = [];

// ── Selectores / IDs especiales ───────────────────────────────
export function genId() {
    return 'i' + Math.random().toString(36).slice(2, 11);
}

/**
 * Devuelve el item actualmente seleccionado o null.
 */
export function getCurrent() {
    if (!state.images.length) return null;
    if (state.selIdx < 0 || state.selIdx >= state.images.length) return null;
    return state.images[state.selIdx];
}

/**
 * Crea una instantánea inmutable del estado para el historial.
 * Solo persistimos los campos escalares (sin blobs ni imgObj).
 */
export function createSnapshot() {
    return {
        images: state.images.map(it => ({
            ...it,
            zoom:     it.zoom     ?? 1,
            panX:     it.panX     ?? 0,
            panY:     it.panY     ?? 0,
            rotation: it.rotation ?? 0,
            fitMode:  it.fitMode  ?? 'contain'
        })),
        selIdx:  state.selIdx,
        // margin se persiste por separado, lo lee el llamador si lo necesita
    };
}

export function pushHistory() {
    undoStack.push(createSnapshot());
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack.length = 0;
}

export function canUndo() { return undoStack.length > 0; }
export function canRedo() { return redoStack.length > 0; }

/**
 * Deshace la última acción. Devuelve el snapshot que se restauró
 * (o null si no había nada que deshacer).
 */
export function undo() {
    if (!undoStack.length) return null;
    redoStack.push(createSnapshot());
    const snap = undoStack.pop();
    applySnapshot(snap);
    return snap;
}

export function redo() {
    if (!redoStack.length) return null;
    undoStack.push(createSnapshot());
    const snap = redoStack.pop();
    applySnapshot(snap);
    return snap;
}

function applySnapshot(snap) {
    state.images = snap.images;
    state.selIdx = Math.min(snap.selIdx, Math.max(0, state.images.length - 1));
}

export function clearHistory() {
    undoStack.length = 0;
    redoStack.length = 0;
}
