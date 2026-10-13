/*
  Hero name: "Sharvani SP" goes through a short, fine raster and resolves into
  "Interaction Designer" (same size, weight and colour). Hover or keyboard focus on desktop,
  tap on touch. Leaving brings the name back.
  The real text is always in the DOM (plus an .sr-only sentence for screen readers);
  the canvas only draws while the swap is happening.
  Reduced motion gets a plain crossfade instead.
*/
(function () {
  const h1 = document.getElementById("hero-name");
  if (!h1) return;
  const a = h1.querySelector(".name-a");
  const b = h1.querySelector(".name-b");
  const canvas = h1.querySelector(".name-canvas");
  const ctx = canvas.getContext("2d");
  const off = document.createElement("canvas");
  const octx = off.getContext("2d", { willReadFrequently: true });
  const blur = document.getElementById("round-blur");

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = matchMedia("(hover: hover)").matches;
  const DURATION = 760; // ms for the whole swap

  let showingB = false; // state the DOM text is in when idle
  let anim = null;      // { to, t0, p }

  // The SVG filter that rounds the pixel corners scales with the type.
  function tune() {
    const fs = parseFloat(getComputedStyle(h1).fontSize);
    if (blur) blur.setAttribute("stdDeviation", Math.max(0.8, fs * 0.014).toFixed(2));
  }

  function sizeCanvas() {
    const r = h1.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return { r, dpr };
  }

  // Draw one state (each line span) into a small offscreen canvas at 1/block scale.
  function drawState(state, block, alpha) {
    const { r, dpr } = sizeCanvas();
    const scale = dpr / block;
    off.width = Math.max(1, Math.ceil(canvas.width / block));
    off.height = Math.max(1, Math.ceil(canvas.height / block));
    octx.clearRect(0, 0, off.width, off.height);
    octx.save();
    octx.scale(scale, scale);
    state.querySelectorAll(".ln").forEach((ln) => {
      const cs = getComputedStyle(ln);
      const fontSize = parseFloat(cs.fontSize);
      const lineH = parseFloat(cs.lineHeight) || fontSize;
      const sr = ln.getBoundingClientRect();
      const text = cs.textTransform === "uppercase" ? ln.textContent.toUpperCase() : ln.textContent;
      octx.font = `${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;
      if ("letterSpacing" in octx) octx.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
      octx.fillStyle = cs.color;
      octx.textBaseline = "alphabetic";
      const m = octx.measureText(text);
      const asc = m.fontBoundingBoxAscent || fontSize * 0.8;
      const desc = m.fontBoundingBoxDescent || fontSize * 0.2;
      // Same baseline maths CSS uses for a line box
      const baseline = sr.top - r.top + (sr.height - (asc + desc)) / 2 + asc;
      octx.fillText(text, sr.left - r.left, baseline);
    });
    octx.restore();

    // Hard-edge the alpha so the blocks read as a clean raster, not blur.
    if (block > 1.5) {
      const img = octx.getImageData(0, 0, off.width, off.height);
      const d = img.data;
      for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 110 ? 255 : 0;
      octx.putImageData(img, 0, 0);
    }
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;
    ctx.drawImage(off, 0, 0, off.width * block, off.height * block);
    ctx.globalAlpha = 1;
  }

  const smooth = (k) => k * k * (3 - 2 * k);

  function frame(now) {
    if (!anim) return;
    const p = (now - anim.t0) / DURATION;
    if (p >= 1) {
      anim = null;
      h1.classList.remove("is-pixelating");
      h1.classList.toggle("is-b", showingB);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    anim.p = p;
    const fontSize = parseFloat(getComputedStyle(h1).fontSize);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // A fine raster: the peak block is a small fraction of the letter height.
    const maxBlock = Math.max(2, (fontSize / 16) * dpr);
    // Raster rises, peaks briefly at the middle, then resolves.
    const k = smooth(1 - Math.abs(p - 0.5) * 2);
    const block = Math.max(1, Math.round(1 + k * (maxBlock - 1)));
    const from = anim.to ? a : b;
    const to = anim.to ? b : a;
    // Short crossfade around the peak so the swap never flashes.
    const mix = smooth(Math.min(1, Math.max(0, (p - 0.38) / 0.24)));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mix < 1) drawState(from, block, 1 - mix);
    if (mix > 0) drawState(to, block, mix);
    requestAnimationFrame(frame);
  }

  function go(toB) {
    if (reduce) {
      showingB = toB;
      h1.classList.toggle("is-b", toB);
      return;
    }
    if (anim) {
      if (anim.to === toB) return;
      // Reverse from where we are.
      const p = anim.p || 0;
      anim.to = toB;
      anim.t0 = performance.now() - (1 - p) * DURATION;
      showingB = toB;
      return;
    }
    if (showingB === toB) return;
    showingB = toB;
    anim = { to: toB, t0: performance.now(), p: 0 };
    h1.classList.add("is-pixelating");
    requestAnimationFrame(frame);
  }

  if (canHover) {
    h1.addEventListener("mouseenter", () => go(true));
    h1.addEventListener("mouseleave", () => go(false));
  } else {
    h1.addEventListener("click", () => go(!showingB));
  }
  // Keyboard focus shows it too (a tap also focuses, so only react to visible focus).
  h1.addEventListener("focus", () => { if (h1.matches(":focus-visible")) go(true); });
  h1.addEventListener("blur", () => go(false));
  h1.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(!showingB); }
  });

  tune();
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(tune, 120); });
})();
