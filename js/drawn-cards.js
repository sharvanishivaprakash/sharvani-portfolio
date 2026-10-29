/*
  I'm drawn to: six cards that turn over to their white back.
  With a mouse they turn while you hover (CSS); on touch screens a tap turns a card over and a second tap turns it back.
  Keyboard users can tab to a card, which turns it (CSS :focus-visible).
*/
(function () {
  document.querySelectorAll(".flip").forEach((card) => {
    card.setAttribute("aria-pressed", "false");
    card.addEventListener("pointerup", (e) => {
      if (e.pointerType === "mouse") return;
      const on = card.classList.toggle("is-turned");
      card.setAttribute("aria-pressed", String(on));
    });
  });
})();
