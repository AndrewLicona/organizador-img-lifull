import tkinter as tk
from tkinter import ttk
from PIL import ImageTk
from .styles import THEME

DRAG_THRESHOLD = 5  # píxeles mínimos para activar el modo arrastre


class Sidebar(ttk.Frame):
    """Panel lateral izquierdo. Drag & Drop sin parpadeo.
    
    Principio: render() SOLO se llama cuando los datos cambian (carga, borrado, reorder completado).
    Durante el drag (<B1-Motion>), NUNCA se llama render() — solo se modifica CSS de widgets existentes.
    """

    def __init__(self, parent, on_select, on_reorder, on_delete, on_clear):
        super().__init__(parent, style="Sidebar.TFrame", width=420)
        self.pack_propagate(False)

        self.on_select   = on_select
        self.on_reorder  = on_reorder
        self.on_delete   = on_delete
        self.on_clear    = on_clear

        # Estado interno — drag
        self._dragging        = False
        self._start_idx       = None
        self._target_idx      = None
        self._press_x         = 0
        self._press_y         = 0
        self._floating        = None   # Toplevel fantasma
        self._render_locked   = False  # True durante el drag — bloquea render()

        # Widgets vivos de las tarjetas
        self._thumb_refs   = []
        self._card_widgets = []   # lista de tk.Frame (una por imagen)
        self._card_bgs     = []   # bg original de cada tarjeta para restaurar

        self._build_ui()

    # ──────────────────────────────────────────────────────────
    # UI
    # ──────────────────────────────────────────────────────────

    def _build_ui(self):
        sb_header = tk.Frame(self, bg=THEME["bg_sidebar"], padx=14, pady=12)
        sb_header.pack(fill=tk.X)

        top = tk.Frame(sb_header, bg=THEME["bg_sidebar"])
        top.pack(fill=tk.X)

        tk.Label(top, text="📋 Lista de Imágenes",
                 font=("Segoe UI", 12, "bold"), fg=THEME["text"],
                 bg=THEME["bg_sidebar"]).pack(side=tk.LEFT)
        ttk.Button(top, text="🗑️ Vaciar", style="Danger.TButton",
                   command=self.on_clear).pack(side=tk.RIGHT)

        self.count_lbl = tk.Label(sb_header, text="0 imágenes cargadas",
                                  font=("Segoe UI", 9), fg=THEME["accent"],
                                  bg=THEME["bg_sidebar"])
        self.count_lbl.pack(anchor=tk.W, pady=(2, 4))

        tk.Label(sb_header,
                 text="💡 Arrastra ☰ para reordenar  •  naranja = destino",
                 font=("Segoe UI", 8), fg=THEME["text_muted"],
                 bg=THEME["bg_sidebar"]).pack(anchor=tk.W)

        # Scroll container
        container = tk.Frame(self, bg=THEME["bg_main"])
        container.pack(fill=tk.BOTH, expand=True, padx=8, pady=(0, 8))

        self._canvas = tk.Canvas(container, bg=THEME["bg_main"], highlightthickness=0)
        self._scrollbar = ttk.Scrollbar(container, orient="vertical",
                                         command=self._canvas.yview)
        self.cards_frame = tk.Frame(self._canvas, bg=THEME["bg_main"])
        self.cards_frame.bind("<Configure>",
            lambda e: self._canvas.configure(scrollregion=self._canvas.bbox("all")))

        self._cw = self._canvas.create_window((0, 0), window=self.cards_frame, anchor="nw")
        self._canvas.configure(yscrollcommand=self._scrollbar.set)

        self._canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self._scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self._canvas.bind("<Configure>",
            lambda e: self._canvas.itemconfig(self._cw, width=e.width))
        self._canvas.bind_all("<MouseWheel>", self._on_scroll)

    def _on_scroll(self, event):
        if self.winfo_pointerx() < self.winfo_rootx() + 450:
            self._canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

    # ──────────────────────────────────────────────────────────
    # RENDER (solo cuando los DATOS cambian)
    # ──────────────────────────────────────────────────────────

    def render(self, images_list, selected_index):
        """Reconstruye todas las tarjetas. Bloqueado si hay un drag activo."""
        if self._render_locked:
            return   # No destruyas widgets mientras el usuario arrastra

        for w in self.cards_frame.winfo_children():
            w.destroy()

        self._thumb_refs.clear()
        self._card_widgets.clear()
        self._card_bgs.clear()

        count = len(images_list)
        self.count_lbl.config(text=f"{count} imágenes cargadas")

        if count == 0:
            empty = tk.Frame(self.cards_frame, bg=THEME["bg_main"], pady=50)
            empty.pack(fill=tk.X)
            tk.Label(empty, text="📁 Ninguna imagen cargada",
                     fg="#585b70", bg=THEME["bg_main"],
                     font=("Segoe UI", 11, "bold")).pack()
            tk.Label(empty,
                     text="Haz clic en 'Cargar ZIP / Imágenes'\npara comenzar.",
                     fg="#45475a", bg=THEME["bg_main"],
                     font=("Segoe UI", 9)).pack(pady=6)
            return

        for idx, item in enumerate(images_list):
            self._build_card(idx, item, selected_index, count)

    def _build_card(self, idx, item, sel_idx, total):
        is_sel    = (idx == sel_idx)
        card_bg   = THEME["bg_card_active"] if is_sel else THEME["bg_card"]
        border_c  = THEME["accent"] if is_sel else THEME["border"]
        border_w  = 2 if is_sel else 1

        card = tk.Frame(self.cards_frame, bg=card_bg,
                        highlightbackground=border_c,
                        highlightthickness=border_w,
                        padx=8, pady=8, cursor="hand2")
        card.pack(fill=tk.X, padx=6, pady=3)
        self._card_widgets.append(card)
        self._card_bgs.append(card_bg)

        row = tk.Frame(card, bg=card_bg)
        row.pack(fill=tk.X)

        handle = tk.Label(row, text="☰",
                          font=("Segoe UI", 12, "bold"), cursor="fleur",
                          fg=THEME["accent"] if is_sel else THEME["text_muted"],
                          bg=card_bg)
        handle.pack(side=tk.LEFT, padx=(0, 6))

        badge = tk.Label(row, text=f" #{idx + 1:02d} ",
                         bg=THEME["success"] if is_sel else THEME["accent"],
                         fg="#11111b", font=("Segoe UI", 10, "bold"),
                         padx=5, pady=2)
        badge.pack(side=tk.LEFT, padx=(0, 8))

        thumb_pil = item.get_thumbnail()
        thumb_tk  = ImageTk.PhotoImage(thumb_pil)
        self._thumb_refs.append(thumb_tk)
        thumb_lbl = tk.Label(row, image=thumb_tk, bg=THEME["bg_header"])
        thumb_lbl.pack(side=tk.LEFT, padx=(0, 8))

        name_lbl = tk.Label(row, text=item.filename, bg=card_bg,
                            fg=THEME["text"],
                            font=("Segoe UI", 9, "bold" if is_sel else "normal"),
                            anchor="w")
        name_lbl.pack(side=tk.LEFT, fill=tk.X, expand=True)

        btn_box = tk.Frame(row, bg=card_bg)
        btn_box.pack(side=tk.RIGHT)

        if idx > 0:
            tk.Button(btn_box, text="▲", bg=THEME["border"], fg=THEME["text"],
                      font=("Segoe UI", 8), relief="flat", width=2,
                      command=lambda i=idx: self.on_reorder(i, i - 1)).pack(side=tk.LEFT, padx=1)
        if idx < total - 1:
            tk.Button(btn_box, text="▼", bg=THEME["border"], fg=THEME["text"],
                      font=("Segoe UI", 8), relief="flat", width=2,
                      command=lambda i=idx: self.on_reorder(i, i + 1)).pack(side=tk.LEFT, padx=1)
        tk.Button(btn_box, text="✖", bg="#45475a", fg=THEME["danger"],
                  font=("Segoe UI", 8), relief="flat", width=2,
                  command=lambda i=idx: self.on_delete(i)).pack(side=tk.LEFT, padx=2)

        # Bindings de drag — solo en el handle y la tarjeta
        for elem in (card, row, name_lbl, badge, thumb_lbl, handle):
            elem.bind("<Button-1>",       lambda e, i=idx: self._on_press(e, i))
            elem.bind("<B1-Motion>",      lambda e, i=idx, it=item: self._on_motion(e, i, it))
            elem.bind("<ButtonRelease-1>", lambda e, i=idx: self._on_release(e, i))

    # ──────────────────────────────────────────────────────────
    # DRAG & DROP — separado en press / motion / release
    # ──────────────────────────────────────────────────────────

    def _on_press(self, event, index):
        self._start_idx  = index
        self._target_idx = None
        self._dragging   = False
        self._press_x    = event.x_root
        self._press_y    = event.y_root

    def _on_motion(self, event, index, item):
        if self._start_idx is None:
            return

        # Activar drag solo tras superar el umbral
        if not self._dragging:
            dx = abs(event.x_root - self._press_x)
            dy = abs(event.y_root - self._press_y)
            if dx < DRAG_THRESHOLD and dy < DRAG_THRESHOLD:
                return
            self._dragging      = True
            self._render_locked = True   # 🔒 bloquear render() hasta soltar

        # Crear ventana flotante si no existe
        if self._floating is None:
            self._create_ghost(index, item)

        # Mover ventana flotante
        self._floating.geometry(f"+{event.x_root + 16}+{event.y_root + 10}")

        # Calcular tarjeta destino y resaltar SIN render()
        t = self._calc_target(event.y_root)
        if t != self._target_idx:
            self._clear_highlights()
            self._target_idx = t
            if t is not None and 0 <= t < len(self._card_widgets) and t != self._start_idx:
                try:
                    self._card_widgets[t].configure(
                        highlightbackground=THEME["drop_line"],
                        highlightthickness=3
                    )
                except tk.TclError:
                    pass

    def _on_release(self, event, index):
        was_drag  = self._dragging
        start     = self._start_idx
        target    = self._target_idx

        # Limpiar estado primero
        self._kill_ghost()
        self._clear_highlights()
        self._dragging       = False
        self._render_locked  = False   # 🔓 desbloquear render()
        self._start_idx      = None
        self._target_idx     = None

        if was_drag:
            if target is not None and target != start:
                self.on_reorder(start, target)   # → llama refresh_all → render() (ya desbloqueado)
        else:
            if start is not None:
                self.on_select(start)              # clic simple

    # ──────────────────────────────────────────────────────────
    # HELPERS
    # ──────────────────────────────────────────────────────────

    def _create_ghost(self, index, item):
        fw = tk.Toplevel(self)
        fw.overrideredirect(True)
        fw.attributes("-alpha", 0.82)
        fw.attributes("-topmost", True)

        box = tk.Frame(fw, bg=THEME["bg_card_active"],
                       highlightbackground=THEME["drop_line"], highlightthickness=2,
                       padx=12, pady=7)
        box.pack()
        tk.Label(box, text=f" #{index + 1:02d} ",
                 bg=THEME["warning"], fg="#11111b",
                 font=("Segoe UI", 9, "bold")).pack(side=tk.LEFT, padx=(0, 8))
        tk.Label(box, text=item.filename,
                 bg=THEME["bg_card_active"], fg=THEME["text"],
                 font=("Segoe UI", 9)).pack(side=tk.LEFT)
        self._floating = fw

    def _kill_ghost(self):
        if self._floating:
            try:
                self._floating.destroy()
            except Exception:
                pass
            self._floating = None

    def _calc_target(self, pointer_y):
        for idx, card in enumerate(self._card_widgets):
            try:
                top    = card.winfo_rooty()
                bottom = top + card.winfo_height()
                if top <= pointer_y <= bottom:
                    return idx
            except Exception:
                continue
        if self._card_widgets:
            try:
                if pointer_y < self._card_widgets[0].winfo_rooty():
                    return 0
                last = self._card_widgets[-1]
                if pointer_y > last.winfo_rooty() + last.winfo_height():
                    return len(self._card_widgets) - 1
            except Exception:
                pass
        return self._start_idx

    def _clear_highlights(self):
        for idx, card in enumerate(self._card_widgets):
            try:
                card.configure(highlightbackground=THEME["border"],
                                highlightthickness=1)
            except tk.TclError:
                pass
