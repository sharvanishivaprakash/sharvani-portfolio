/*
  The About me scroll story.
  At first only the empty basket is there. As you scroll, the stickers fall into it one by one,
  starting with Sharvani's face, and the text on the blue card is uncovered line by line alongside.
  Scrolling back up takes them out again.
  Once every sticker is in the basket, they can be picked up and dropped anywhere
  (the eye cursor says "Drag"). After the first one is moved, the stickers stay out for good.

  On desktop the section stays pinned while you scroll through a taller track (see .about-track in the CSS).
  Under 900px wide the page is stacked, so the stickers follow the basket's position on screen
  and each text block uncovers as it comes into view.
  Visitors who ask for reduced motion see everything in place.

  On desktop the face sticker in the middle of the record (Outside the briefs) is the first one in:
  as you scroll from the record down to About me it leaves the record and drops into the basket.
  It stays on the record until it's a quarter of the way down the screen, then lands a little after
  About me is pinned. "Hey, I'm Sharvani" and the other stickers start coming in at the same time.
  Each sticker gives a very small bounce when it lands in the basket (CSS: .cart-item.is-landed).
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

  const START = 0.04, END = 0.92;              // the story runs between these points of its scroll
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const SPIN = items.map((_, i) => (i % 2 ? 1 : -1) * (10 + ((i * 7) % 9)));   // a little tilt while falling

  // the face on the record travels into the basket instead of falling in (desktop only)
  const face = items[0];
  const recordFace = document.querySelector(".record .face");
  let travel = 0;                              // 0: face still on the record, 1: face in the basket
  const travels = () => pinned && !!recordFace;

  let p = 0, raf = 0, pinned = false;
  let full = false, locked = false, z = 10;    // locked: someone has moved a sticker, so the story stays finished
  items.forEach((el) => { el.dx = 0; el.dy = 0; });
  root.classList.add("js-about");

  function setup() {
    pinned = wide.matches;
    root.classList.toggle("js-about-pin", pinned);
    if (pinned) {
      track.style.setProperty("--track-h", section.offsetHeight + "px");
      // a short pinned stretch: most of the story already plays while the face is on its way down
      track.style.setProperty("--travel", "100vh");
    }
    tick();
  }

  // a fall: speeds up like it's dropped (the little bounce on landing is a CSS animation)
  const fall = (t) => t * t;
  function landed(el, on) {
    if (el.classList.contains("is-landed") !== on) el.classList.toggle("is-landed", on);
  }

  function drawItems(progress) {
    const fallers = travels() ? items.slice(1) : items;
    const step = (END - START) / fallers.length;
    const vh = innerHeight, cartTop = cart.getBoundingClientRect().top;
    if (travels()) drawFace();
    else if (recordFace) recordFace.style.visibility = "";
    fallers.forEach((el, i) => {
      const t = locked ? 1 : clamp((progress - (START + i * step)) / (step * 1.5));
      landed(el, t >= 1);
      if (t <= 0) { el.style.visibility = "hidden"; return; }
      el.style.visibility = "visible";
      // start just above the top of the screen
      const drop = cartTop + el.offsetTop + el.offsetHeight + 40;
      const e = fall(t);
      const y = -(1 - e) * Math.max(drop, vh * 0.4);
      const r = SPIN[i] * (1 - Math.min(1, e));
      el.style.transform = `translate3d(${el.dx.toFixed(1)}px, ${(y + el.dy).toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg)` +
        (el === held ? " scale(1.06)" : "");
    });
    setFull(locked || progress >= START + (fallers.length - 1 + 1.5) * step);
  }

  // the face flies from the middle of the record to its spot in the basket, shrinking or growing to fit,
  // with a little tilt on the way
  function drawFace() {
    const hand = face === held ? " scale(1.06)" : "";
    landed(face, locked || travel >= 0.999);
    if (locked || travel >= 0.999) {
      recordFace.style.visibility = "hidden";
      face.style.visibility = "visible";
      face.style.transform = `translate3d(${face.dx.toFixed(1)}px, ${face.dy.toFixed(1)}px, 0)` + hand;
      return;
    }
    if (travel <= 0) {
      recordFace.style.visibility = "";
      face.style.visibility = "hidden";
      return;
    }
    const a = recordFace.getBoundingClientRect(), c = cart.getBoundingClientRect();
    const bx = c.left + face.offsetLeft + face.offsetWidth / 2, by = c.top + face.offsetTop + face.offsetHeight / 2;
    const e = travel < 0.5 ? 2 * travel ** 2 : 1 - (-2 * travel + 2) ** 2 / 2;
    const s0 = a.width / face.offsetWidth;
    const x = (a.left + a.width / 2 - bx) * (1 - e);
    const y = (a.top + a.height / 2 - by) * (1 - e);
    const s = s0 + (1 - s0) * e, r = Math.sin(e * Math.PI) * -14;
    recordFace.style.visibility = "hidden";
    face.style.visibility = "visible";
    face.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`;
  }

  // How much scrolling is left until: the face on the record nears the top of the screen (start),
  // About me is pinned in place (pin), the face is in the basket (land, a little into the pinned stretch)
  // and the pinned stretch is over (end).
  // The face waits on the record until it is a quarter of the way down the screen, so you have
  // the whole of Outside the briefs to look at it before it sets off.
  const LEAVE = 0.25, LAND = 0.3;              // as parts of the screen height
  function marks() {
    const a = recordFace.getBoundingClientRect(), r = track.getBoundingClientRect();
    const top = parseFloat(getComputedStyle(section).top) || 0;
    const pin = r.top - top;
    return { start: Math.min(a.top + a.height / 2 - innerHeight * LEAVE, pin - 1), pin, land: pin + innerHeight * LAND, end: pin + r.height - section.offsetHeight };
  }
  // the face's journey: 0 until it nears the top of the screen, 1 a little after About me is pinned in place
  function travelTarget() {
    if (!travels()) return 0;
    const m = marks();
    return clamp(-m.start / (m.land - m.start));
  }

  /* ---------- picking stickers up once the basket is full ---------- */

  function setFull(on) {
    if (on === full) return;
    full = on;
    cart.classList.toggle("is-full", on);
    items.forEach((el) => {
      if (on) { el.dataset.cursor = "view"; el.dataset.cursorLabel = "Drag"; }
      else { delete el.dataset.cursor; delete el.dataset.cursorLabel; }
    });
  }

  let held = null, sx = 0, sy = 0, ox = 0, oy = 0;
  items.forEach((el) => {
    el.draggable = false;
    el.addEventListener("pointerdown", (e) => {
      if (!full || e.button > 0) return;
      e.preventDefault();
      held = el; locked = true;
      sx = e.clientX; sy = e.clientY; ox = el.dx; oy = el.dy;
      el.style.zIndex = ++z;                     // the one in your hand comes to the front
      el.classList.add("is-held");
      el.setPointerCapture(e.pointerId);
      kick();
    });
    el.addEventListener("pointermove", (e) => {
      if (held !== el) return;
      el.dx = ox + e.clientX - sx; el.dy = oy + e.clientY - sy;
      drawItems(p);
    });
    const drop = () => {
      if (held !== el) return;
      held = null;
      el.classList.remove("is-held");
      drawItems(p);
    };
    el.addEventListener("pointerup", drop);
    el.addEventListener("pointercancel", drop);
  });

  function drawText(el, t) {
    const e = 1 - (1 - t) ** 3;
    el.style.clipPath = t >= 1 ? "none" : `inset(-10% -2% ${((1 - e) * 110).toFixed(1)}% -2%)`;
    el.style.transform = t >= 1 ? "" : `translate3d(0, ${((1 - e) * 14).toFixed(1)}px, 0)`;
  }

  function target() {
    const vh = innerHeight;
    if (travels()) {
      // the story starts with the face's journey and ends with the pinned stretch
      const m = marks();
      return clamp(-m.start / Math.max(1, m.end - m.start));
    }
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
    const goal = target(), tGoal = travelTarget();
    p += (goal - p) * 0.2;
    travel += (tGoal - travel) * 0.2;
    if (Math.abs(goal - p) < 0.0005 && Math.abs(tGoal - travel) < 0.0005) { p = goal; travel = tGoal; }
    else raf = requestAnimationFrame(tick);

    drawItems(p);
    if (locked) texts.forEach((el) => drawText(el, 1));
    else if (pinned) {
      // the text keeps pace with the stickers, starting with "Hey, I'm Sharvani" as the face sets off
      const step = (END - START) / texts.length;
      texts.forEach((el, i) => drawText(el, clamp((p - (START + i * step)) / (step * 0.9))));
    } else {
      const vh = innerHeight;
      texts.forEach((el) => drawText(el, clamp((vh * 0.92 - el.getBoundingClientRect().top) / (vh * 0.25))));
    }
  }

  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", setup);
  wide.addEventListener("change", setup);
  addEventListener("load", setup);
  setup();
})();
