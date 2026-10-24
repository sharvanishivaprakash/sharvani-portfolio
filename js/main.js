/*
  Renders the content from js/content.js into the page.
  index.html  → selected works, nav state, placeholder links
  project.html?p=<slug> → one case study (placeholder until you write it)
*/
(function () {
  const S = window.SITE;
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const pad = (n) => String(n).padStart(2, "0");

  // A real image if one is set, otherwise a plain placeholder panel.
  function media(image, alt, label) {
    if (image) return `<img src="${esc(image)}" alt="${esc(alt)}" loading="lazy">`;
    return `<div class="ph" role="img" aria-label="Placeholder image: ${esc(label)}"></div>`;
  }

  function metaList(m) {
    const rows = [["Type", m.type], ["Discipline", m.discipline], ["Year", m.year], ["Team", m.team]];
    return rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
  }

  /* ---------- Shared bits ---------- */

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  const bar = $(".top-nav");
  if (bar) {
    const onScroll = () => bar.classList.toggle("is-scrolled", scrollY > 8);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
  }

  // Small message at the bottom of the screen, for links that aren't ready yet.
  const toast = $("#toast");
  let toastTimer;
  const say = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2600);
  };

  // Resume buttons use the Resume link from content.js
  const resume = S.links.find((l) => /resume/i.test(l.label));
  document.querySelectorAll(".js-resume").forEach((a) => {
    if (resume && resume.href !== "#") {
      a.href = resume.href;
      if (/^https?:/.test(resume.href)) { a.target = "_blank"; a.rel = "noopener"; }
    } else {
      a.addEventListener("click", (e) => { e.preventDefault(); say("Resume coming soon."); });
    }
  });
  const playground = $("#nav-playground");
  if (playground && playground.getAttribute("href") === "#") {
    playground.addEventListener("click", (e) => { e.preventDefault(); say("Playground coming soon."); });
  }

  // Contact links in "What next ?": Gmail opens a new email, LinkedIn and Instagram open in a new tab.
  const placeholder = (v) => !v || v === "#" || /^\[.*\]$/.test(v);
  const social = (name) => S.links.find((l) => new RegExp(name, "i").test(l.label)) || {};
  document.querySelectorAll(".js-contact").forEach((a) => {
    const kind = a.dataset.kind;
    const href = kind === "email" ? (placeholder(S.email) ? "" : `mailto:${S.email}`)
      : (placeholder(social(kind).href) ? "" : social(kind).href);
    if (href) {
      a.href = href;
      if (kind !== "email") { a.target = "_blank"; a.rel = "noopener"; }
    } else {
      const name = kind === "email" ? "Email" : kind === "linkedin" ? "LinkedIn" : "Instagram";
      a.addEventListener("click", (e) => { e.preventDefault(); say(`${name} link coming soon.`); });
    }
  });

  // the hero comes in once the intro has opened (or straight away when there is no intro)
  const loaded = () => requestAnimationFrame(() => document.body.classList.add("is-loaded"));
  if (document.documentElement.classList.contains("is-preloading")) document.addEventListener("preloader:done", loaded, { once: true });
  else loaded();

  const page = document.body.dataset.page;
  if (page === "home") renderHome();
  if (page === "project") renderProject();

  /* ---------- Home ---------- */

  function renderHome() {
    $("#work-grid").innerHTML = S.projects
      .map((p) => `
        <article class="project">
          <a class="project-link" href="project.html?p=${encodeURIComponent(p.slug)}" data-cursor="view" data-cursor-label="Open">
            <div class="project-media">${media(p.image, `${p.title} cover`, `${p.title} cover image`)}${p.hover ? `<img class="project-hover" src="${esc(p.hover)}" alt="" loading="lazy">` : ""}</div>
            <h3>${esc(p.title)}</h3>
            <p class="project-summary">${esc(p.summary)}</p>
            <ul class="project-tags">${(p.tags || []).map((t) => `<li>[ ${esc(t)} ]</li>`).join("")}</ul>
          </a>
        </article>`)
      .join("");

    // Active nav item follows the section in view.
    const links = document.querySelectorAll(".pill a[data-section]");
    const sections = [...links].map((a) => document.getElementById(a.dataset.section));
    const setActive = () => {
      const y = scrollY + innerHeight * 0.35;
      let current = null;
      sections.forEach((s) => { if (s && s.offsetTop <= y) current = s.id; });
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = "contact";
      links.forEach((a) => {
        const on = a.dataset.section === current;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    };
    setActive();
    addEventListener("scroll", setActive, { passive: true });
    addEventListener("resize", setActive);
  }

  /* ---------- Case study ---------- */

  function renderProject() {
    const slug = new URLSearchParams(location.search).get("p");
    const idx = Math.max(0, S.projects.findIndex((p) => p.slug === slug));
    const p = S.projects[idx];
    const next = S.projects[(idx + 1) % S.projects.length];
    document.title = `${p.title} — ${S.name}`;

    const study = (window.CASE_STUDIES || {})[p.slug];
    if (study) return renderFigmaStudy(study, p, next);

    const blocks = ["Context", "Problem", "Process", "Outcome"]
      .map((h) => `
        <section class="case-block">
          <h2>${h}</h2>
          <p>[Placeholder] Write the ${h.toLowerCase()} for ${esc(p.title)} here.</p>
        </section>`)
      .join("");

    $("#case").innerHTML = `
      <a class="case-back" href="index.html#work">← All work</a>
      <span class="case-num">${pad(idx + 1)} / ${pad(S.projects.length)}</span>
      <h1>${esc(p.title)}</h1>
      <p class="case-summary">${esc(p.summary)}</p>
      <dl class="case-meta">${metaList(p.meta)}</dl>
      <figure class="case-hero">${media(p.image, p.title, `${p.title} hero image`)}</figure>
      ${blocks}
      <a class="case-next" href="project.html?p=${encodeURIComponent(next.slug)}" data-cursor="view" data-cursor-label="Next">
        <span>Next project</span><strong>${esc(next.title)} →</strong>
      </a>`;
  }

  // A case study exported from Figma: a centred stack of image slices, plus the screens video in its spot.
  function renderFigmaStudy(study, p, next) {
    const pct = (v, total) => `${(v / total) * 100}%`;
    const slices = study.slices
      .map((s, i) => `<img src="${esc(s.src)}" srcset="${esc(s.src)} 1440w, ${esc(s.src2x)} 2880w" sizes="(max-width: 900px) 100vw, 75vw"
          width="${study.width}" height="${s.h}" alt="${esc(s.alt)}"${i > 1 ? ' loading="lazy"' : ""} decoding="async">`)
      .join("");
    const v = study.video;
    const at = v ? `left:${pct(v.x, study.width)};top:${pct(v.y, study.height)};width:${pct(v.w, study.width)};height:${pct(v.h, study.height)}` : "";
    const video = v ? `
        <div class="figma-video" style="${at}">
          <video src="${esc(v.src)}" poster="${esc(v.poster)}" autoplay muted loop playsinline preload="metadata" aria-label="${esc(v.label)}"></video>
          ${v.overlay ? `<img class="figma-video-over" src="${esc(v.overlay)}" alt="" loading="lazy">` : ""}
        </div>` : "";

    const case_ = $("#case");
    case_.classList.add("case--figma");
    case_.innerHTML = `
      <h1 class="sr-only">${esc(p.title)}</h1>
      <div class="figma-study" style="aspect-ratio:${study.width} / ${study.height}">${slices}${video}</div>
      <div class="case-end">
        <a class="case-back" href="index.html#work">← All work</a>
        <a class="case-next" href="project.html?p=${encodeURIComponent(next.slug)}" data-cursor="view" data-cursor-label="Next">
          <span>Next project</span><strong>${esc(next.title)} →</strong>
        </a>
      </div>`;

    // Play the screens only while they're on screen (and not at all for reduced motion).
    const vid = $(".figma-video video", case_);
    if (!vid) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { vid.removeAttribute("autoplay"); vid.pause(); vid.controls = true; return; }
    new IntersectionObserver(([e]) => (e.isIntersecting ? vid.play().catch(() => {}) : vid.pause()), { rootMargin: "200px" }).observe(vid);
  }
})();
