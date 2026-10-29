/*
  Outside the briefs.
  The blue record turns (CSS) while the stickers on it stay still. Pointing at a sticker makes it blink
  and brings in the paper card with the same name on the left; moving off it puts the card away.
  A sticker only counts where it is actually drawn (not the empty corners of its picture),
  so neighbouring stickers don't steal each other's hover.
  On touch screens a tap shows that sticker's card under the record and a second tap hides it.
  Keyboard focus works the same way as hovering.
*/
(function () {
  const record = document.querySelector(".record");
  if (!record) return;
  const stickers = [...record.querySelectorAll(".sticker")];
  const cards = {};
  document.querySelectorAll(".peek").forEach((el) => { cards[el.id.replace("peek-", "")] = el; });

  let hot = null, hideTimer = 0;

  function show(st) {
    clearTimeout(hideTimer);
    if (st === hot) return;
    if (hot) hot.classList.remove("is-hot");
    Object.values(cards).forEach((c) => c.classList.remove("is-on"));
    hot = st;
    stickers.forEach((s) => s.setAttribute("aria-expanded", String(s === st)));
    if (!st) return;
    st.classList.add("is-hot");
    const card = cards[st.dataset.peek];
    if (card) card.classList.add("is-on");
  }
  // a short pause before putting a card away, so sliding from one sticker to the next doesn't flicker
  function hideSoon() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => show(null), 120);
  }

  /* ---------- where each sticker is actually drawn ---------- */

  const alpha = new Map();   // sticker -> { w, h, data }
  stickers.forEach((st) => {
    const img = st.querySelector("img");
    const read = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        alpha.set(st, { w: c.width, h: c.height, data: ctx.getImageData(0, 0, c.width, c.height).data });
      } catch (e) { /* if the pixels can't be read, the whole picture counts */ }
    };
    if (img.complete && img.naturalWidth) read(); else img.addEventListener("load", read, { once: true });
  });

  function drawnAt(st, x, y) {
    const r = st.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return false;
    const a = alpha.get(st);
    if (!a) return true;
    const px = Math.min(a.w - 1, Math.floor(((x - r.left) / r.width) * a.w));
    const py = Math.min(a.h - 1, Math.floor(((y - r.top) / r.height) * a.h));
    return a.data[(py * a.w + px) * 4 + 3] > 40;
  }
  // the topmost sticker drawn under the pointer (later in the markup = on top)
  function stickerAt(x, y) {
    for (let i = stickers.length - 1; i >= 0; i--) if (drawnAt(stickers[i], x, y)) return stickers[i];
    return null;
  }

  /* ---------- mouse and pen ---------- */

  record.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const st = stickerAt(e.clientX, e.clientY);
    if (st) show(st); else if (hot) hideSoon();
  });
  record.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") hideSoon(); });

  /* ---------- taps and keyboard ---------- */

  stickers.forEach((st) => {
    st.addEventListener("click", (e) => {
      // a click on an empty corner goes to whatever sticker is drawn there
      const target = e.detail ? stickerAt(e.clientX, e.clientY) : st;
      if (!target) return;
      show(target === hot && e.detail && matchMedia("(hover: none)").matches ? null : target);
    });
    st.setAttribute("aria-expanded", "false");
    st.addEventListener("focus", () => { if (st.matches(":focus-visible")) show(st); });
    st.addEventListener("blur", () => { if (hot === st) hideSoon(); });
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") show(null); });
})();
