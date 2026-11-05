/*
  I'm drawn to: six cards that turn over to their white back.
  With a mouse they turn while you hover (CSS); on touch screens a tap turns a card over and a second tap turns it back.
  Keyboard users can tab to a card, which turns it (CSS :focus-visible).
  On desktop the section makes a cinematic entrance the first time it comes into view: the cards rise as one
  deck in the middle and deal out to their places (CSS .will-deal / .is-dealt). Skipped for reduced motion.
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

  const section = document.querySelector(".drawn");
  const cards = section ? [...section.querySelectorAll(".drawn-cards li")] : [];
  if (!cards.length || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(min-width: 901px)").matches) return;
  const mid = (cards.length - 1) / 2;
  cards.forEach((li, i) => {
    li.style.setProperty("--k", mid - i);                 // how many card-widths it sits from the middle
    li.style.setProperty("--far", Math.abs(mid - i) - 0.5); // outer cards set off last
  });
  // Already on screen (e.g. a reload part-way down)? Leave it as it is.
  const r = section.getBoundingClientRect();
  if (r.top < innerHeight * 0.75) return;
  section.classList.add("will-deal");
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    section.classList.add("is-dealt");
    // once dealt, hand the cards back to the plain layout so hover flips aren't affected
    setTimeout(() => { section.classList.remove("will-deal", "is-dealt"); }, 2900);
  }, { threshold: 0.35 });
  io.observe(section);
})();
