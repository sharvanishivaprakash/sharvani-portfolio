/*
  The hero doodle's eyes follow the cursor. Only the eyes move (the .hd-eyes group inside the
  inline doodle SVG), a little way towards the pointer, easing smoothly. When the pointer leaves
  the window they drift back to the middle. Off for touch-only screens and reduced motion.
*/
(function () {
  const eyes = document.querySelector(".hero-doodle .hd-eyes");
  if (!eyes) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const MAX_X = 0.7, MAX_Y = 0.45;            // how far the eyes can travel, in the doodle's own units
  const TILT = (12.16 * Math.PI) / 180;       // the doodle is rotated 12.16° on the page
  const cos = Math.cos(-TILT), sin = Math.sin(-TILT);
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;

  function aim(px, py) {
    const r = eyes.getBoundingClientRect();
    if (!r.width) return;
    // pointer offset from the eyes, turned into the doodle's tilted frame
    const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
    const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
    const d = Math.hypot(lx, ly) || 1;
    const reach = Math.min(1, d / 400);       // close to the face the eyes move less
    tx = (lx / d) * MAX_X * reach;
    ty = (ly / d) * MAX_Y * reach;
    if (!raf) raf = requestAnimationFrame(step);
  }

  function step() {
    x += (tx - x) * 0.14; y += (ty - y) * 0.14;
    eyes.setAttribute("transform", `translate(${x.toFixed(3)} ${y.toFixed(3)})`);
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(step) : 0;
  }

  addEventListener("pointermove", (e) => aim(e.clientX, e.clientY), { passive: true });
  document.documentElement.addEventListener("pointerleave", () => {
    tx = ty = 0;
    if (!raf) raf = requestAnimationFrame(step);
  });
})();
