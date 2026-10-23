/*
  A slow, liquid wobble on the hero name, like letters seen through moving water.
  An SVG turbulence filter (in index.html) bends the letters; this drifts the noise
  so the wobble never repeats. Hovering the name lets it settle; leaving starts it again.
*/
(function () {
  const name = document.querySelector(".hero-name");
  const filter = document.getElementById("liquid");
  if (!name || !filter || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const noise = filter.querySelector("feTurbulence");
  const warp = filter.querySelector("feDisplacementMap");

  let amount = 0;                         // 0 = still, 1 = full wobble
  let target = 1;
  let visible = true, raf = 0;
  const t0 = performance.now();
  name.classList.add("is-liquid");

  function frame(now) {
    raf = 0;
    const t = (now - t0) / 1000;
    amount += (target - amount) * 0.06;  // ease in and out of the hover

    // how far the letters bend scales with the type, so it reads the same on a phone
    const size = parseFloat(getComputedStyle(name).fontSize) || 96;
    const fx = 0.012 + Math.sin(t * 1.1) * 0.004;
    const fy = 0.024 + Math.cos(t * 0.8) * 0.008;
    noise.setAttribute("baseFrequency", `${(fx * 96 / size).toFixed(5)} ${(fy * 96 / size).toFixed(5)}`);
    warp.setAttribute("scale", (amount * size * (0.5 + Math.sin(t * 0.7) * 0.1)).toFixed(2));

    if (visible && (amount > 0.01 || target > 0)) raf = requestAnimationFrame(frame);
    else if (amount <= 0.01) warp.setAttribute("scale", "0");
  }
  const start = () => { if (!raf) raf = requestAnimationFrame(frame); };

  name.addEventListener("pointerenter", () => { target = 0; start(); });
  name.addEventListener("pointerleave", () => { target = 1; start(); });

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); }).observe(name);
  start();
})();
