/*
  Outside the briefs.
  The blue record turns (CSS) while the stickers on it stay still. Pointing at a sticker makes the note
  under the record blink and brings in the paper card with the same name on the left; moving off it puts
  the card away, unless the pointer goes onto the card itself (so the video on the fish card can be used).
  Clicking a sticker keeps its card open (the pointer can then cross the other stickers on the way to it);
  clicking it again, clicking elsewhere or Escape closes it.
  The fish card's YouTube video is only loaded while its card is open, starting muted.
  A sticker only counts where it is actually drawn (not the empty corners of its picture),
  so neighbouring stickers don't steal each other's hover.
  On touch screens a tap shows that sticker's card under the record and a second tap hides it.
  Keyboard focus works the same way as hovering.
*/
(function () {
  const record = document.querySelector(".record");
  if (!record) return;
  const section = record.closest(".outside");
  const stickers = [...record.querySelectorAll(".sticker")];
  const cards = {};
  document.querySelectorAll(".peek").forEach((el) => { cards[el.id.replace("peek-", "")] = el; });

  let hot = null, hideTimer = 0, pinned = null;

  function show(st) {
    clearTimeout(hideTimer);
    if (st === hot) return;
    if (hot) hot.classList.remove("is-hot");
    Object.values(cards).forEach((c) => c.classList.remove("is-on"));
    hot = st;
    stickers.forEach((s) => s.setAttribute("aria-expanded", String(s === st)));
    section.classList.toggle("is-peeking", !!st);
    Object.values(cards).forEach((c) => video(c, c === (st && cards[st.dataset.peek])));
    if (!st) return;
    st.classList.add("is-hot");
    const card = cards[st.dataset.peek];
    if (card) card.classList.add("is-on");
  }

  // put the YouTube player in a card's frame while it is open, and take it out again so it stops
  function video(card, on) {
    const slot = card.querySelector("[data-youtube]");
    if (!slot) return;
    if (!on) { slot.textContent = ""; return; }
    if (slot.firstChild) return;
    const id = slot.dataset.youtube;
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&playsinline=1&rel=0`;
    f.title = "Once Upon a Fish, the animated video";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    slot.appendChild(f);
  }
  // a short pause before putting a card away, so sliding to the next sticker or onto the card doesn't flicker
  function hideSoon() {
    clearTimeout(hideTimer);
    if (pinned) return;
    hideTimer = setTimeout(() => {
      const open = hot && cards[hot.dataset.peek];
      if (open && open.matches(":hover")) return;   // the pointer made it onto the card (or its video)
      show(null);
    }, 450);
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
    if (e.pointerType === "touch" || pinned) return;
    const st = stickerAt(e.clientX, e.clientY);
    if (st) show(st); else if (hot) hideSoon();
  });
  record.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") hideSoon(); });
  // the open card keeps itself open while the pointer is on it
  Object.values(cards).forEach((card) => {
    card.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch" && card.classList.contains("is-on")) clearTimeout(hideTimer); });
    card.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") hideSoon(); });
  });

  /* ---------- taps and keyboard ---------- */

  stickers.forEach((st) => {
    st.addEventListener("click", (e) => {
      // a click on an empty corner goes to whatever sticker is drawn there
      const target = e.detail ? stickerAt(e.clientX, e.clientY) : st;
      if (!target) return;
      const touch = matchMedia("(hover: none)").matches;
      // a second click (or tap) on the open sticker closes its card
      const closing = target === pinned || (touch && e.detail && target === hot);
      pinned = closing ? null : target;
      show(closing ? null : target);
    });
    st.setAttribute("aria-expanded", "false");
    st.addEventListener("focus", () => { if (st.matches(":focus-visible")) show(st); });
    st.addEventListener("blur", () => { if (hot === st) hideSoon(); });
  });
  function unpin() { pinned = null; show(null); }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") unpin(); });
  document.addEventListener("click", (e) => {
    if (pinned && !e.target.closest(".record, .peek.is-on")) unpin();
  });
})();
