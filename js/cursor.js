/*
  Custom cursor: a small kumkum dot with a trailing ring.
  States (set on <body>):
    cursor-link  links and buttons: ring grows, dot hides
    cursor-view  anything with [data-cursor="view"]: ring fills and shows a label
                 (data-cursor-label overrides the default "View")
    cursor-text  paragraphs and headings: thin caret
    cursor-down  while pressing
  Only runs on devices with a fine pointer that can hover; touch keeps the native behaviour.
*/
(function () {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const dot = document.createElement("div");
  const ring = document.createElement("div");
  const label = document.createElement("span");
  dot.className = "cursor-dot";
  ring.className = "cursor-ring";
  label.className = "label";
  dot.setAttribute("aria-hidden", "true");
  ring.setAttribute("aria-hidden", "true");
  ring.appendChild(label);
  document.body.append(ring, dot);
  document.documentElement.classList.add("has-cursor");

  const body = document.body;
  let x = -100, y = -100, rx = x, ry = y;

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

  (function loop() {
    rx += (x - rx) * (reduce ? 1 : 0.18);
    ry += (y - ry) * (reduce ? 1 : 0.18);
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    requestAnimationFrame(loop);
  })();
})();
