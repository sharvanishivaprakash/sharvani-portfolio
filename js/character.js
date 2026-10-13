/*
  Hero character: the pupils follow the pointer.
  Each iris is its own image, clipped by an eye-shaped mask so it can never leave the eye.
  At rest (touch, reduced motion, no pointer yet) the eyes keep the original sideways glance.
  Positions below are measured from the artwork, in % of the character image.
*/
(function () {
  const fig = document.getElementById("character");
  if (!fig) return;

  const EYES = {
    l: { eye: [33.905, 54.615, 11.438, 9.772], iris: [47.143, -5.556, 52.857, 101.111] },
    r: { eye: [56.536, 52.334, 11.928, 10.206], iris: [39.041, -2.128, 53.425, 96.809] }
  };
  const ART_WIDTH = 1224;   // width of the artwork the numbers above come from
  const LOOK_LEFT = 44;     // how far the irises travel left, in artwork pixels
  const LOOK_RIGHT = 3;
  const LOOK_UP = 3;
  const LOOK_DOWN = 5;

  const irises = [];
  fig.querySelectorAll(".char-eye").forEach((el) => {
    const d = EYES[el.dataset.eye];
    const [x, y, w, h] = d.eye;
    Object.assign(el.style, { left: x + "%", top: y + "%", width: w + "%", height: h + "%" });
    const mask = `url(assets/character/eye-mask-${el.dataset.eye}.png)`;
    el.style.webkitMaskImage = mask;
    el.style.maskImage = mask;
    const iris = el.querySelector(".char-iris");
    const [ix, iy, iw, ih] = d.iris;
    Object.assign(iris.style, { left: ix + "%", top: iy + "%", width: iw + "%", height: ih + "%" });
    irises.push(iris);
  });

  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduce) return; // neutral resting gaze

  let tx = 0, ty = 0; // target offset, artwork pixels
  let cx = 0, cy = 0; // current offset
  let running = false;

  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const r = fig.querySelector(".char-art").getBoundingClientRect();
      const ex = r.left + r.width * 0.5;   // between the eyes
      const ey = r.top + r.height * 0.58;  // eye line
      const nx = Math.max(-1, Math.min(1, (e.clientX - ex) / (r.width * 1.6)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - ey) / (r.height * 1.6)));
      // nx = 1 (far right) keeps the original glance; further left turns the eyes toward the pointer.
      tx = nx >= 0 ? -LOOK_LEFT * (1 - nx) * 0.5 + LOOK_RIGHT * nx : -LOOK_LEFT * (0.5 - nx * 0.5);
      ty = ny < 0 ? ny * LOOK_UP : ny * LOOK_DOWN;
      if (!running) { running = true; requestAnimationFrame(step); }
    },
    { passive: true }
  );

  function step() {
    // Ease toward the target for a small, soft delay
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    const scale = fig.querySelector(".char-art").getBoundingClientRect().width / ART_WIDTH;
    const t = `translate(${(cx * scale).toFixed(2)}px, ${(cy * scale).toFixed(2)}px)`;
    irises.forEach((i) => (i.style.transform = t));
    if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) requestAnimationFrame(step);
    else running = false;
  }
})();
