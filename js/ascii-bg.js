/*
  A slowly morphing ASCII field behind the hero and the statement.
  Soft blobs of characters drift and change shape, like the reference recording:
  dense glyphs (H K #) in the middle of a blob, thinning out to / ) : and . at the edges.
  Near the cursor the blobs swell and pick up a little blue; a click sends a ring out.

  The canvas is only as tall as the window and follows the scroll inside its section,
  so it stays sharp on retina screens without a huge bitmap.
*/
(function () {
  const canvas = document.querySelector(".ascii-bg");
  if (!canvas) return;
  const zone = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const RAMP = " .·:;!/)*+=HK#";          // light to dense
  const GREY = [16, 16, 16];              // a glyph that is barely there
  const LIGHT = [125, 125, 125];          // the brightest grey in a blob
  const BLUE = [0, 134, 250];             // --blue, near the cursor
  const SHADES = 8;                       // grey steps
  const HOTS = 4;                         // blue steps

  let dpr = 1, W = 0, H = 0, VH = 0, cw = 7, ch = 9, cols = 0;
  let visible = false, raf = 0, last = 0;
  const t0 = performance.now();
  const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, on: false };
  const rings = [];

  /* ---------- smooth value noise ---------- */

  const P = new Uint8Array(512);
  {
    const p = [...Array(256).keys()];
    let seed = 7;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      const j = seed % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const X = xi & 255, Y = yi & 255;
    const a = P[P[X] + Y] / 255, b = P[P[X + 1] + Y] / 255;
    const c = P[P[X] + Y + 1] / 255, d = P[P[X + 1] + Y + 1] / 255;
    const u = fade(x - xi), v = fade(y - yi);
    const top = a + (b - a) * u, bottom = c + (d - c) * u;
    return top + (bottom - top) * v;
  }
  // three layers drifting in different directions make the blobs change shape, not just slide
  function field(x, y, t) {
    const n1 = noise(x * 0.011 + t * 0.05, y * 0.011 - t * 0.03);
    const n2 = noise(x * 0.019 - t * 0.04 + 40, y * 0.019 + t * 0.05 + 40);
    const n3 = noise(x * 0.045 + 80, y * 0.045 + t * 0.08 + 80);
    return n1 * 0.55 + n2 * 0.33 + n3 * 0.12;
  }

  /* ---------- glyph sprites: each character rasterised once, then copied as pixels ---------- */
  // Thousands of drawImage calls a frame are slow; writing pixels into one ImageData is not.

  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const colours = [
    ...Array.from({ length: SHADES }, (_, i) => mix(GREY, LIGHT, i / (SHADES - 1))),
    ...Array.from({ length: HOTS }, (_, i) => mix(LIGHT, BLUE, (i + 1) / HOTS))
  ];
  let sprites = [];      // sprites[glyph] = { at: pixel offsets in a cell, alpha: 0..255 }
  let packed = [];       // packed[shade] = colour as RGBA bytes, alpha filled in per pixel
  let image, pixels, gw = 0, gh = 0;

  function buildSprites() {
    gw = Math.round(cw * dpr); gh = Math.round(ch * dpr);
    const g = document.createElement("canvas");
    g.width = RAMP.length * gw; g.height = gh;
    const a = g.getContext("2d");
    a.font = `${(ch - 1) * dpr}px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`;
    a.textAlign = "center"; a.textBaseline = "middle"; a.fillStyle = "#fff";
    for (let i = 1; i < RAMP.length; i++) a.fillText(RAMP[i], i * gw + gw / 2, gh / 2);
    const data = a.getImageData(0, 0, g.width, gh).data;
    sprites = RAMP.split("").map((_, i) => {
      const at = [], alpha = [];
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        const al = data[(y * g.width + i * gw + x) * 4 + 3];
        if (al > 8) { at.push(y * canvas.width + x); alpha.push(al); }
      }
      return { at, alpha };
    });
    packed = colours.map(([r, g2, b]) => (b << 16) | (g2 << 8) | r);   // little-endian RGBA
    image = ctx.createImageData(canvas.width, canvas.height);
    pixels = new Uint32Array(image.data.buffer);
  }

  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = zone.clientWidth; H = zone.clientHeight;
    VH = Math.min(H, innerHeight);
    cw = W < 700 ? 6 : 7; ch = cw + 2;
    cols = Math.ceil(W / cw);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(VH * dpr);
    canvas.style.height = VH + "px";
    buildSprites();
    last = 0;
    draw(performance.now());
  }

  /* ---------- drawing ---------- */

  function draw(now) {
    raf = 0;
    if (!still && visible) raf = requestAnimationFrame(draw);
    if (!still && now - last < 33) return;   // about 30 frames a second is plenty
    last = now;
    const t = still ? 0 : (now - t0) / 1000;

    // keep the canvas over the part of the section that is on screen
    const top = zone.getBoundingClientRect().top;
    const off = Math.max(0, Math.min(H - VH, -top));
    canvas.style.transform = `translateY(${off}px)`;

    mouse.sx += (mouse.x - mouse.sx) * 0.2;
    mouse.sy += (mouse.y - mouse.sy) * 0.2;
    for (let i = rings.length - 1; i >= 0; i--) if (now - rings[i].born > 1800) rings.splice(i, 1);

    pixels.fill(0);

    const R = W < 700 ? 120 : 200;
    const r0 = Math.floor(off / ch), r1 = Math.ceil((off + VH) / ch);
    const cwP = canvas.width;

    for (let r = r0; r < r1; r++) {
      const y = r * ch;                                   // y inside the section
      const edge = Math.max(0, Math.min(1, (H - y) / (H * 0.18)));  // fade out before the works section
      for (let c = 0; c < cols; c++) {
        const x = c * cw;
        // blobs: push the field's contrast so the middles fill in and the gaps go dark
        let v = (field(x, y, t) - 0.40) * 2.6;
        let heat = 0;

        if (mouse.on) {
          const d = Math.hypot(x - mouse.sx, y - mouse.sy);
          if (d < R) { const k = 1 - d / R; heat = k * k; v += heat * 1.1; }
        }
        for (const ring of rings) {
          const age = (now - ring.born) / 1000;
          const band = Math.abs(Math.hypot(x - ring.x, y - ring.y) - age * 480);
          if (band < 36) { const k = (1 - band / 36) * (1 - age / 1.8); heat = Math.max(heat, k); v += k; }
        }

        v = Math.max(0, Math.min(1, v)) * edge;
        // the dark gaps still carry a faint dot grid, like the recording
        let gi = Math.round(v * (RAMP.length - 1));
        if (gi === 0) { if ((c + r) % 2 || edge < 0.3) continue; gi = 1; }
        const shade = heat > 0.15
          ? SHADES + Math.min(HOTS - 1, Math.floor(heat * HOTS))
          : Math.min(SHADES - 1, Math.round(v * (SHADES - 1)) + 1);
        const top = Math.round((y - off) * dpr), left = Math.round(x * dpr);
        if (top < 0 || top + gh > canvas.height || left + gw > cwP) continue;
        const base = top * cwP + left, col = packed[shade], g = sprites[gi];
        for (let i = 0; i < g.at.length; i++) pixels[base + g.at[i]] = col | (g.alpha[i] << 24);
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  /* ---------- input ---------- */

  let px = -9999, py = -9999;               // last pointer position in the window
  function point(e) {
    if (e) { px = e.clientX; py = e.clientY; }
    const r = zone.getBoundingClientRect();
    mouse.x = px - r.left; mouse.y = py - r.top;
    const inside = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= r.width && mouse.y <= r.height;
    if (inside && !mouse.on) { mouse.sx = mouse.x; mouse.sy = mouse.y; }
    mouse.on = inside;
    if (still && !raf) raf = requestAnimationFrame(draw);
  }

  addEventListener("pointermove", point, { passive: true });
  addEventListener("pointerdown", (e) => {
    point(e);
    if (mouse.on && !still) rings.push({ x: mouse.x, y: mouse.y, born: performance.now() });
  }, { passive: true });
  document.addEventListener("pointerleave", () => { mouse.on = false; });
  addEventListener("scroll", () => { point(); if (!raf) raf = requestAnimationFrame(draw); }, { passive: true });
  addEventListener("resize", size);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(draw);
  }).observe(zone);

  new ResizeObserver(size).observe(zone);
})();
