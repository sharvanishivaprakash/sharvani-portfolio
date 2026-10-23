/*
  The About me scroll story.
  At first only the empty basket is there. As you scroll, the stickers fall into it one by one,
  starting with Sharvani's face, and the text on the blue card is uncovered line by line alongside.
  Scrolling back up takes them out again.

  On desktop the section stays pinned while you scroll through a taller track (see .about-track in the CSS).
  Under 900px wide the page is stacked, so the stickers follow the basket's position on screen
  and each text block uncovers as it comes into view.
  Visitors who ask for reduced motion see everything in place.
*/
(function () {
  const track = document.querySelector(".about-track");
  if (!track || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const section = track.querySelector(".about");
  const cart = section.querySelector(".cart");
  const items = [...section.querySelectorAll(".cart-item")].sort((a, b) => a.dataset.drop - b.dataset.drop);
  const texts = [...section.querySelectorAll(".uncover")];
  const root = document.documentElement;
  const wide = matchMedia("(min-width: 901px)");

  const START = 0.06, END = 0.9;               // the story runs between these points of the track
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const SPIN = items.map((_, i) => (i % 2 ? 1 : -1) * (10 + ((i * 7) % 9)));   // a little tilt while falling

  let p = 0, raf = 0, pinned = false;
  root.classList.add("js-about");

  function setup() {
    pinned = wide.matches;
    root.classList.toggle("js-about-pin", pinned);
    if (pinned) {
      track.style.setProperty("--track-h", section.offsetHeight + "px");
      // about a third of a screen of scrolling per sticker
      track.style.setProperty("--travel", Math.round(items.length * 0.3 * 100) + "vh");
    }
    tick();
  }

  // a fall: speeds up like it's dropped, lands, bounces a touch and settles
  function fall(t) {
    if (t < 0.7) return (t / 0.7) ** 2;
    const b = (t - 0.7) / 0.3;
    return 1 + Math.sin(b * Math.PI) * 0.035 * (1 - b);
  }

  function drawItems(progress) {
    const step = (END - START) / items.length;
    const vh = innerHeight, cartTop = cart.getBoundingClientRect().top;
    items.forEach((el, i) => {
      const t = clamp((progress - (START + i * step)) / (step * 1.5));
      if (t <= 0) { el.style.visibility = "hidden"; return; }
      el.style.visibility = "visible";
      // start just above the top of the screen
      const drop = cartTop + el.offsetTop + el.offsetHeight + 40;
      const e = fall(t);
      const y = -(1 - e) * Math.max(drop, vh * 0.4);
      const r = SPIN[i] * (1 - Math.min(1, e));
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg)`;
    });
  }

  function drawText(el, t) {
    const e = 1 - (1 - t) ** 3;
    el.style.clipPath = t >= 1 ? "none" : `inset(-10% -2% ${((1 - e) * 110).toFixed(1)}% -2%)`;
    el.style.transform = t >= 1 ? "" : `translate3d(0, ${((1 - e) * 14).toFixed(1)}px, 0)`;
  }

  function target() {
    const vh = innerHeight;
    if (pinned) {
      const r = track.getBoundingClientRect(), h = section.offsetHeight;
      const top = parseFloat(getComputedStyle(section).top) || 0;   // where the pinned section sits
      return clamp((top - r.top) / Math.max(1, r.height - h));
    }
    // stacked: the basket fills up as it travels from the bottom of the screen to near the top
    const c = cart.getBoundingClientRect();
    return clamp((vh * 0.9 - c.top) / (vh * 0.75 + c.height * 0.3));
  }

  function tick() {
    raf = 0;
    const goal = target();
    p += (goal - p) * 0.2;
    if (Math.abs(goal - p) < 0.0005) p = goal;
    else raf = requestAnimationFrame(tick);

    drawItems(p);
    if (pinned) {
      // the text keeps pace with the stickers: one block for every one and a half stickers
      const step = (END - START) / texts.length;
      texts.forEach((el, i) => drawText(el, clamp((p - (START + i * step)) / step)));
    } else {
      const vh = innerHeight;
      texts.forEach((el) => drawText(el, clamp((vh * 0.92 - el.getBoundingClientRect().top) / (vh * 0.25))));
    }
  }

  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", setup);
  wide.addEventListener("change", setup);
  addEventListener("load", setup);
  setup();
})();
