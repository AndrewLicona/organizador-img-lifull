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

// Indicador de versión en el title (debug de caché)
// Si ves "build b9bbf55" o más reciente en la pestaña del navegador,
// tu caché está limpia. Si ves otra cosa, presiona Ctrl+Shift+R.
if (typeof document !== 'undefined') {
    const prevTitle = document.title;
    document.title = '[v' + (window.__BUILD__ || '?') + '] ' + prevTitle;
    document.body.setAttribute('data-build', window.__BUILD__ || 'desconocido');
    console.log('%c[Organizador] build = ' + (window.__BUILD__ || '?'),
        'background:#89b4fa;color:#0c0c14;padding:2px 6px;border-radius:3px;font-weight:700');

    // Indicador VISIBLE en la cabecera (no solo en el title)
    const brand = document.querySelector('.brand__sub');
    if (brand) {
        const buildTag = document.createElement('span');
        buildTag.style.cssText = 'margin-left:10px;padding:2px 7px;background:#89b4fa;color:#0c0c14;border-radius:3px;font-family:monospace;font-size:10px;font-weight:700;letter-spacing:0.5px;';
        buildTag.textContent = 'build ' + (window.__BUILD__ || '?');
        buildTag.title = 'Si este build NO coincide con el ultimo commit en GitHub, presiona Ctrl+Shift+R para borrar la cache';
        brand.appendChild(buildTag);
    }

    // ── Botón DEMO: inyecta 5 imágenes de prueba sin file picker ──
    // Útil para diagnosticar si el problema es el file dialog o el flujo de import.
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        const demoBtn = document.createElement('button');
        demoBtn.className = 'btn-secondary';
        demoBtn.textContent = '[Demo] Cargar 5 imágenes';
        demoBtn.title = 'Inyecta 5 imágenes de prueba (no requiere seleccionar archivos)';
        demoBtn.style.cssText = 'background:#45475a;color:#a6e3a1;border:1px dashed #a6e3a1;';
        demoBtn.addEventListener('click', loadDemoImages);
        headerActions.insertBefore(demoBtn, headerActions.firstChild);
    }
}

async function loadDemoImages() {
    const { state, genId } = await import('./modules/state.js');
    const { rebuildList } = await import('./modules/list.js');
    const { renderCanvas } = await import('./modules/canvas.js');
    const { showToast } = await import('./modules/ui.js');

    const colors = ['#89b4fa', '#a6e3a1', '#fab387', '#f38ba8', '#cba6f7'];
    const labels = ['Demo 1', 'Demo 2', 'Demo 3', 'Demo 4', 'Demo 5'];
    for (let i = 0; i < 5; i++) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400">
            <rect width="640" height="400" fill="${colors[i]}"/>
            <text x="320" y="210" text-anchor="middle" fill="#0c0c14" font-size="64" font-weight="bold">${labels[i]}</text>
        </svg>`;
        const dataUrl = 'data:image/svg+xml;base64,' + btoa(svg);
        // Cargar como imagen real
        const img = new Image();
        await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            img.src = dataUrl;
        });
        state.images.push({
            id: genId(),
            name: `demo_${i+1}.svg`,
            folder: '',
            blob: null,
            dataUrl,
            imgObj: img,
            zoom: 1, panX: 0, panY: 0, rotation: 0, fitMode: 'contain'
        });
    }
    state.selIdx = 0;
    rebuildList();
    renderCanvas();
    showToast('5 imágenes DEMO inyectadas', 'ok');
}
