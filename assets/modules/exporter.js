/**
 * exporter.js · Exportación a carpeta o ZIP
 *
 *  - getBestBlob(canvas)        : comprime hasta <= MAX_BYTES, PNG o JPEG
 *  - openSaveFolderDlg()        : dialog → saveToFolder
 *  - saveToFolder(rootName)     : usa File System Access API
 *  - openExportZipDlg()         : dialog → _exportZipWithName
 *  - _exportZipWithName(name)   : usa JSZip → descarga directa
 *
 * Si el navegador no soporta FS Access API, hace fallback a ZIP.
 */

import { state, MAX_BYTES } from './state.js';
import { dom } from './dom.js';
import { drawOnCanvas, createExportCanvas } from './canvas.js';
import { showProgress, updateProgress, hideProgress, showToast, askName } from './ui.js';
import { groupByFolder, tick, pad, sanitizeName } from './utils.js';

/** Devuelve el blob más liviano posible sin pasar MAX_BYTES. */
export async function getBestBlob(canvas) {
    let blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    if (blob?.size <= MAX_BYTES) return { blob, ext: '.png' };
    for (const q of [0.95, 0.90, 0.85, 0.80, 0.72]) {
        blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', q));
        if (blob?.size <= MAX_BYTES) return { blob, ext: '.jpg' };
    }
    return { blob, ext: '.jpg' };
}

// ── Guardar en carpeta (FS Access API) ────────────────────────
export async function openSaveFolderDlg() {
    if (!state.images.length) { showToast('No hay imágenes para guardar', 'warn'); return; }
    const folderName = await askName(
        'Guardar en Carpeta',
        'Nombre de la carpeta donde se organizarán las imágenes.',
        state.zipBase || 'Imagenes_Organizadas'
    );
    if (!folderName) return;
    await saveToFolder(sanitizeName(folderName.trim()));
}

async function saveToFolder(rootName) {
    if (typeof window.showDirectoryPicker !== 'function') {
        showToast('Navegador sin File System API. Descargando ZIP...', 'warn');
        await tick(1200);
        await _exportZipWithName(rootName);
        return;
    }

    let dirHandle;
    try {
        dirHandle = await window.showDirectoryPicker({
            mode: 'readwrite', startIn: 'documents'
        });
    } catch (err) {
        if (err.name === 'AbortError') { showToast('Operación cancelada', 'warn'); return; }
        showToast('Carpeta protegida por el navegador. Descargando ZIP...', 'warn');
        await tick(1500);
        await _exportZipWithName(rootName);
        return;
    }
    if (!dirHandle) return;

    showToast('Carpeta seleccionada. Guardando...', 'ok');
    const exp = createExportCanvas();
    showProgress(`Guardando en "${rootName}"...`, `Organizando ${state.images.length} imágenes`);

    try {
        const rootDir = await dirHandle.getDirectoryHandle(rootName, { create: true });
        const groups = groupByFolder(state.images);
        let globalNum = 1;

        for (const [folder, items] of groups) {
            let targetDir = rootDir;
            if (folder !== '__root__' && folder !== '') {
                for (const part of folder.split('/')) {
                    const safe = part.replace(/[<>:"|?*]/g, '_');
                    if (safe) targetDir = await targetDir.getDirectoryHandle(safe, { create: true });
                }
            }

            let folderNum = 1;
            for (const item of items) {
                updateProgress(globalNum, state.images.length, `Guardando ${globalNum}/${state.images.length}...`);
                drawOnCanvas(exp, item);
                const { blob, ext } = await getBestBlob(exp);
                const fh = await targetDir.getFileHandle(pad(folderNum) + ext, { create: true });
                const wr = await fh.createWritable();
                await wr.write(blob);
                await wr.close();
                folderNum++;
                globalNum++;
                await tick(8);
            }
        }
        showToast(`${state.images.length} imágenes guardadas en "${rootName}"`, 'ok');
    } catch (err) {
        showToast(`Error al guardar: ${err.message}`, 'error');
    } finally {
        hideProgress();
    }
}

// ── Exportar como ZIP ─────────────────────────────────────────
export async function openExportZipDlg() {
    if (!state.images.length) { showToast('No hay imágenes para exportar', 'warn'); return; }
    const name = await askName(
        'Exportar como ZIP',
        'Nombre del archivo ZIP. La estructura de carpetas se preservará.',
        state.zipBase || 'Imagenes_Organizadas'
    );
    if (!name) return;
    await _exportZipWithName(sanitizeName(name.trim()));
}

async function _exportZipWithName(rootName) {
    const exp    = createExportCanvas();
    const zipOut = new JSZip();
    showProgress(`Generando "${rootName}.zip"...`, `Empaquetando ${state.images.length} imágenes`);

    try {
        const groups = groupByFolder(state.images);
        let globalNum = 1;

        for (const [folder, items] of groups) {
            const folderPath = (folder !== '__root__' && folder !== '')
                ? `${rootName}/${folder}/`
                : `${rootName}/`;

            let folderNum = 1;
            for (const item of items) {
                updateProgress(globalNum, state.images.length, `Empaquetando ${globalNum}/${state.images.length}...`);
                drawOnCanvas(exp, item);
                const { blob, ext } = await getBestBlob(exp);
                zipOut.file(folderPath + pad(folderNum) + ext, blob);
                folderNum++;
                globalNum++;
                await tick(8);
            }
        }

        updateProgress(state.images.length, state.images.length, 'Comprimiendo ZIP...');
        const content = await zipOut.generateAsync({
            type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 }
        });
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(content), download: rootName + '.zip'
        });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        showToast(`ZIP "${rootName}.zip" descargado`, 'ok');
    } finally {
        hideProgress();
    }
}
