/*
  Hero name: "Sharvani SP" rasterises into big pixels, swaps to "interaction designer",
  then sharpens again. Hover or focus on desktop, tap on touch. Leaving swaps it back.
  The real text is always in the DOM (and an .sr-only sentence for screen readers);
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

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = matchMedia("(hover: hover)").matches;
  const DURATION = 560; // ms for the whole swap

  let showingB = false; // state the DOM text is in when idle
  let anim = null;      // { from, to, t0, p }

  // Size "interaction designer" so it spans the same width as the name.
  function fit() {
    b.style.setProperty("--fit", "1em");
    const wa = a.getBoundingClientRect().width;
    const wb = b.getBoundingClientRect().width;
    if (wa && wb) b.style.setProperty("--fit", (wa / wb).toFixed(4) + "em");
  }

  function sizeCanvas() {
    const r = h1.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    return { r, dpr };
  }

  // Draw one text span into the small offscreen canvas at 1/block scale, then blow it up.
  function draw(span, block) {
    const { r, dpr } = sizeCanvas();
    const sr = span.getBoundingClientRect();
    const cs = getComputedStyle(span);
    const fontSize = parseFloat(cs.fontSize);
    const lineH = parseFloat(cs.lineHeight) || fontSize;
    const scale = dpr / block;

    off.width = Math.max(1, Math.ceil(canvas.width / block));
    off.height = Math.max(1, Math.ceil(canvas.height / block));
    octx.clearRect(0, 0, off.width, off.height);
    octx.save();
    octx.scale(scale, scale);
    octx.font = `${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;
    if ("letterSpacing" in octx) octx.letterSpacing = cs.letterSpacing;
    octx.fillStyle = cs.color;
    octx.textBaseline = "alphabetic";
    const m = octx.measureText(span.textContent);
    const asc = m.fontBoundingBoxAscent || fontSize * 0.8;
    const desc = m.fontBoundingBoxDescent || fontSize * 0.2;
    // Same baseline maths CSS uses for a single line box
    const baseline = sr.top - r.top + (lineH - (asc + desc)) / 2 + asc;
    octx.fillText(span.textContent, sr.left - r.left, baseline);
    octx.restore();

    // Hard-edge the alpha so the blocks read as pixels, not blur.
    if (block > 1.5) {
      const img = octx.getImageData(0, 0, off.width, off.height);
      const d = img.data;
      for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 90 ? 255 : 0;
      octx.putImageData(img, 0, 0);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, off.width * block, off.height * block);
  }

  function frame(now) {
    if (!anim) return;
    let p = (now - anim.t0) / DURATION;
    if (p >= 1) {
      anim = null;
      h1.classList.remove("is-pixelating");
      h1.classList.toggle("is-b", showingB);
      return;
    }
    anim.p = p;
    const fontSize = parseFloat(getComputedStyle(h1).fontSize);
    const maxBlock = Math.max(6, fontSize / 7) * Math.min(window.devicePixelRatio || 1, 2);
    // 0 → 0.5: source grows blocky; 0.5 → 1: target sharpens
    const half = p < 0.5;
    const k = half ? p / 0.5 : (1 - p) / 0.5;
    const eased = k * k * (3 - 2 * k);
    const block = Math.max(1, Math.round(1 + eased * (maxBlock - 1)));
    draw(half ? (anim.to ? a : b) : (anim.to ? b : a), block);
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
      // Reverse mid-way from where we are.
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

  const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(fit);
  fit();
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(fit, 120); });
})();
