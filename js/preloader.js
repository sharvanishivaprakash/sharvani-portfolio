/*
  The intro on the homepage.
  On a black, grainy screen the four stickers (lemon, fish, cat, doodle) float in one after another
  and keep bobbing gently. A loading bar under them fills as the page loads; once the page is ready
  (and every sticker has landed) the stickers lift off and the screen slides up.
  A click, tap or key press skips straight to the end.
  The inline script in the <head> decides whether it plays (not for reduced motion,
  and not when coming back from another page of the site).
*/
(function () {
  const root = document.documentElement;
  const el = document.querySelector(".preloader");
  if (!el) return;
  if (!root.classList.contains("is-preloading")) { el.remove(); return; }

  const bar = el.querySelector(".pl-bar");
  const stickers = [...el.querySelectorAll(".pl-st img")];
  const t0 = performance.now();
  const MIN = 2800;      // the last sticker lands about 2s after they start, so the bar never finishes before them
  const MAX = 9000;      // a slow connection still gets in eventually
  let loaded = document.readyState === "complete";
  let shown = 0, raf = 0, done = false;

  // how far along the page is: the images that load straight away (not the lazy ones), plus the load event
  const imgs = [...document.images].filter((i) => i.loading !== "lazy" && !el.contains(i));
  const ready = () => imgs.filter((i) => i.complete).length / Math.max(1, imgs.length);
  addEventListener("load", () => { loaded = true; }, { once: true });

  function tick(now) {
    const t = now - t0;
    // the bar creeps along with time, jumps ahead as images arrive, and only reaches the end once the page has loaded
    let target = Math.max(Math.min(0.85, t / 2600), ready() * 0.9);
    if (loaded) target = 1;
    target = Math.min(target, t / MIN);               // never faster than the stickers
    shown += (target - shown) * 0.08;
    if (target === 1 && shown > 0.995) shown = 1;
    bar.style.setProperty("--p", shown.toFixed(4));
    if ((shown === 1 && t >= MIN) || t > MAX) return open();
    raf = requestAnimationFrame(tick);
  }

  function open() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    bar.style.setProperty("--p", 1);
    el.classList.add("is-in", "is-leaving");
    setTimeout(() => {
      el.classList.add("is-open");
      root.classList.remove("is-preloading");      // the page can scroll again, and it starts revealing underneath
      document.dispatchEvent(new Event("preloader:done"));
      setTimeout(() => el.remove(), 900);
    }, 450);
  }

  // start once the sticker pictures are in (or after a moment, whichever comes first), so they don't float in empty
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    el.classList.add("is-in");
    raf = requestAnimationFrame(tick);
  };
  Promise.all(stickers.map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()))).then(start);
  setTimeout(start, 700);

  // skip ahead
  ["pointerdown", "keydown"].forEach((ev) => addEventListener(ev, open, { once: true }));
})();
