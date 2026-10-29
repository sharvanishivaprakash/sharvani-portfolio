/*
  Moving through the homepage section by section.
  - Each section's parts rise in as they come into view (a short fade, lift and un-blur, one after another).
  - Once you've scrolled past a section, it softly blurs and dims, so attention stays on the one in front of you.
  Visitors who ask for reduced motion see everything as it is.
*/
(function () {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  /* ---------- rising in ---------- */

  // the parts of each section, in the order they come in
  const groups = [
    [".works-title", ".works .tape", ".project"],
    ["#outside-title", ".outside .tape", ".record", ".outside-note"],
    [".next-title", ".next-line", ".contact-links li"]
  ];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

  function watch() {
    groups.forEach((sels) => {
      let k = 0;
      sels.forEach((sel) => $$(sel).forEach((el) => {
        if (el.classList.contains("rise")) return;
        el.classList.add("rise");
        el.style.setProperty("--d", (k++ % 4) * 120 + "ms");   // a small stagger inside a section
        io.observe(el);
      }));
    });
  }
  watch();
  // the project cards are drawn by main.js; catch them if they arrive later
  const grid = document.getElementById("work-grid");
  if (grid) new MutationObserver(watch).observe(grid, { childList: true });

  /* ---------- blurring what's behind you ---------- */

  const blocks = $$(".hero, .drawn, .works, .outside, .about-track");
  let raf = 0;
  function blur() {
    raf = 0;
    const vh = innerHeight;
    blocks.forEach((el) => {
      const r = el.getBoundingClientRect();
      // starts once the section's bottom edge passes 45% of the window, full when it reaches the top
      const t = Math.max(0, Math.min(1, (vh * 0.45 - r.bottom) / (vh * 0.45)));
      el.style.filter = t > 0.01 ? `blur(${(t * 6).toFixed(2)}px)` : "";
      el.style.opacity = t > 0.01 ? (1 - t * 0.55).toFixed(3) : "";
    });
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(blur); };
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", kick);
  blur();
})();
