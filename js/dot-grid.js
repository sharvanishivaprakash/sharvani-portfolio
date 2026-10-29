/*
  A softly moving dot grid behind the hero and the "I connect the dots" statement,
  and again behind Outside the briefs and About me (every .dots-zone gets its own).
  The grid sways a little and a slow wave runs through it; dots near the cursor grow and turn blue.
  As you scroll down to the statement its words appear line by line; scrolling back up takes them away again.

  The canvas is only as tall as the window and follows the scroll inside its section,
  so it stays sharp on retina screens without a huge bitmap.
*/
document.querySelectorAll(".dots-bg").forEach((canvas, n) => {
  const zone = canvas.parentElement;
  const fadeIn = n > 0;                   // a later grid also fades in at its top, after the section above
  const box = zone.querySelector(".statement-box");
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BLUE = "0, 134, 250";             // --blue

  let dpr = 1, W = 0, H = 0, VH = 0, gap = 32, visible = false, raf = 0;
  const t0 = performance.now();
  const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, on: false };
  let drawn = 0;                          // how far the statement has come in, 0 to 1 (follows the scroll)

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

  /* ---------- the statement's lines ---------- */

  const lines = box ? [...box.querySelectorAll(".s-line")] : [];

  // 0 when the words come up from the bottom of the window, 1 once they're a bit above the middle
  function scrolled() {
    if (still) return 1;
    const b = box.getBoundingClientRect(), mid = (b.top + b.bottom) / 2;
    return Math.max(0, Math.min(1, (innerHeight * 0.92 - mid) / (innerHeight * 0.5)));
  }

  // the words come in line by line over this part of the scroll
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const WORDS = [0.05, 0.9];
  function showLines(p) {
    const n = lines.length, span = (WORDS[1] - WORDS[0]) / n;
    lines.forEach((el, k) => {
      const t = clamp01((p - WORDS[0] - k * span) / (span * 1.2));
      const e = 1 - (1 - t) ** 3;
      el.style.opacity = e.toFixed(3);
      el.style.transform = t >= 1 ? "" : `translateY(${((1 - e) * 18).toFixed(1)}px)`;
      el.style.filter = t >= 1 ? "" : `blur(${((1 - e) * 6).toFixed(1)}px)`;
    });
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
    const fadeEdge = gap * 3;                           // grid fades out just before the next section
    const i0 = -1, i1 = Math.ceil(W / gap) + 1;
    const j0 = Math.floor(off / gap) - 1, j1 = Math.ceil((off + VH) / gap) + 1;

    // plain dots, batched into two paths: grey and blue
    const grey = new Path2D(), hot = [];
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        let [x, y] = pos(i, j, sx, sy);
        if (y < -gap || y > H) continue;
        const edge = Math.min(1, (H - y) / fadeEdge, fadeIn ? y / fadeEdge : 1);
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

    joinDots();
  }

  // the statement's lines follow the scroll
  function joinDots() {
    if (!box) return;
    const goal = scrolled();
    drawn += (goal - drawn) * 0.12;
    if (still || Math.abs(goal - drawn) < 0.001) drawn = goal;
    showLines(drawn);
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
});
