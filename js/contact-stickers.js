/*
  The stickers in "What next ?": the three round ones (the doodle, the lemon, the cat card) and the
  link stickers (LinkedIn, Instagram, Behance, Dribbble). Each one can be picked up and dropped anywhere
  in the section; the one in your hand comes to the front.
  A link sticker still opens its link on a plain click; once it has been dragged, letting go doesn't open it.
*/
(function () {
  const stickers = [...document.querySelectorAll(".c-sticker")];
  if (!stickers.length) return;
  let z = 10;

  stickers.forEach((el) => {
    let dx = 0, dy = 0, sx = 0, sy = 0, ox = 0, oy = 0, down = false, moved = false;
    el.draggable = false;
    el.addEventListener("dragstart", (e) => e.preventDefault());

    el.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      down = true; moved = false;
      sx = e.clientX; sy = e.clientY; ox = dx; oy = dy;
      el.style.zIndex = ++z;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!down) return;
      const mx = e.clientX - sx, my = e.clientY - sy;
      if (!moved && Math.hypot(mx, my) < 5) return;   // a small wobble is still a click
      moved = true;
      el.classList.add("is-held");
      dx = ox + mx; dy = oy + my;
      el.style.setProperty("--dx", dx + "px");
      el.style.setProperty("--dy", dy + "px");
    });
    const drop = () => { down = false; el.classList.remove("is-held"); };
    el.addEventListener("pointerup", drop);
    el.addEventListener("pointercancel", drop);
    // after a drag, the click that follows letting go is not a click on the link
    el.addEventListener("click", (e) => {
      if (moved) { e.preventDefault(); e.stopImmediatePropagation(); moved = false; }
    }, true);
  });
})();
