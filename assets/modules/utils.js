/**
 * utils.js · Funciones puras y helpers reutilizables
 *
 * No tienen estado, no importan otros módulos.
 */

/** Rellena con ceros a la izquierda: pad(3) -> "03" */
export function pad(n) {
    return String(n).padStart(2, '0');
}

/** sleep asíncrono (cede el event loop) */
export function tick(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
}

/** Quita caracteres no válidos para nombres de archivo/carpeta */
export function sanitizeName(s) {
    return s.replace(/[<>:"/\\|?*]/g, '_');
}

/**
 * Agrupa items por carpeta. La clave `'__root__'` representa imágenes
 * que no están dentro de ninguna subcarpeta del ZIP.
 */
export function groupByFolder(imgs) {
    const map = new Map();
    imgs.forEach(item => {
        const key = item.folder || '__root__';
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
    });
    return map;
}

/** Convierte un Blob a un Data URL (string base64) */
export function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload  = () => resolve(r.result);
        r.onerror = () => reject(r.error);
        r.readAsDataURL(blob);
    });
}

/** Carga un Data URL en un HTMLImageElement y resuelve cuando está lista */
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => reject(new Error('No se pudo decodificar la imagen'));
        img.src = src;
    });
}

/** Trunca un nombre largo añadiendo "…" */
export function truncate(s, max = 28) {
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

/** Alterna el modo pantalla completa del navegador */
export function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen?.();
    }
}
