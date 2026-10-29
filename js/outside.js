/*
  Outside the briefs.
  The blue record turns (CSS) while the stickers on it stay still.
  Pointing at a sticker lifts it a touch and makes the note under the record blink.
  Clicking (or tapping) a sticker brings in the paper card with the same name on the left;
  clicking it again, clicking somewhere else or Escape puts the card away.
  A sticker only counts where it is actually drawn (not the empty corners of its picture),
  so neighbouring stickers don't steal each other's clicks.
  Clicking the face in the middle of the record scrolls down to About me, where it drops into the basket.
  The fish card's YouTube video is only loaded while its card is open, starting muted.
*/
(function () {
  const record = document.querySelector(".record");
  if (!record) return;
  const section = record.closest(".outside");
  const stickers = [...record.querySelectorAll(".sticker")];
  const cards = {};
  document.querySelectorAll(".peek").forEach((el) => { cards[el.id.replace("peek-", "")] = el; });

  let open = null, pointed = null;

  function show(st) {
    if (st === open) return;
    open = st;
    stickers.forEach((s) => {
      s.classList.toggle("is-open", s === st);
      s.setAttribute("aria-expanded", String(s === st));
    });
    Object.entries(cards).forEach(([name, card]) => {
      const on = !!st && st.dataset.peek === name;
      card.classList.toggle("is-on", on);
      video(card, on);
    });
  }

  function point(st) {
    if (st === pointed) return;
    if (pointed) pointed.classList.remove("is-pointed");
    pointed = st;
    if (st) st.classList.add("is-pointed");
    section.classList.toggle("is-pointing", !!st);
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

  /* ---------- pointing ---------- */

  record.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    point(stickerAt(e.clientX, e.clientY));
  });
  record.addEventListener("pointerleave", () => point(null));

  /* ---------- clicks, taps and keyboard ---------- */

  stickers.forEach((st) => {
    st.setAttribute("aria-expanded", "false");
    st.addEventListener("click", (e) => {
      // a click on an empty corner goes to whatever sticker is drawn there (keyboard clicks have no position)
      const target = e.detail ? stickerAt(e.clientX, e.clientY) : st;
      if (!target) return;
      show(target === open ? null : target);
    });
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") show(null); });
  document.addEventListener("click", (e) => {
    if (open && !e.target.closest(".record, .peek.is-on")) show(null);
  });

  // the face goes to About me: scroll to where everything there has come in
  const faceLink = record.querySelector(".face-link");
  const track = document.querySelector(".about-track");
  if (faceLink && track) {
    faceLink.addEventListener("click", (e) => {
      e.preventDefault();
      const about = track.querySelector(".about");
      const pinned = getComputedStyle(about).position === "sticky";
      const pinTop = parseFloat(getComputedStyle(about).top) || 0;
      const y = track.getBoundingClientRect().top + scrollY + (pinned ? track.offsetHeight - about.offsetHeight - pinTop : -80);
      scrollTo({ top: y, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  }
})();
