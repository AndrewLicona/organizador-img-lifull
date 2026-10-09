/**
 * importer.js · Carga de imágenes y extracción de ZIPs
 *
 *  - handleFiles(fileList)  : entry point (desde input o file drop)
 *  - processZip(file)       : extrae las entradas de un ZIP
 *  - addImage(blob, name, folder) : añade un item al estado
 *
 * Formatos aceptados (carpeta ZIP): png, jpg, jpeg, webp, bmp, gif
 */

import { state, genId, pushHistory } from './state.js';
import { rebuildList, updateStatus } from './list.js';
import { renderCanvas } from './canvas.js';
import { showProgress, updateProgress, hideProgress, showToast } from './ui.js';
import { tick, blobToDataURL, loadImage } from './utils.js';

const ZIP_IMAGE_RE = /\.(png|jpe?g|webp|bmp|gif)$/i;

export async function handleFiles(files) {
    if (!files || !files.length) return;

    showProgress('Cargando imágenes...', 'Extrayendo y generando miniaturas');
    pushHistory();
    try {
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            updateProgress(i + 1, files.length, `Leyendo ${f.name}...`);
            if (f.name.toLowerCase().endsWith('.zip')) {
                state.zipBase = f.name.replace(/\.zip$/i, '');
                await processZip(f);
            } else if (f.type.startsWith('image/')) {
                await addImage(f, f.name, '');
            }
            await tick(6);
        }
    } finally {
        hideProgress();
    }

    if (state.images.length > 0) {
        state.selIdx = 0;
        try {
            rebuildList();
            renderCanvas();
            showToast(`${state.images.length} imágenes cargadas`, 'ok');
        } catch (err) {
            console.error('[importer] Error en render:', err);
            showToast(`Error al mostrar: ${err.message}`, 'error');
        }
    } else {
        showToast('Ninguna imagen valida en el archivo', 'warn');
    }
}

async function processZip(file) {
    try {
        const zip     = await JSZip.loadAsync(file);
        const entries = Object.keys(zip.files).sort();
        for (let i = 0; i < entries.length; i++) {
            const key   = entries[i];
            const entry = zip.files[key];
            if (entry.dir) continue;
            if (!key.toLowerCase().match(ZIP_IMAGE_RE)) continue;
            updateProgress(i + 1, entries.length, `Extrayendo ${key.split('/').pop()}...`);
            const blob   = await entry.async('blob');
            const parts  = key.split('/');
            const name   = parts.pop();
            const folder = parts.join('/') || '';
            await addImage(blob, name, folder);
        }
    } catch (err) {
        showToast('Error en ZIP: ' + err.message, 'error');
    }
}

async function addImage(blob, name, folder) {
    try {
        const dataUrl = await blobToDataURL(blob);
        const img     = await loadImage(dataUrl);
        state.images.push({
            id:       genId(),
            name,
            folder,
            blob,
            dataUrl,
            imgObj:   img,
            zoom:     1,
            panX:     0,
            panY:     0,
            rotation: 0,
            fitMode:  'contain'
        });
    } catch (err) {
        // No interrumpimos el lote: avisamos y seguimos con el resto
        console.warn('[importer] No se pudo añadir', name, err);
    }
}
