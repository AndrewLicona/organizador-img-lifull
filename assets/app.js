// ════════════════════════════════════════════════════════════
// app.js · Organizador de Imágenes v5.0
// Incluye: Undo/Redo (Ctrl+Z / Ctrl+Y), Ajustes Individuales
// (Zoom, Pan/Arrastre en lienzo, Rotación 90°, Fit Contain/Cover),
// Guardar en Carpeta (Escritorio / Descargas) y ZIP con subcarpetas.
// ════════════════════════════════════════════════════════════

/* ── ESTADO GLOBAL ────────────────────────────────────────── */
const CANVAS_W  = 1980;
const CANVAS_H  = 980;
const MAX_BYTES = 1.5 * 1024 * 1024;

// Cada entrada:
// { id, name, folder, blob, dataUrl, imgObj, zoom, panX, panY, rotation, fitMode }
let images       = [];
let selIdx       = 0;
let zipBase      = 'Imagenes_Organizadas';
let isDragging   = false;
let toastTimer   = null;
let _dlgResolve  = null;

// Pila de deshacer / rehacer
const undoStack = [];
const redoStack = [];
const MAX_HISTORY = 40;

// Variables de interacción con el lienzo (Pan)
let isCanvasPanning = false;
let panStartX = 0;
let panStartY = 0;
let initialPanX = 0;
let initialPanY = 0;

/* ── DOM REFS ─────────────────────────────────────────────── */
const sortableList   = document.getElementById('sortableList');
const mainCanvas     = document.getElementById('mainCanvas');
const placeholder    = document.getElementById('placeholder');
const canvasTitle    = document.getElementById('canvasTitle');
const navCounter     = document.getElementById('navCounter');
const marginInput    = document.getElementById('marginInput');
const fileInput      = document.getElementById('fileInput');
const dropZone       = document.getElementById('dropZone');
const statusText     = document.getElementById('statusText');
const imgCount       = document.getElementById('imgCount');
const zoomRange      = document.getElementById('zoomRange');
const zoomVal        = document.getElementById('zoomVal');
const fitModeSelect  = document.getElementById('fitModeSelect');
const btnUndo        = document.getElementById('btnUndo');
const btnRedo        = document.getElementById('btnRedo');

/* ── SORTABLEJS ───────────────────────────────────────────── */
const sortableInst = new Sortable(sortableList, {
    animation: 160,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    ghostClass:  'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass:   'sortable-drag',
    handle:      '.drag-handle',
    forceFallback: false,
    delay: 0,
    delayOnTouchOnly: true,
    onStart() { isDragging = true; },
    onEnd(evt) {
        isDragging = false;
        if (evt.oldIndex === evt.newIndex) return;
        pushHistory();
        const item = images.splice(evt.oldIndex, 1)[0];
        images.splice(evt.newIndex, 0, item);
        selIdx = evt.newIndex;
        patchBadges();
        updateActiveClass();
        renderCanvas();
        updateStatus();
        showToast(`Reordenado: "${item.name}" → #${pad(evt.newIndex + 1)}`, 'move');
    }
});

/* ════════════════════════════════════════════════════════════
   SISTEMA DE DESHACER / REHACER (UNDO / REDO)
═══════════════════════════════════════════════════════════ */
function createSnapshot() {
    return {
        images: images.map(item => ({
            ...item,
            // Copia de propiedades primitivas
            zoom: item.zoom || 1,
            panX: item.panX || 0,
            panY: item.panY || 0,
            rotation: item.rotation || 0,
            fitMode: item.fitMode || 'contain'
        })),
        selIdx,
        margin: parseInt(marginInput?.value) || 50
    };
}

function pushHistory() {
    undoStack.push(createSnapshot());
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack.length = 0; // vaciar redo en nueva acción
    updateHistoryButtons();
}

function undo() {
    if (!undoStack.length) {
        showToast('Nada que deshacer', 'warn');
        return;
    }
    redoStack.push(createSnapshot());
    const snapshot = undoStack.pop();
    restoreSnapshot(snapshot);
    showToast('Acción deshecha', 'ok');
}

function redo() {
    if (!redoStack.length) {
        showToast('Nada que rehacer', 'warn');
        return;
    }
    undoStack.push(createSnapshot());
    const snapshot = redoStack.pop();
    restoreSnapshot(snapshot);
    showToast('Acción rehecha', 'ok');
}

function restoreSnapshot(snapshot) {
    images = snapshot.images;
    selIdx = Math.min(snapshot.selIdx, Math.max(0, images.length - 1));
    if (marginInput) marginInput.value = snapshot.margin;
    rebuildList();
    syncAdjustmentControls();
    renderCanvas();
    updateStatus();
    updateHistoryButtons();
}

function updateHistoryButtons() {
    if (btnUndo) btnUndo.disabled = undoStack.length === 0;
    if (btnRedo) btnRedo.disabled = redoStack.length === 0;
}

/* ════════════════════════════════════════════════════════════
   PATCH DOM — actualizar sin destruir nodos
═══════════════════════════════════════════════════════════ */
function rebuildList() {
    if (images.length === 0) {
        sortableList.innerHTML = `
            <div class="no-items-msg">
                <svg style="width:34px;height:34px;color:var(--border)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <strong>Ninguna imagen cargada</strong>
                <p>Carga un ZIP o imágenes sueltas.<br>Las carpetas del ZIP se agrupan automáticamente.</p>
            </div>`;
        placeholder.style.display = 'flex';
        mainCanvas.style.display  = 'none';
        canvasTitle.innerHTML     = svgIcon('image') + ' Ninguna imagen seleccionada';
        navCounter.textContent    = '0 / 0';
        imgCount.textContent      = '0 imágenes';
        statusText.innerHTML      = '<span class="status-dot"></span>Listo para cargar imágenes';
        return;
    }

    sortableList.innerHTML = '';
    placeholder.style.display = 'none';
    mainCanvas.style.display  = 'block';

    const groups = groupByFolder(images);
    let globalIdx = 0;

    for (const [folder, items] of groups) {
        if (folder !== '__root__') {
            const gh = document.createElement('div');
            gh.className = 'folder-group';
            gh.innerHTML = `
                <div class="folder-group__header" onclick="toggleGroup(this)">
                    ${svgIcon('folder')}
                    <span>${folder}</span>
                    <span class="folder-group__count">${items.length}</span>
                    ${svgIcon('chevron-down')}
                </div>
                <div class="folder-group__items"></div>
            `;
            sortableList.appendChild(gh);
            const container = gh.querySelector('.folder-group__items');
            items.forEach(item => {
                const i = images.indexOf(item);
                container.appendChild(createCard(item, i, globalIdx++));
            });
        } else {
            items.forEach(item => {
                const i = images.indexOf(item);
                sortableList.appendChild(createCard(item, i, globalIdx++));
            });
        }
    }

    patchBadges();
    updateActiveClass();
    updateStatus();
    syncAdjustmentControls();
    imgCount.textContent = `${images.length} imágenes`;
}

function groupByFolder(imgs) {
    const map = new Map();
    imgs.forEach(item => {
        const key = item.folder || '__root__';
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
    });
    return map;
}

function toggleGroup(header) {
    const items = header.nextElementSibling;
    const isOpen = items.style.display !== 'none';
    items.style.display = isOpen ? 'none' : 'flex';
    const chevron = header.querySelector('.icon-chevron');
    if (chevron) chevron.style.transform = isOpen ? 'rotate(-90deg)' : '';
}

function createCard(item, dataIdx, visualIdx) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.id = item.id;

    card.addEventListener('click', (e) => {
        if (isDragging) return;
        if (e.target.closest('.item-btns')) return;
        const i = images.findIndex(x => x.id === item.id);
        if (i >= 0) selectItem(i);
    });

    const shortName = item.name.length > 28 ? item.name.slice(0, 25) + '…' : item.name;

    card.innerHTML = `
        <span class="drag-handle" title="Arrastra para reordenar">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
        </span>
        <span class="pos-badge">#${pad(visualIdx + 1)}</span>
        <div class="item-thumb">
            <img src="${item.dataUrl}" alt="${item.name}" loading="lazy">
        </div>
        <div class="item-details">
            <div class="item-name" title="${item.name}">${shortName}</div>
        </div>
        <div class="item-btns">
            ${dataIdx > 0
                ? `<button class="btn-mini" title="Subir (↑)" onclick="moveItem('${item.id}',-1,event)"><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg></button>`
                : ''}
            ${dataIdx < images.length - 1
                ? `<button class="btn-mini" title="Bajar (↓)" onclick="moveItem('${item.id}',+1,event)"><svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></button>`
                : ''}
            <button class="btn-danger" onclick="deleteItem('${item.id}',event)" title="Eliminar (Supr)">
                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button>
        </div>
    `;
    return card;
}

function patchBadges() {
    const cards = sortableList.querySelectorAll('.item-card');
    cards.forEach((card, i) => {
        const badge = card.querySelector('.pos-badge');
        if (badge) badge.textContent = '#' + pad(i + 1);
    });
    imgCount.textContent = `${images.length} imágenes`;
}

function updateActiveClass() {
    const cards = sortableList.querySelectorAll('.item-card');
    cards.forEach((card, i) => {
        card.classList.toggle('active', i === selIdx);
    });
    const active = sortableList.querySelector('.item-card.active');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* ════════════════════════════════════════════════════════════
   SELECCIÓN Y AJUSTES INDIVIDUALES
═══════════════════════════════════════════════════════════ */
function selectItem(idx) {
    if (idx < 0 || idx >= images.length) return;
    selIdx = idx;
    updateActiveClass();
    syncAdjustmentControls();
    renderCanvas();
    updateStatus();
}

function prevImg() { if (selIdx > 0) selectItem(selIdx - 1); }
function nextImg() { if (selIdx < images.length - 1) selectItem(selIdx + 1); }

function syncAdjustmentControls() {
    if (!images.length || selIdx >= images.length) return;
    const cur = images[selIdx];
    const zoom = Math.round((cur.zoom || 1) * 100);
    if (zoomRange) zoomRange.value = zoom;
    if (zoomVal) zoomVal.textContent = zoom + '%';
    if (fitModeSelect) fitModeSelect.value = cur.fitMode || 'contain';
}

function changeZoom(val) {
    if (!images.length || selIdx >= images.length) return;
    const cur = images[selIdx];
    cur.zoom = parseFloat(val) / 100;
    if (zoomVal) zoomVal.textContent = val + '%';
    renderCanvas();
}

function changeFitMode(val) {
    if (!images.length || selIdx >= images.length) return;
    pushHistory();
    images[selIdx].fitMode = val;
    renderCanvas();
    showToast(`Modo: ${val === 'cover' ? 'Llenar lienzo' : 'Contener completo'}`, 'ok');
}

function rotateImg(deltaDeg = 90) {
    if (!images.length || selIdx >= images.length) return;
    pushHistory();
    const cur = images[selIdx];
    cur.rotation = ((cur.rotation || 0) + deltaDeg) % 360;
    renderCanvas();
    showToast(`Rotación: ${cur.rotation}°`, 'ok');
}

function resetAdjustments() {
    if (!images.length || selIdx >= images.length) return;
    pushHistory();
    const cur = images[selIdx];
    cur.zoom = 1;
    cur.panX = 0;
    cur.panY = 0;
    cur.rotation = 0;
    cur.fitMode = 'contain';
    syncAdjustmentControls();
    renderCanvas();
    showToast('Ajustes restablecidos', 'ok');
}

function changeGlobalMargin(val) {
    renderCanvas();
}

/* ════════════════════════════════════════════════════════════
   TECLADO (Ctrl+Z, Ctrl+Y, Flechas, Supr)
═══════════════════════════════════════════════════════════ */
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    // Deshacer / Rehacer
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
        return;
    }

    if (!images.length) return;

    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            prevImg();
            break;
        case 'ArrowRight':
            e.preventDefault();
            nextImg();
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (selIdx > 0) moveItem(images[selIdx].id, -1, null);
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (selIdx < images.length - 1) moveItem(images[selIdx].id, +1, null);
            break;
        case 'Delete':
        case 'Backspace':
            if (selIdx >= 0 && selIdx < images.length) {
                e.preventDefault();
                deleteItem(images[selIdx].id, null);
            }
            break;
    }
});

/* ════════════════════════════════════════════════════════════
   INTERACCIÓN CON EL LIENZO (ARRASTRE / PAN CON RATÓN)
═══════════════════════════════════════════════════════════ */
mainCanvas.addEventListener('mousedown', (e) => {
    if (!images.length || selIdx >= images.length) return;
    isCanvasPanning = true;
    mainCanvas.classList.add('panning');
    panStartX = e.clientX;
    panStartY = e.clientY;
    const cur = images[selIdx];
    initialPanX = cur.panX || 0;
    initialPanY = cur.panY || 0;
});

window.addEventListener('mousemove', (e) => {
    if (!isCanvasPanning || !images.length || selIdx >= images.length) return;
    const cur = images[selIdx];
    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;

    // Relación de escala en pantalla
    const rect = mainCanvas.getBoundingClientRect();
    const scaleFactor = CANVAS_W / (rect.width || 1);

    cur.panX = initialPanX + (dx * scaleFactor);
    cur.panY = initialPanY + (dy * scaleFactor);
    renderCanvas();
});

window.addEventListener('mouseup', () => {
    if (isCanvasPanning) {
        isCanvasPanning = false;
        mainCanvas.classList.remove('panning');
    }
});

// Zoom con la rueda del ratón sobre el lienzo
mainCanvas.addEventListener('wheel', (e) => {
    if (!images.length || selIdx >= images.length) return;
    e.preventDefault();
    const cur = images[selIdx];
    let z = (cur.zoom || 1) + (e.deltaY < 0 ? 0.05 : -0.05);
    z = Math.max(0.5, Math.min(2.5, z));
    cur.zoom = z;
    syncAdjustmentControls();
    renderCanvas();
}, { passive: false });

/* ════════════════════════════════════════════════════════════
   MOVER Y BORRAR
═══════════════════════════════════════════════════════════ */
function moveItem(id, delta, event) {
    if (event) event.stopPropagation();
    const from = images.findIndex(x => x.id === id);
    const to   = from + delta;
    if (from < 0 || to < 0 || to >= images.length) return;
    pushHistory();
    const item = images.splice(from, 1)[0];
    images.splice(to, 0, item);
    selIdx = to;
    rebuildList();
    renderCanvas();
    showToast(`Movido: "${item.name}" → #${pad(to + 1)}`, 'move');
}

function deleteItem(id, event) {
    if (event) event.stopPropagation();
    const idx = images.findIndex(x => x.id === id);
    if (idx < 0) return;
    pushHistory();
    const removed = images.splice(idx, 1)[0];
    if (selIdx >= images.length) selIdx = Math.max(0, images.length - 1);
    rebuildList();
    renderCanvas();
    showToast(`Eliminada: "${removed.name}"`, 'delete');
}

function clearList() {
    if (!images.length) return;
    if (!confirm('¿Deseas vaciar todas las imágenes de la lista?')) return;
    pushHistory();
    images = [];
    selIdx = 0;
    rebuildList();
    renderCanvas();
    showToast('Lista vaciada', 'clear');
}

/* ════════════════════════════════════════════════════════════
   CARGA DE ARCHIVOS
═══════════════════════════════════════════════════════════ */
fileInput.addEventListener('change', e => handleFiles(Array.from(e.target.files)));

window.addEventListener('dragover', e => {
    if (isDragging) return;
    if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        dropZone.style.display = 'flex';
    }
});
window.addEventListener('dragleave', e => {
    if (isDragging) return;
    if (e.clientX <= 0 || e.clientY <= 0 ||
        e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)
        dropZone.style.display = 'none';
});
window.addEventListener('drop', e => {
    if (isDragging) return;
    dropZone.style.display = 'none';
    if (e.dataTransfer?.files?.length) {
        e.preventDefault();
        handleFiles(Array.from(e.dataTransfer.files));
    }
});

async function handleFiles(files) {
    showProgress('Cargando imágenes...', 'Extrayendo y generando miniaturas');
    pushHistory();
    try {
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            updateProgress(i + 1, files.length, `Leyendo ${f.name}...`);
            if (f.name.toLowerCase().endsWith('.zip')) {
                zipBase = f.name.replace(/\.zip$/i, '');
                await processZip(f);
            } else if (f.type.startsWith('image/')) {
                await addImage(f, f.name, '');
            }
            await tick(6);
        }
    } finally {
        hideProgress();
    }
    if (images.length > 0) {
        selIdx = 0;
        rebuildList();
        renderCanvas();
        showToast(`${images.length} imágenes cargadas`, 'ok');
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
            if (!key.toLowerCase().match(/\.(png|jpe?g|webp|bmp|gif)$/)) continue;
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

function addImage(blob, name, folder) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => {
            const dataUrl = e.target.result;
            const img     = new Image();
            img.onload = () => {
                images.push({
                    id:       'i' + Math.random().toString(36).slice(2, 11),
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
                resolve();
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(blob);
    });
}

/* ════════════════════════════════════════════════════════════
   MOTOR DE DIBUJO EN EL LIENZO 1980×980
═══════════════════════════════════════════════════════════ */
function drawOnCanvas(targetCanvas, item) {
    const ctx    = targetCanvas.getContext('2d');
    const margin = Math.max(0, parseInt(marginInput?.value) || 50);

    // Fondo blanco nítido
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (!item?.imgObj) {
        ctx.restore();
        return;
    }

    const availW = Math.max(10, CANVAS_W - 2 * margin);
    const availH = Math.max(10, CANVAS_H - 2 * margin);

    const fitMode  = item.fitMode || 'contain';
    const zoom     = item.zoom || 1;
    const panX     = item.panX || 0;
    const panY     = item.panY || 0;
    const rotation = (item.rotation || 0) * (Math.PI / 180);

    // Cálculo de escala base según modo
    let scale;
    if (fitMode === 'cover') {
        scale = Math.max(availW / item.imgObj.width, availH / item.imgObj.height);
    } else {
        scale = Math.min(availW / item.imgObj.width, availH / item.imgObj.height);
    }
    scale *= zoom;

    const baseW = item.imgObj.width * scale;
    const baseH = item.imgObj.height * scale;

    // Centro del lienzo + desplazamiento de pan
    const centerX = (CANVAS_W / 2) + panX;
    const centerY = (CANVAS_H / 2) + panY;

    ctx.translate(centerX, centerY);
    if (rotation !== 0) ctx.rotate(rotation);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(item.imgObj, -baseW / 2, -baseH / 2, baseW, baseH);

    ctx.restore();
}

function renderCanvas() {
    if (!images.length || selIdx >= images.length) return;
    const cur = images[selIdx];
    const folderLabel = cur.folder ? `<span style="color:var(--text-muted);font-size:0.74rem;font-weight:400">${cur.folder}/</span>` : '';
    canvasTitle.innerHTML = svgIcon('image') + ` #${pad(selIdx+1)} — ${folderLabel}${cur.name}`;
    navCounter.textContent = `${selIdx + 1} / ${images.length}`;

    mainCanvas.classList.add('can-pan');
    drawOnCanvas(mainCanvas, cur);
}

/* ════════════════════════════════════════════════════════════
   EXPORTACIÓN
═══════════════════════════════════════════════════════════ */
async function getBestBlob(canvas) {
    let blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    if (blob?.size <= MAX_BYTES) return { blob, ext: '.png' };
    for (const q of [0.95, 0.90, 0.85, 0.80, 0.72]) {
        blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', q));
        if (blob?.size <= MAX_BYTES) return { blob, ext: '.jpg' };
    }
    return { blob, ext: '.jpg' };
}

/* ── Guardar en carpeta (Permite elegir Desktop / Descargas) ── */
async function openSaveFolderDlg() {
    if (!images.length) { showToast('No hay imágenes para guardar', 'warn'); return; }
    const folderName = await askName(
        'Guardar en Carpeta',
        'Nombre de la carpeta donde se organizarán las imágenes.',
        zipBase || 'Imagenes_Organizadas'
    );
    if (!folderName) return;
    const sanitized = folderName.trim().replace(/[<>:"/\\|?*]/g, '_');
    await saveToFolder(sanitized);
}

async function saveToFolder(rootName) {
    if (typeof window.showDirectoryPicker !== 'function') {
        showToast('Navegador sin File System API. Descargando ZIP...', 'warn');
        await tick(1200);
        await _exportZipWithName(rootName);
        return;
    }

    let dirHandle = null;
    try {
        // Intentar abrir el selector sugiriendo la carpeta de Documentos/Escritorio
        dirHandle = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'documents' });
    } catch (err) {
        if (err.name === 'AbortError') {
            showToast('Operación cancelada', 'warn');
            return;
        }
        // Si el usuario eligió una carpeta protegida o hubo error de seguridad
        showToast('Carpeta protegida por el navegador. Descargando ZIP organizado...', 'warn');
        await tick(1500);
        await _exportZipWithName(rootName);
        return;
    }

    if (!dirHandle) return;

    showToast('Carpeta seleccionada. Guardando...', 'ok');
    const exp = Object.assign(document.createElement('canvas'), { width: CANVAS_W, height: CANVAS_H });
    showProgress(`Guardando en "${rootName}"...`, `Organizando ${images.length} imágenes`);

    try {
        // Si el usuario eligió Escritorio, Descargas o Documentos,
        // esto crea la subcarpeta con el nombre elegido (ej. 'Imagenes_Organizadas')
        // automáticamente si no existe, o entra en ella si ya existe.
        const rootDir = await dirHandle.getDirectoryHandle(rootName, { create: true });
        const groups = groupByFolder(images);
        let globalNum = 1;

        for (const [folder, items] of groups) {
            let targetDir = rootDir;
            if (folder !== '__root__' && folder !== '') {
                const parts = folder.split('/');
                for (const part of parts) {
                    const safe = part.replace(/[<>:"|?*]/g, '_');
                    if (safe) targetDir = await targetDir.getDirectoryHandle(safe, { create: true });
                }
            }

            let folderNum = 1;
            for (const item of items) {
                updateProgress(globalNum, images.length, `Guardando ${globalNum}/${images.length}...`);
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
        showToast(`${images.length} imágenes guardadas en "${rootName}"`, 'ok');
    } catch (err) {
        showToast(`Error al guardar: ${err.message}`, 'error');
    } finally {
        hideProgress();
    }
}

async function openExportZipDlg() {
    if (!images.length) { showToast('No hay imágenes para exportar', 'warn'); return; }
    const name = await askName(
        'Exportar como ZIP',
        'Nombre del archivo ZIP. La estructura de carpetas se preservará.',
        zipBase || 'Imagenes_Organizadas'
    );
    if (!name) return;
    await _exportZipWithName(name.trim().replace(/[<>:"/\\|?*]/g, '_'));
}

async function _exportZipWithName(rootName) {
    const exp    = Object.assign(document.createElement('canvas'), { width: CANVAS_W, height: CANVAS_H });
    const zipOut = new JSZip();
    showProgress(`Generando "${rootName}.zip"...`, `Empaquetando ${images.length} imágenes`);

    try {
        const groups = groupByFolder(images);
        let globalNum = 1;

        for (const [folder, items] of groups) {
            const folderPath = (folder !== '__root__' && folder !== '')
                ? `${rootName}/${folder}/`
                : `${rootName}/`;

            let folderNum = 1;
            for (const item of items) {
                updateProgress(globalNum, images.length, `Empaquetando ${globalNum}/${images.length}...`);
                drawOnCanvas(exp, item);
                const { blob, ext } = await getBestBlob(exp);
                zipOut.file(folderPath + pad(folderNum) + ext, blob);
                folderNum++;
                globalNum++;
                await tick(8);
            }
        }

        updateProgress(images.length, images.length, 'Comprimiendo ZIP...');
        const content = await zipOut.generateAsync({
            type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 }
        });
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(content), download: rootName + '.zip'
        });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        showToast(`ZIP "${rootName}.zip" descargado`, 'ok');
    } finally {
        hideProgress();
    }
}

/* ════════════════════════════════════════════════════════════
   DIÁLOGO DE NOMBRE
═══════════════════════════════════════════════════════════ */
function askName(title, description, defaultValue) {
    return new Promise(resolve => {
        document.getElementById('dlgTitle').textContent = title;
        document.getElementById('dlgDesc').textContent  = description;
        const input = document.getElementById('dlgInput');
        input.value = defaultValue || '';
        _dlgResolve = resolve;
        document.getElementById('nameDialog').classList.add('visible');
        setTimeout(() => { input.focus(); input.select(); }, 60);
        input.onkeydown = (e) => {
            if (e.key === 'Enter')  { e.preventDefault(); confirmDlg(); }
            if (e.key === 'Escape') { e.preventDefault(); closeDlg(); }
        };
        document.getElementById('dlgConfirmBtn').onclick = confirmDlg;
    });
}
function confirmDlg() {
    const val = document.getElementById('dlgInput').value.trim();
    document.getElementById('nameDialog').classList.remove('visible');
    if (_dlgResolve) { _dlgResolve(val || null); _dlgResolve = null; }
}
function closeDlg() {
    document.getElementById('nameDialog').classList.remove('visible');
    if (_dlgResolve) { _dlgResolve(null); _dlgResolve = null; }
}

/* ════════════════════════════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════════════════════════ */
function updateStatus() {
    if (!images.length) {
        statusText.innerHTML = '<span class="status-dot"></span>Listo para cargar imágenes';
    } else {
        const item = images[selIdx];
        const loc  = item.folder ? `${item.folder}/` : '';
        statusText.innerHTML = `<span class="status-dot"></span>${images.length} imágenes &nbsp;|&nbsp; #${pad(selIdx+1)}: ${loc}${item.name}`;
    }
    updateHistoryButtons();
}

function showProgress(title, sub) {
    document.getElementById('progTitle').innerHTML = svgIcon('clock') + ' ' + title;
    document.getElementById('progSub').textContent     = sub;
    document.getElementById('progFill').style.width    = '0%';
    document.getElementById('progText').textContent    = 'Iniciando...';
    document.getElementById('progPercent').textContent = '0%';
    document.getElementById('progressModal').style.display = 'flex';
}
function updateProgress(cur, total, detail) {
    const pct = Math.round((cur / Math.max(1, total)) * 100);
    document.getElementById('progFill').style.width    = pct + '%';
    document.getElementById('progText').textContent    = detail || `${cur} / ${total}`;
    document.getElementById('progPercent').textContent = pct + '%';
}
function hideProgress() {
    document.getElementById('progressModal').style.display = 'none';
}

const TOAST_ICONS = {
    ok:     '<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    warn:   '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
    error:  '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    move:   '<polyline points="17 1 21 5 17 9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M3 11V9a4 4 0 014-4h14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
    delete: '<polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" fill="none"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" stroke-width="2" fill="none"/>',
    clear:  '<line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};

function showToast(msg, type = 'ok', isErr = false) {
    const t = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    document.getElementById('toastIcon').innerHTML  = TOAST_ICONS[type] || TOAST_ICONS.ok;
    const isErrType = type === 'error' || type === 'delete' || isErr;
    t.style.borderColor = isErrType ? 'var(--danger)' : type === 'warn' ? 'var(--warning)' : 'var(--success)';
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

const SVG_ICONS = {
    image:    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    folder:   '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
    clock:    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    'chevron-down': '<svg class="icon icon-chevron" style="transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>',
};
function svgIcon(name) { return SVG_ICONS[name] || ''; }

function pad(n) { return String(n).padStart(2, '0'); }
function tick(ms = 0) { return new Promise(r => setTimeout(r, ms)); }

function toggleFS() {
    if (!document.fullscreenElement)
        document.documentElement.requestFullscreen().catch(() => {});
    else
        document.exitFullscreen?.();
}

/* ── INIT ─────────────────────────────────────────────────── */
rebuildList();
updateHistoryButtons();
