/*
  A slow field of ASCII characters behind the hero and the statement.
  The characters drift like a ripple; near the cursor they swell, scatter
  and turn blue. Click to send a ring out from the cursor.
  Draws only the part of the field that is on screen, and stops when it scrolls away.
*/
(function () {
  const canvas = document.querySelector(".ascii-bg");
  if (!canvas) return;
  const zone = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const RAMP = " .·:-=+*%#@";            // light to dense
  const BLUE = [0, 134, 250];             // --blue
  const BASE = [66, 66, 66];              // the resting grey on the dark page
  const SHADES = 8;                       // colour steps from grey to blue

  let W = 0, H = 0, cell = 14, rowH = 18, cols = 0, rows = 0;
  let visible = false, raf = 0, t0 = performance.now();
  const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, on: false };
  const rings = [];                       // click ripples: { x, y, born }

  const shades = Array.from({ length: SHADES }, (_, i) => {
    const k = i / (SHADES - 1);
    const c = BASE.map((b, j) => Math.round(b + (BLUE[j] - b) * k));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  });

  function size() {
    const r = zone.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    cell = W < 700 ? 11 : 13; rowH = Math.round(cell * 1.35);
    cols = Math.ceil(W / cell); rows = Math.ceil(H / rowH);
    canvas.width = W; canvas.height = H;  // 1:1 is plenty for small glyphs
    ctx.font = `${cell}px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`;
    ctx.textBaseline = "top";
    if (!raf) frame(performance.now());
  }

  // Cheap, smooth "noise" from a few crossing sine waves
  function field(x, y, t) {
    return (
      Math.sin(x * 0.045 + t * 0.6) +
      Math.sin(y * 0.06 - t * 0.45) +
      Math.sin((x + y) * 0.03 + t * 0.35) +
      Math.sin(Math.hypot(x - cols * 0.7, y - rows * 0.3) * 0.12 - t * 0.9)
    ) / 4; // -1..1
  }

  function frame(now) {
    raf = 0;
    const t = still ? 0 : (now - t0) / 1000;

    // ease the cursor so the swell trails it a little
    mouse.sx += (mouse.x - mouse.sx) * 0.18;
    mouse.sy += (mouse.y - mouse.sy) * 0.18;

    // only redraw the rows that are on screen
    const top = zone.getBoundingClientRect().top;
    const r0 = Math.max(0, Math.floor(-top / rowH) - 1);
    const r1 = Math.min(rows, Math.ceil((innerHeight - top) / rowH) + 1);
    ctx.clearRect(0, r0 * rowH, W, (r1 - r0) * rowH);

    const R = W < 700 ? 130 : 220;        // reach of the cursor
    const buckets = shades.map(() => []);
    for (let i = rings.length - 1; i >= 0; i--) if (now - rings[i].born > 1600) rings.splice(i, 1);

    for (let r = r0; r < r1; r++) {
      const py = r * rowH;
      for (let c = 0; c < cols; c++) {
        const px = c * cell;
        let v = field(c, r, t) * 0.5 + 0.5;  // 0..1
        v = v * v * 0.75;                     // keep most of the field quiet
        let heat = 0, ox = 0, oy = 0;

        if (mouse.on) {
          const dx = px - mouse.sx, dy = py - mouse.sy;
          const d = Math.hypot(dx, dy);
          if (d < R) {
            const k = 1 - d / R;
            heat = k * k;
            v = Math.min(1, v + heat * 0.9);
            const push = heat * 16;           // glyphs scatter away from the cursor
            ox = (dx / (d || 1)) * push; oy = (dy / (d || 1)) * push;
          }
        }
        for (const ring of rings) {
          const age = (now - ring.born) / 1000;
          const d = Math.hypot(px - ring.x, py - ring.y);
          const band = Math.abs(d - age * 520);
          if (band < 40) {
            const k = (1 - band / 40) * (1 - age / 1.6);
            heat = Math.max(heat, k);
            v = Math.min(1, v + k);
          }
        }

        const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))];
        if (ch === " ") continue;
        const s = Math.min(SHADES - 1, Math.round(heat * (SHADES - 1)));
        buckets[s].push(ch, px + ox, py + oy);
      }
    }

    // one fillStyle change per shade
    buckets.forEach((b, s) => {
      if (!b.length) return;
      ctx.fillStyle = shades[s];
      for (let i = 0; i < b.length; i += 3) ctx.fillText(b[i], b[i + 1], b[i + 2]);
    });

    if (visible && !still) raf = requestAnimationFrame(frame);
  }

  let cx = -9999, cy = -9999;              // last pointer position in the window
  function point(e) {
    if (e) { cx = e.clientX; cy = e.clientY; }
    const r = zone.getBoundingClientRect();
    mouse.x = cx - r.left; mouse.y = cy - r.top;
    const inside = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= r.width && mouse.y <= r.height;
    if (inside && !mouse.on) { mouse.sx = mouse.x; mouse.sy = mouse.y; }
    mouse.on = inside;
    if (still && inside && !raf) raf = requestAnimationFrame(frame);
  }

  addEventListener("pointermove", point, { passive: true });
  addEventListener("pointerdown", (e) => {
    point(e);
    if (mouse.on && !still) rings.push({ x: mouse.x, y: mouse.y, born: performance.now() });
  }, { passive: true });
  document.addEventListener("pointerleave", () => { mouse.on = false; });
  addEventListener("scroll", () => { point(); if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }).observe(zone);

  new ResizeObserver(size).observe(zone);
})();
