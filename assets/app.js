/**
 * app.js · Entry point de la versión Web del Organizador de Imágenes
 *
 * Estructura modular (ver /assets/modules):
 *   state · dom · utils · ui · list · dnd · canvas · canvas-interactions
 *   adjustments · selection · items · importer · exporter · keyboard
 *
 * Este archivo solo:
 *   1. Detecta si la app se sirve por `file://` (módulos no cargarían)
 *   2. Inicializa cada módulo y conecta callbacks
 *   3. Expone a `window.*` las funciones que el HTML invoca con onclick=""
 *   4. Dispara el primer render
 */

import { state, undo, redo, pushHistory } from './modules/state.js';
import { dom } from './modules/dom.js';
import { toggleFullscreen } from './modules/utils.js';
import { initList, rebuildList, updateStatus } from './modules/list.js';
import { initDnd, initFileDrop } from './modules/dnd.js';
import { renderCanvas } from './modules/canvas.js';
import { initCanvasInteractions } from './modules/canvas-interactions.js';
import { initKeyboard } from './modules/keyboard.js';
import { updateHistoryButtons, showToast } from './modules/ui.js';
import { selectItem, prevImg, nextImg } from './modules/selection.js';
import { moveItem, deleteItem, clearList } from './modules/items.js';
import {
    changeZoom, changeFitMode, rotateImg, resetAdjustments, changeGlobalMargin
} from './modules/adjustments.js';
import { handleFiles } from './modules/importer.js';
import { openSaveFolderDlg, openExportZipDlg } from './modules/exporter.js';

// ── 1. Guard: si se abre por file:// los módulos no cargan ─────
if (location.protocol === 'file:') {
    showFileProtocolOverlay();
}

function showFileProtocolOverlay() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(15,15,23,0.96);
        display: flex; align-items: center; justify-content: center;
        z-index: 99999; color: #cdd6f4; font-family: 'Segoe UI', system-ui, sans-serif;
        padding: 24px; text-align: center;
    `;
    overlay.innerHTML = `
        <div style="max-width:520px;background:#161622;border:1px solid #89b4fa;border-radius:14px;padding:32px 28px;line-height:1.55;">
            <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
            <h2 style="color:#89b4fa;margin:0 0 12px;font-size:20px;">Esta app debe servirse por HTTP</h2>
            <p style="margin:0 0 18px;color:#9399b2;">
                Los módulos de JavaScript no funcionan cuando abres
                <code style="background:#1e1e2e;padding:2px 6px;border-radius:4px;">index.html</code>
                directamente con doble clic (protocolo <code>file://</code>).
            </p>
            <p style="margin:0 0 22px;color:#cdd6f4;">
                Ejecuta <code style="background:#1e1e2e;padding:3px 8px;border-radius:4px;color:#a6e3a1;font-weight:700;">iniciar_web.bat</code>
                para iniciar un servidor local en
                <code style="background:#1e1e2e;padding:2px 6px;border-radius:4px;">http://localhost:8080</code>.
            </p>
            <p style="margin:0;font-size:13px;color:#9399b2;">
                ¿No tienes Python? Instálalo desde
                <a href="https://www.python.org/downloads/" target="_blank" style="color:#89b4fa;">python.org</a>
                o usa la versión de escritorio (doble clic en el acceso directo).
            </p>
        </div>
    `;
    document.body.appendChild(overlay);
    return;   // No seguimos inicializando — el navegador no cargó los módulos
}

// ── 2. Wiring de callbacks entre módulos ──────────────────────
initList({
    onSelect: selectItem,
    onMove:   moveItem,
    onDelete: deleteItem
});

initDnd({
    onCommitReorder: () => {
        // Hook por si en el futuro se quiere reaccionar al reorder
    }
});

// El botón "Cargar" usa el <input type="file"> directamente
const fileInput = dom.fileInput();
if (fileInput) {
    fileInput.addEventListener('change', e => handleFiles(Array.from(e.target.files)));
}

// El margen global lo maneja el `oninput` inline del HTML (changeGlobalMargin)

// ── 3. Exponer handlers globales que el HTML invoca con onclick="..." ─
window.undo                = () => { doHistory(undo,  'deshecha',  'Nada que deshacer'); };
window.redo                = () => { doHistory(redo,  'rehecha',   'Nada que rehacer');  };
window.prevImg             = prevImg;
window.nextImg             = nextImg;
window.clearList           = clearList;
window.toggleFS            = toggleFullscreen;
window.changeZoom          = changeZoom;
window.changeGlobalMargin  = changeGlobalMargin;
window.changeFitMode       = changeFitMode;
window.rotateImg           = rotateImg;
window.resetAdjustments    = resetAdjustments;
window.openSaveFolderDlg   = openSaveFolderDlg;
window.openExportZipDlg    = openExportZipDlg;
window.handleFiles         = handleFiles;   // (no usado, por si se llama manualmente)

function doHistory(fn, okMsg, emptyMsg) {
    const beforeImages = state.images.length;
    const snap = fn();
    if (!snap) { showToast(emptyMsg, 'warn'); return; }
    rebuildList();
    renderCanvas();
    updateStatus();
    updateHistoryButtons();
    showToast(`Acción ${okMsg}`, 'ok');
    // Si el redo/undo eliminó todo, evitemos seleccionar índices inválidos
    if (state.images.length !== beforeImages) {
        if (state.selIdx >= state.images.length) {
            state.selIdx = Math.max(0, state.images.length - 1);
        }
    }
}

// ── 4. Inicialización de subsistemas ──────────────────────────
// (SortableJS se inicializa la primera vez vía rebuildList → refreshSortables)
initFileDrop();
initCanvasInteractions();
initKeyboard();

// ── 5. Render inicial ─────────────────────────────────────────
rebuildList();
renderCanvas();
updateHistoryButtons();
updateStatus();

// Indicador de versión en consola y title (debug de caché)
if (typeof document !== 'undefined') {
    document.body.setAttribute('data-build', window.__BUILD__ || 'desconocido');
    console.log('%c[Organizador] build = ' + (window.__BUILD__ || 'dev'),
        'background:#89b4fa;color:#0c0c14;padding:2px 6px;border-radius:3px;font-weight:700');
}
