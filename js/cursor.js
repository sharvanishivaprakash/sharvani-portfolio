/*
  Custom cursor: a round eye that follows the pointer and looks the way you move.
  Like the reference, the pupil glances toward where the pointer is heading and settles back
  to the centre when you stop. It blinks now and then, and on click.
  States (set on <body>):
    cursor-link  links and buttons: eye grows, iris turns sage
    cursor-view  anything with [data-cursor="view"]: eye fills and shows a label
                 (data-cursor-label overrides the default "View")
    cursor-text  paragraphs and headings: eye shrinks so it doesn't cover the words
    cursor-down  while pressing (eye closes)
  Only runs on devices with a fine pointer that can hover; touch keeps the native behaviour.
*/
(function () {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const eye = document.createElement("div");
  eye.className = "cursor-eye";
  eye.setAttribute("aria-hidden", "true");
  eye.innerHTML = `
    <svg viewBox="0 0 40 26">
      <defs><clipPath id="eye-clip"><path d="M2 13 C 10 0.5, 30 0.5, 38 13 C 30 25.5, 10 25.5, 2 13 Z"/></clipPath></defs>
      <g clip-path="url(#eye-clip)">
        <g class="ball">
          <circle class="iris" cx="20" cy="13" r="8.2"/>
          <circle class="pupil" cx="20" cy="13" r="3.6"/>
        </g>
      </g>
      <path class="lid" d="M2 13 C 10 0.5, 30 0.5, 38 13 C 30 25.5, 10 25.5, 2 13 Z"/>
    </svg>
    <span class="label"></span>`;
  document.body.appendChild(eye);
  document.documentElement.classList.add("has-cursor");

  const ball = eye.querySelector(".ball");
  const label = eye.querySelector(".label");
  const body = document.body;

  let x = -100, y = -100; // pointer
  let ex = x, ey = y;     // eye position (eases toward the pointer)
  let lx = 0, ly = 0;     // where the pupil is looking, in SVG units

  addEventListener(
    "mousemove",
    (e) => {
      x = e.clientX;
      y = e.clientY;
      body.classList.remove("cursor-out");
    },
    { passive: true }
  );
  document.addEventListener("mouseleave", () => body.classList.add("cursor-out"));
  addEventListener("mousedown", () => body.classList.add("cursor-down"));
  addEventListener("mouseup", () => body.classList.remove("cursor-down"));

  // Decide cursor state from what's under the pointer (works for content rendered later too).
  document.addEventListener("mouseover", (e) => {
    const t = e.target;
    const view = t.closest("[data-cursor='view']");
    const link = t.closest("a, button, [role='button'], label, input[type='submit']");
    const text = t.closest("p, h1, h2, h3, li, dd") && !link;
    body.classList.toggle("cursor-view", !!view);
    body.classList.toggle("cursor-link", !view && !!link);
    body.classList.toggle("cursor-text", !view && !link && !!text);
    if (view) label.textContent = view.dataset.cursorLabel || "View";
  });

  // An occasional blink, every few seconds.
  if (!reduce) {
    (function scheduleBlink() {
      setTimeout(() => {
        eye.classList.add("is-blinking");
        setTimeout(() => eye.classList.remove("is-blinking"), 140);
        scheduleBlink();
      }, 2500 + Math.random() * 4000);
    })();
  }

  (function loop() {
    const ease = reduce ? 1 : 0.22;
    const dx = x - ex;
    const dy = y - ey;
    ex += dx * ease;
    ey += dy * ease;

    // The gap between pointer and eye is the direction of travel: look that way.
    const dist = Math.hypot(dx, dy);
    const reach = Math.min(1, dist / 40);
    const tx = dist ? (dx / dist) * 6 * reach : 0;
    const ty = dist ? (dy / dist) * 3.2 * reach : 0;
    lx += (tx - lx) * 0.2;
    ly += (ty - ly) * 0.2;

    eye.style.transform = `translate3d(${ex}px, ${ey}px, 0)`;
    ball.setAttribute("transform", `translate(${lx.toFixed(2)} ${ly.toFixed(2)})`);
    requestAnimationFrame(loop);
  })();
})();
