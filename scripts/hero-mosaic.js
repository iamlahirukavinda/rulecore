/**
 * Hero frosted mosaic — soft blurred color tiles light with the cursor.
 * Visual language matches the reference: mosaic glow + frost + grain.
 */
(function () {
  "use strict";

  const hero = document.querySelector(".hero");
  const root = document.querySelector("[data-mosaic-root]");
  const grid = document.querySelector("[data-mosaic]");
  if (!hero || !root || !grid) return;

  /* Site palette: brand blue + neutrals (no green) */
  const COLORS = [
    "#0e27ca",
    "#1a3ae0",
    "#2747f0",
    "#3d5bff",
    "#5b78ff",
    "#8ea2ff",
    "#efefef",
    "#758289",
    "#979393",
    "#ece7e7",
    "#161616",
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cells = [];
  let cols = 16;
  let rows = 10;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pickColor() {
    return COLORS[(Math.random() * COLORS.length) | 0];
  }

  function sizeGrid() {
    if (window.matchMedia("(max-width: 640px)").matches) {
      cols = 9;
      rows = 8;
    } else if (window.matchMedia("(max-width: 900px)").matches) {
      cols = 12;
      rows = 9;
    } else {
      cols = 16;
      rows = 10;
    }
  }

  function build() {
    sizeGrid();
    const frag = document.createDocumentFragment();
    const total = cols * rows;

    for (let i = 0; i < total; i++) {
      const cell = document.createElement("div");
      cell.className = "hero-mosaic-cell";

      const color = pickColor();
      const isAccent = Math.random() > 0.42;
      const base = isAccent ? rand(0.18, 0.55) : rand(0.03, 0.12);
      const lit = isAccent ? rand(0.75, 1) : rand(0.35, 0.7);

      cell.style.setProperty("--cell-color", color);
      cell.style.setProperty("--cell-base", base.toFixed(3));
      cell.style.setProperty("--cell-lit", lit.toFixed(3));
      cell.dataset.base = String(base);
      cell.dataset.lit = String(lit);

      /* Seed some permanently soft-lit tiles so the field always reads */
      if (Math.random() > 0.62) {
        cell.classList.add("is-lit");
        cell.dataset.seed = "1";
      }

      frag.appendChild(cell);
    }

    grid.replaceChildren(frag);
    cells = Array.prototype.slice.call(grid.children);
  }

  build();

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(build, 200);
  });

  if (reduceMotion) {
    for (let i = 0; i < cells.length; i++) {
      if (Math.random() > 0.45) cells[i].classList.add("is-lit");
    }
    return;
  }

  const home = { x: 0.55, y: 0.4 };
  let mx = home.x;
  let my = home.y;
  let tx = home.x;
  let ty = home.y;
  let inside = false;
  let rafId = 0;
  let frame = 0;

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function lightCells() {
    if (!cells.length) return;

    const rect = hero.getBoundingClientRect();
    const cx = rect.left + mx * rect.width;
    const cy = rect.top + my * rect.height;
    const radius = inside
      ? Math.min(rect.width, rect.height) * 0.38
      : Math.min(rect.width, rect.height) * 0.22;
    const r2 = radius * radius;

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const box = cell.getBoundingClientRect();
      const px = box.left + box.width / 2;
      const py = box.top + box.height / 2;
      const dx = px - cx;
      const dy = py - cy;
      const dist2 = dx * dx + dy * dy;
      const near = dist2 < r2;

      if (near) {
        cell.classList.add("is-lit");
        /* Falloff: closer = brighter */
        const t = 1 - Math.sqrt(dist2) / radius;
        const lit = parseFloat(cell.dataset.lit) || 0.9;
        const base = parseFloat(cell.dataset.base) || 0.1;
        cell.style.opacity = (base + (lit - base) * (0.45 + t * 0.55)).toFixed(3);
      } else if (cell.dataset.seed === "1") {
        cell.classList.add("is-lit");
        cell.style.opacity = "";
      } else {
        cell.classList.remove("is-lit");
        cell.style.opacity = "";
      }
    }
  }

  function tick() {
    mx += (tx - mx) * 0.12;
    my += (ty - my) * 0.12;
    frame += 1;
    if (frame % 2 === 0) lightCells();
    rafId = window.requestAnimationFrame(tick);
  }

  function onMove(event) {
    const rect = hero.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const px = event.clientX;
    const py = event.clientY;
    const hit =
      px >= rect.left &&
      px <= rect.right &&
      py >= rect.top &&
      py <= rect.bottom;

    inside = hit;
    if (!hit) {
      tx = home.x;
      ty = home.y;
      return;
    }

    tx = clamp((px - rect.left) / rect.width, 0.02, 0.98);
    ty = clamp((py - rect.top) / rect.height, 0.02, 0.98);
  }

  document.addEventListener("mousemove", onMove, { passive: true });
  hero.addEventListener("mouseleave", () => {
    inside = false;
    tx = home.x;
    ty = home.y;
  });

  const mo = new MutationObserver(() => {
    cells = Array.prototype.slice.call(grid.children);
  });
  mo.observe(grid, { childList: true });

  lightCells();
  rafId = window.requestAnimationFrame(tick);

  window.addEventListener("beforeunload", () => {
    if (rafId) window.cancelAnimationFrame(rafId);
    mo.disconnect();
  });
})();
