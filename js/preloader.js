/*
  The intro on the homepage.
  On a black screen with softly moving dots, the blue doodle appears without its glasses,
  looks left, then right, then the glasses drop on. "sharvani" types in and the screen
  slides up to open the page. A click, tap or key press skips straight to the end.
  The inline script in the <head> decides whether it plays (not for reduced motion,
  and not when coming back from another page of the site).
*/
(function () {
  const root = document.documentElement;
  const el = document.querySelector(".preloader");
  if (!el) return;
  if (!root.classList.contains("is-preloading")) { el.remove(); return; }

  const eyes = el.querySelector(".pl-eyes");
  const type = el.querySelector(".pl-type");
  const NAME = "sharvani";
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const look = (x) => { eyes.style.transform = `translateX(${x}px)`; };   // in the doodle's own units

  /* ---------- the moving dots ---------- */

  const canvas = el.querySelector(".pl-dots"), ctx = canvas.getContext("2d");
  let dpr = 1, W = 0, H = 0, gap = 32, hole = 200, raf = 0;
  const t0 = performance.now();
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; gap = W < 700 ? 26 : 32;
    hole = Math.min(W, H) * 0.32;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  function dots(now) {
    const t = (now - t0) / 1000;
    const sx = Math.sin(t * 0.6) * gap * 0.35, sy = Math.cos(t * 0.5) * gap * 0.35;   // the grid sways
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (let j = -1; j <= H / gap + 1; j++) {
      for (let i = -1; i <= W / gap + 1; i++) {
        const x = i * gap + gap / 2 + sx, y = j * gap + gap / 2 + sy;
        const wave = Math.sin(i * 0.35 + j * 0.25 - t * 2.2);                     // a slow wave runs through
        const clear = Math.min(1, Math.hypot(x - W / 2, y - H / 2) / hole);        // a quiet patch behind the doodle and name
        if (clear < 0.5) continue;
        ctx.fillStyle = `rgba(255, 255, 255, ${((0.12 + 0.1 * wave) * Math.min(1, (clear - 0.5) * 2.5)).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, 1.1 + 0.5 * wave, 0, Math.PI * 2); ctx.fill();
      }
    }
    raf = requestAnimationFrame(dots);
  }
  size(); addEventListener("resize", size);
  raf = requestAnimationFrame(dots);

  /* ---------- the story ---------- */

  function typeName(from) {
    el.classList.add("is-typing");
    [...NAME].forEach((_, i) => at(from + i * 95, () => { type.textContent = NAME.slice(0, i + 1); }));
    return from + NAME.length * 95;
  }

  let done = false;
  function open() {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    el.classList.add("is-in", "has-glasses", "is-typing", "is-open");
    look(0); type.textContent = NAME;
    root.classList.remove("is-preloading");      // the page can scroll again, and it starts revealing underneath
    document.dispatchEvent(new Event("preloader:done"));
    setTimeout(() => { cancelAnimationFrame(raf); removeEventListener("resize", size); el.remove(); }, 900);
  }

  at(100, () => el.classList.add("is-in"));
  at(800, () => look(-1));                     // looks left
  at(1450, () => look(1));                     // then right
  at(2100, () => look(0));
  at(2400, () => el.classList.add("has-glasses"));
  const typed = typeName(3150);
  at(typed + 700, open);

  // skip ahead
  ["pointerdown", "keydown"].forEach((ev) => addEventListener(ev, open, { once: true }));
})();
