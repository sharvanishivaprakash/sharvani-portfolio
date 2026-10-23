/*
  A softly moving dot grid behind the hero and the "I connect the dots" statement.
  The grid sways a little and a slow wave runs through it; dots near the cursor grow and turn blue.
  Around the statement, a handful of dots grow one after another and blue lines are drawn
  between them, joining the dots around the words. Then they fade and a new set is joined.

  The canvas is only as tall as the window and follows the scroll inside its section,
  so it stays sharp on retina screens without a huge bitmap.
*/
(function () {
  const canvas = document.querySelector(".dots-bg");
  if (!canvas) return;
  const zone = canvas.parentElement;
  const box = zone.querySelector(".statement-box");
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BLUE = "0, 134, 250";             // --blue
  const LINK_TIME = 0.55;                 // seconds to draw one line
  const HOLD = 2.6;                       // seconds the finished shape stays
  const FADE = 0.9;                       // seconds to fade it away

  let dpr = 1, W = 0, H = 0, VH = 0, gap = 32, visible = false, raf = 0;
  const t0 = performance.now();
  const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, on: false };
  let path = [], pathStart = 0;           // the dots being joined: grid indices [i, j]

  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = zone.clientWidth; H = zone.clientHeight;
    VH = Math.min(H, innerHeight);
    gap = W < 700 ? 26 : 32;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(VH * dpr);
    canvas.style.height = VH + "px";
    path = [];
    draw(performance.now());
  }

  /* ---------- the grid ---------- */

  // the whole grid sways gently instead of sliding away, so joined dots stay near the words
  const sway = (t) => [Math.sin(t * 0.21) * gap * 0.35, Math.cos(t * 0.17) * gap * 0.35];
  const pos = (i, j, sx, sy) => [i * gap + gap / 2 + sx, j * gap + gap / 2 + sy];

  /* ---------- picking dots to join around the statement ---------- */

  function pickPath() {
    if (!box) return [];
    const z = zone.getBoundingClientRect(), b = box.getBoundingClientRect();
    const L = b.left - z.left, T = b.top - z.top, R = b.right - z.left, B = b.bottom - z.top;
    const cx = (L + R) / 2, cy = (T + B) / 2;
    const padX = Math.min(220, W * 0.12), padY = Math.min(170, (b.height || 100) * 0.9);
    const spots = [];
    for (let j = Math.floor((T - padY) / gap); j <= Math.ceil((B + padY) / gap); j++) {
      for (let i = Math.floor((L - padX) / gap); i <= Math.ceil((R + padX) / gap); i++) {
        const [x, y] = pos(i, j, 0, 0);
        if (x < gap || x > W - gap || y < 0 || y > H) continue;
        const inside = x > L - 24 && x < R + 24 && y > T - 24 && y < B + 24;
        if (!inside) spots.push([i, j, Math.atan2((y - cy) / (B - T + 2 * padY), (x - cx) / (R - L + 2 * padX))]);
      }
    }
    if (spots.length < 6) return [];
    // one dot from each slice of the circle around the words, so the lines go round them
    const n = W < 700 ? 6 : 8, picked = [];
    const turn = Math.random() * Math.PI * 2;
    for (let k = 0; k < n; k++) {
      const a0 = -Math.PI + ((k / n) * Math.PI * 2 + turn) % (Math.PI * 2);
      const slice = spots.filter(([, , a]) => {
        const d = (a - a0 + Math.PI * 4) % (Math.PI * 2);
        return d < (Math.PI * 2) / n;
      });
      if (slice.length) picked.push(slice[(Math.random() * slice.length) | 0]);
    }
    picked.sort((p, q) => p[2] - q[2]);
    return picked.map(([i, j]) => [i, j]);
  }

  /* ---------- drawing ---------- */

  function draw(now) {
    raf = 0;
    if (!still && visible) raf = requestAnimationFrame(draw);
    const t = still ? 0 : (now - t0) / 1000;

    // keep the canvas over the part of the section that is on screen
    const top = zone.getBoundingClientRect().top;
    const off = Math.max(0, Math.min(H - VH, -top));
    canvas.style.transform = `translateY(${off}px)`;

    mouse.sx += (mouse.x - mouse.sx) * 0.2;
    mouse.sy += (mouse.y - mouse.sy) * 0.2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, -off * dpr);   // draw in section coordinates
    ctx.clearRect(0, off, W, VH);

    const [sx, sy] = still ? [0, 0] : sway(t);
    const R = W < 700 ? 110 : 160;
    const fadeEdge = H * 0.16;                          // grid fades out before the works section
    const i0 = -1, i1 = Math.ceil(W / gap) + 1;
    const j0 = Math.floor(off / gap) - 1, j1 = Math.ceil((off + VH) / gap) + 1;

    // plain dots, batched into two paths: grey and blue
    const grey = new Path2D(), hot = [];
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        let [x, y] = pos(i, j, sx, sy);
        if (y < -gap || y > H) continue;
        const edge = Math.min(1, (H - y) / fadeEdge);
        if (edge <= 0) continue;
        // a slow diagonal wave makes the grid breathe
        const wave = still ? 0 : (Math.sin((i + j) * 0.35 - t * 1.4) + 1) / 2;
        let r = (0.9 + wave * 0.6) * edge;
        let heat = 0;
        if (mouse.on) {
          const dx = x - mouse.sx, dy = y - mouse.sy, d = Math.hypot(dx, dy);
          if (d < R) {
            heat = (1 - d / R) ** 2;
            x += (dx / (d || 1)) * heat * 8; y += (dy / (d || 1)) * heat * 8;
            r += heat * 2.2;
          }
        }
        if (heat > 0.05) hot.push([x, y, r, heat]);
        else { grey.moveTo(x + r, y); grey.arc(x, y, r, 0, Math.PI * 2); }
      }
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fill(grey);
    for (const [x, y, r, k] of hot) {
      ctx.fillStyle = `rgba(${BLUE}, ${0.35 + k * 0.65})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    joinDots(t, sx, sy, off);
  }

  // the "connect the dots" drawing around the statement
  function joinDots(t, sx, sy, off) {
    if (!box) return;
    const b = box.getBoundingClientRect(), z = zone.getBoundingClientRect();
    const near = b.bottom > 0 && b.top < innerHeight;  // only when the words are on screen
    if (!near && !still) { path = []; return; }
    if (!path.length) { path = pickPath(); pathStart = t; }
    if (!path.length) return;

    const n = path.length;
    const drawTime = n * LINK_TIME;                     // last line closes the loop
    let age = still ? drawTime + 1 : t - pathStart;
    if (age > drawTime + HOLD + FADE) { path = pickPath(); pathStart = t; age = 0; }
    const alpha = age > drawTime + HOLD ? 1 - (age - drawTime - HOLD) / FADE : 1;
    const pts = path.map(([i, j]) => pos(i, j, sx, sy));

    ctx.lineCap = "round";
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = `rgba(${BLUE}, ${0.85 * alpha})`;
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
      const p = Math.max(0, Math.min(1, (age - k * LINK_TIME) / LINK_TIME));
      if (!p) break;
      const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % n];
      const e = 1 - (1 - p) ** 3;                       // ease out
      ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * e, ay + (by - ay) * e);
    }
    ctx.stroke();

    // each dot grows as its line arrives
    for (let k = 0; k < n; k++) {
      const arrive = k === 0 ? 0 : k * LINK_TIME;
      const p = Math.max(0, Math.min(1, (age - arrive) / 0.35));
      if (!p) continue;
      const [x, y] = pts[k];
      const pop = 1 + Math.sin(p * Math.PI) * 0.6;       // a little overshoot
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath(); ctx.arc(x, y, 4.5 * p * pop, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(${BLUE}, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 8 * p, 0, Math.PI * 2); ctx.stroke();
    }
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
  document.addEventListener("pointerleave", () => { mouse.on = false; });
  addEventListener("scroll", () => { point(); if (!raf) raf = requestAnimationFrame(draw); }, { passive: true });
  addEventListener("resize", size);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(draw);
  }).observe(zone);

  new ResizeObserver(size).observe(zone);
})();
