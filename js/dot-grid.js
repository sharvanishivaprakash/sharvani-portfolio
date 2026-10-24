/*
  A softly moving dot grid behind the hero and the "I connect the dots" statement.
  The grid sways a little and a slow wave runs through it; dots near the cursor grow and turn blue.
  Around the statement, blue lines join the dots into a box around the words. The box is drawn
  one line at a time as you scroll down to it, and undraws again if you scroll back up.

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

  let dpr = 1, W = 0, H = 0, VH = 0, gap = 32, visible = false, raf = 0;
  const t0 = performance.now();
  const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, on: false };
  let drawn = 0;                          // how much of the box is drawn, 0 to 1 (follows the scroll)

  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = zone.clientWidth; H = zone.clientHeight;
    VH = Math.min(H, innerHeight);
    gap = W < 700 ? 26 : 32;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(VH * dpr);
    canvas.style.height = VH + "px";
    draw(performance.now());
  }

  /* ---------- the grid ---------- */

  // the whole grid sways gently instead of sliding away, so joined dots stay near the words
  const sway = (t) => [Math.sin(t * 0.21) * gap * 0.35, Math.cos(t * 0.17) * gap * 0.35];
  const pos = (i, j, sx, sy) => [i * gap + gap / 2 + sx, j * gap + gap / 2 + sy];

  /* ---------- the box around the statement ---------- */

  // the grid dots at the corners of a box a little bigger than the words, plus a few dots
  // along each side, so the box is drawn as a chain of short lines from dot to dot
  function boxPath() {
    const z = zone.getBoundingClientRect(), b = box.getBoundingClientRect();
    const step = W < 700 ? 3 : 4;                       // grid cells per line
    // keep the dots (and their rings, as the grid sways) inside the window
    const edge = gap * 0.35 + 9;
    const col = (x) => Math.max(Math.ceil((edge - gap / 2) / gap), Math.min(Math.floor((W - edge - gap / 2) / gap), x));
    let iL = Math.floor((b.left - z.left - gap * 1.5) / gap), iR = Math.ceil((b.right - z.left + gap * 0.5) / gap);
    // widen the box a touch so the top and bottom split into equal lines
    const extra = Math.ceil((iR - iL) / step) * step - (iR - iL);
    iL = col(iL - Math.floor(extra / 2)); iR = col(iR + Math.ceil(extra / 2));
    const jT = Math.floor((b.top - z.top - gap * 1.5) / gap), jB = Math.ceil((b.bottom - z.top + gap * 0.5) / gap);
    const pts = [];
    const side = (a, c, n) => {                         // a to c, leaving c for the next side
      const k = Math.max(1, Math.round(n / step));
      for (let s = 0; s < k; s++) pts.push([Math.round(a[0] + (c[0] - a[0]) * s / k), Math.round(a[1] + (c[1] - a[1]) * s / k)]);
    };
    side([iL, jT], [iR, jT], iR - iL);
    side([iR, jT], [iR, jB], jB - jT);
    side([iR, jB], [iL, jB], iR - iL);
    side([iL, jB], [iL, jT], jB - jT);
    return pts;
  }

  // 0 when the words come up from the bottom of the window, 1 once they're a bit above the middle
  function scrolled() {
    if (still) return 1;
    const b = box.getBoundingClientRect();
    return Math.max(0, Math.min(1, (innerHeight * 0.95 - b.top) / (innerHeight * 0.55)));
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
    const fadeEdge = gap * 3;                           // grid fades out just before the works section
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

  // the "connect the dots" box around the statement
  function joinDots(t, sx, sy, off) {
    if (!box) return;
    const goal = scrolled();
    drawn += (goal - drawn) * 0.12;
    if (Math.abs(goal - drawn) < 0.001) drawn = goal;
    if (drawn <= 0) return;

    const pts = boxPath().map(([i, j]) => pos(i, j, sx, sy));
    const n = pts.length, done = drawn * n;             // lines finished so far (and a bit of the next)

    ctx.lineCap = "round";
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = `rgba(${BLUE}, 0.85)`;
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
      const p = Math.max(0, Math.min(1, done - k));
      if (!p) break;
      const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % n];
      ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * p, ay + (by - ay) * p);
    }
    ctx.stroke();

    // each dot pops as the line reaches it
    for (let k = 0; k < n; k++) {
      const p = Math.max(0, Math.min(1, (done - k + 0.15) / 0.3));
      if (!p) break;
      const [x, y] = pts[k];
      const pop = 1 + Math.sin(p * Math.PI) * 0.6;       // a little overshoot
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(x, y, 4.5 * p * pop, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgb(${BLUE})`;
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
