/*
  Falling tabs in "What next ?".
  When the section comes into view, the pill tabs drop in one after another and land in a loose pile
  along the bottom. Each one has its own fall speed, tilt and spot, lands with a small bounce and then stays.
  The pile is worked out like a stack: every tab rests on whatever is already under it, so tabs overlap
  and lean on each other. The bottom row sits just below the edge and is a little blurred for depth.
  Once they have landed, hovering a tab nudges it aside; it slides back when the pointer leaves.
  It plays once. Visitors who ask for reduced motion see the finished pile straight away.
*/
(function () {
  const pile = document.querySelector(".tab-pile");
  if (!pile) return;
  const section = pile.closest("section");
  const tabs = [...pile.children];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let landed = false, played = false;

  // the same pile every time: a small seeded random
  function rng(seed) {
    return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }

  /* ---------- working out where each tab lands ---------- */

  function layout() {
    const W = pile.clientWidth, H = pile.clientHeight;
    const th = tabs[0].offsetHeight;
    const rand = rng(7);
    const COL = 4, n = Math.ceil(W / COL) + 1;
    const ground = new Float32Array(n).fill(-th * 0.12);      // the first row sits just below the edge
    const at = (x) => Math.max(0, Math.min(n - 1, Math.round(x / COL)));
    const highest = (x0, x1) => { let m = -1e9; for (let i = at(x0); i <= at(x1); i++) m = Math.max(m, ground[i]); return m; };
    const spots = [];

    tabs.forEach((el, k) => {
      const w = el.offsetWidth;
      const standing = k === 3;                                // one short tab stands on its end, like in the reference
      let best = null;
      // try a few spots and keep the lowest one, so the pile spreads out instead of towering
      const last = k === tabs.length - 1;               // "Let's make something" lands last, in plain view
      for (let tries = 0; tries < (last ? 1 : 5); tries++) {
        const cx = last ? W * 0.58 : -w * 0.15 + rand() * (W + w * 0.3);
        if (standing) {
          const base = highest(cx - th / 2, cx + th / 2);
          const c = { cx, cy: base + w / 2, r: 90 + (rand() - 0.5) * 6, top: base + w, x0: cx - th / 2, x1: cx + th / 2 };
          if (!best || c.top < best.top) best = c;
          continue;
        }
        const reach = w * 0.38;
        const hl = highest(cx - w / 2, cx - w / 2 + reach), hr = highest(cx + w / 2 - reach, cx + w / 2);
        let ang = Math.atan2(hr - hl, w - reach) * 180 / Math.PI;
        ang = Math.max(-26, Math.min(26, ang)) + (rand() - 0.5) * 14;
        const base = Math.max(hl, hr) - Math.abs(Math.sin(ang * Math.PI / 180)) * w * 0.32;
        const cy = Math.max((hl + hr) / 2, base) + th / 2;
        const c = { cx, cy, r: -ang, top: cy + th / 2 + Math.abs(Math.sin(ang * Math.PI / 180)) * w / 2, x0: cx - w / 2, x1: cx + w / 2, ang };
        const score = c.top + (c.cx < 0 || c.cx > W ? th * 0.6 : 0) + rand() * th * 1.4;
        if (!best || score < best.score) best = Object.assign(c, { score });
      }
      // keep the pile below the heading and links
      if (best.top > H) best.cy -= best.top - H, best.top = H;

      // the tab now becomes the ground for the ones that land after it
      for (let i = at(best.x0); i <= at(best.x1); i++) {
        const x = i * COL;
        let top;
        if (standing) top = best.top;
        else {
          const t = Math.tan((best.ang || 0) * Math.PI / 180);
          // a little less than the full height, so the next tabs tuck in and overlap
          top = best.cy + (x - best.cx) * t + th * 0.36 / Math.cos((best.ang || 0) * Math.PI / 180);
        }
        ground[i] = Math.max(ground[i], top);
      }
      spots.push(best);
    });
    return spots;
  }

  function place(spots) {
    tabs.forEach((el, k) => {
      const s = spots[k], w = el.offsetWidth, h = el.offsetHeight;
      el._s = s; el._w = w; el._h = h; el._z = k + 1;
      el.style.zIndex = k + 1;
      el.style.transform = rest(s, w, h);
      el.classList.toggle("is-deep", s.cy < h * 0.35);
      el.classList.add("is-placed");
    });
  }

  // tab centre at (cx, cy) measured from the bottom left of the pile
  const rest = (s, w, h, dx = 0, dy = 0, dr = 0) =>
    `translate(${(s.cx - w / 2 + dx).toFixed(1)}px, ${(-(s.cy - h / 2) + dy).toFixed(1)}px) rotate(${(s.r + dr).toFixed(2)}deg)`;

  /* ---------- nudging a tab aside on hover ---------- */

  tabs.forEach((el) => {
    const nudge = (e) => {
      if (!landed || !el._s) return;
      const b = el.getBoundingClientRect();
      // push away from the pointer, but always with a clear upward-and-aside drift so it visibly flies
      let dx = (b.left + b.width / 2) - e.clientX, dy = (b.top + b.height / 2) - e.clientY;
      const side = (b.left + b.width / 2) < pile.getBoundingClientRect().width / 2 ? -1 : 1;
      if (Math.abs(dx) < 10) dx = side * 20;
      dy = -Math.abs(dy) - 24;                           // always lift, never push further down
      const d = Math.hypot(dx, dy) || 1;
      const reach = Math.max(42, el._h * 1.15);
      el._hx = (dx / d) * reach; el._hy = Math.abs(dy / d) * reach;
      el._hr = side * 7;
      el.style.zIndex = 99;
      el.style.transition = "transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1)";
      el.style.transform = rest(el._s, el._w, el._h, el._hx, -el._hy, el._hr);
    };
    const back = () => {
      if (!el._s) return;
      el.style.transform = rest(el._s, el._w, el._h);
      // drop back to its place in the stack once it has slid home
      setTimeout(() => { if (el._z) el.style.zIndex = el._z; }, 400);
    };
    el.addEventListener("pointerenter", nudge);
    el.addEventListener("pointerleave", back);
  });

  /* ---------- the fall ---------- */

  function play() {
    played = true;
    const spots = layout();
    if (still) { place(spots); landed = true; return; }
    const rand = rng(11);
    const drop = section.offsetHeight + 80;
    let left = tabs.length;
    tabs.forEach((el, k) => {
      const s = spots[k], w = el.offsetWidth, h = el.offsetHeight;
      el._s = s; el._w = w; el._h = h; el._z = k + 1;
      el.style.zIndex = k + 1;
      el.classList.toggle("is-deep", s.cy < h * 0.35);
      el.classList.add("is-placed");
      const fall = 900 + rand() * 650;                          // each one falls at its own speed
      const spin = (rand() - 0.5) * 70;
      const bounce = 10 + rand() * 12;
      const a = el.animate([
        { transform: rest(s, w, h, 0, -drop, spin), easing: "cubic-bezier(0.45, 0, 0.9, 0.6)" },
        { transform: rest(s, w, h), offset: 0.72, easing: "cubic-bezier(0.2, 0.6, 0.4, 1)" },
        { transform: rest(s, w, h, 0, -bounce, -spin * 0.04), offset: 0.86, easing: "cubic-bezier(0.6, 0, 0.8, 0.4)" },
        { transform: rest(s, w, h) }
      ], { duration: fall, delay: 120 + k * 170 + rand() * 90, fill: "backwards" });
      el.style.transform = rest(s, w, h);
      a.onfinish = () => { if (--left === 0) landed = true; };
    });
  }

  new IntersectionObserver((entries, io) => {
    if (!entries[0].isIntersecting || played) return;
    io.disconnect();
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(play);
  }, { threshold: 0.3 }).observe(section);

  // after a resize the pile is rebuilt in place, without falling again
  let t;
  addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => { if (played && landed) place(layout()); }, 150);
  });
})();
