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
      a.target = "_blank"; a.rel = "noopener";          // the PDF opens in a new tab, the site stays open
    } else {
      a.addEventListener("click", (e) => { e.preventDefault(); say("Resume coming soon."); });
    }
  });
  const archives = $("#nav-archives");
  if (archives && archives.getAttribute("href") === "#") {
    archives.addEventListener("click", (e) => { e.preventDefault(); say("Archives coming soon."); });
  }

  // Contact links in "What next ?": the Gmail button opens a new email in Gmail (its link is in index.html);
  // the LinkedIn, Instagram, Behance and Medium stickers open in a new tab once their address is in js/content.js.
  const placeholder = (v) => !v || v === "#" || /^\[.*\]$/.test(v);
  const social = (name) => S.links.find((l) => new RegExp(name, "i").test(l.label)) || {};
  document.querySelectorAll(".js-contact").forEach((a) => {
    const kind = a.dataset.kind;
    if (kind === "gmail") return;
    const href = kind === "email" ? (placeholder(S.email) ? "" : `mailto:${S.email}`)
      : (placeholder(social(kind).href) ? "" : social(kind).href);
    if (href) {
      a.href = href;
      if (kind !== "email") { a.target = "_blank"; a.rel = "noopener"; }
    } else {
      const name = a.textContent.trim() || kind;
      a.addEventListener("click", (e) => { e.preventDefault(); say(`${name} link coming soon.`); });
    }
  });

  // Copy button next to the email in "What next ?"
  document.querySelectorAll(".next-copy").forEach((btn) => {
    let t;
    const done = () => {
      btn.classList.add("is-done");
      say("Email copied.");
      clearTimeout(t);
      t = setTimeout(() => btn.classList.remove("is-done"), 1800);
    };
    btn.addEventListener("click", () => {
      const text = btn.dataset.copy;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, () => say(text));
      } else {
        const ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) { say(text); }
        ta.remove();
      }
    });
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
      // measured on the page (About is pinned inside its scroll track, so its own offsetTop is near 0)
      sections.forEach((s) => { if (s && (s.closest(".about-track") || s).getBoundingClientRect().top + scrollY <= y) current = s.id; });
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

  // Section dots for a Figma case study: click to jump, and the dot of the part on screen lights up.
  function wireCaseDots(nav, box, study) {
    const links = [...nav.querySelectorAll("a")];
    const top = (i) => box.getBoundingClientRect().top + scrollY + (study.sections[i].y / study.height) * box.offsetHeight;
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    links.forEach((a, i) => a.addEventListener("click", (e) => {
      e.preventDefault();
      scrollTo({ top: Math.max(0, top(i) - (i ? 90 : 120)), behavior: smooth ? "smooth" : "auto" });
    }));
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = scrollY + innerHeight * 0.35;
      let cur = 0;
      links.forEach((_, i) => { if (top(i) <= line) cur = i; });
      links.forEach((a, i) => a.toggleAttribute("aria-current", i === cur));
      const r = box.getBoundingClientRect();
      nav.classList.toggle("is-hidden", r.bottom < innerHeight * 0.5);
    };
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener("resize", update);
    update();
  }

  // A case study exported from Figma: a centred stack of image slices, with clips and links laid over their spots.
  function renderFigmaStudy(study, p, next) {
    const pct = (v, total) => `${(v / total) * 100}%`;
    const at = (o) => `left:${pct(o.x, study.width)};top:${pct(o.y, study.height)};width:${pct(o.w, study.width)};height:${pct(o.h, study.height)}`;
    const round = (v) => (v.radius ? `;border-radius:${(v.radius / v.w) * 100}% / ${(v.radius / v.h) * 100}%` : "");
    const slices = study.slices
      .map((s, i) => `<img src="${esc(s.src)}" srcset="${esc(s.src)} 1440w, ${esc(s.src2x)} 2880w" sizes="(max-width: 900px) 100vw, 75vw"
          width="${study.width}" height="${s.h}" alt="${esc(s.alt)}"${i > 1 ? ' loading="lazy"' : ""} decoding="async">`)
      .join("");
    const videos = (study.videos || (study.video ? [study.video] : []))
      .map((v) => v.youtube ? `
        <div class="figma-video figma-video--youtube" style="${at(v)}${round(v)}">
          <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtube)}?rel=0&playsinline=1" title="${esc(v.label)}"
            allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>
        </div>` : `
        <div class="figma-video${v.controls ? " figma-video--player" : ""}" style="${at(v)}${round(v)}">
          <video src="${esc(v.src)}" poster="${esc(v.poster)}" ${v.controls ? "controls" : "autoplay muted loop"} playsinline preload="${v.controls ? "none" : "metadata"}" aria-label="${esc(v.label)}"></video>
          ${v.overlay ? `<img class="figma-video-over" src="${esc(v.overlay)}" alt="" loading="lazy">` : ""}
        </div>`)
      .join("");
    const links = (study.links || [])
      .map((l) => `<a class="figma-link" href="${esc(l.href)}" target="_blank" rel="noopener" style="${at(l)}" aria-label="${esc(l.label)}"></a>`)
      .join("");

    // Dots in the black space on the right: one per section, they jump straight to it.
    const sections = study.sections || [];
    const dots = sections.length > 1 ? `
      <nav class="case-dots" aria-label="Sections of this case study">
        ${sections.map((s, i) => `<a href="#" data-i="${i}" aria-label="${esc(s.label)}"><span class="case-dots-label">${esc(s.label)}</span></a>`).join("")}
      </nav>` : "";

    const case_ = $("#case");
    case_.classList.add("case--figma");
    case_.innerHTML = `
      <h1 class="sr-only">${esc(p.title)}</h1>
      <div class="figma-study" style="aspect-ratio:${study.width} / ${study.height}">${slices}${videos}${links}</div>
      ${dots}
      <div class="case-end">
        <a class="case-back" href="index.html#work">← All work</a>
        <a class="case-next" href="project.html?p=${encodeURIComponent(next.slug)}" data-cursor="view" data-cursor-label="Next">
          <span>Next project</span><strong>${esc(next.title)} →</strong>
        </a>
      </div>`;

    if (dots) wireCaseDots(case_.querySelector(".case-dots"), case_.querySelector(".figma-study"), study);

    // Looping clips play only while they're on screen (and not at all for reduced motion).
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    case_.querySelectorAll(".figma-video:not(.figma-video--player) video").forEach((vid) => {
      if (reduce) { vid.removeAttribute("autoplay"); vid.pause(); vid.controls = true; return; }
      new IntersectionObserver(([e]) => (e.isIntersecting ? vid.play().catch(() => {}) : vid.pause()), { rootMargin: "200px" }).observe(vid);
    });
    // A film with sound pauses once it's scrolled away.
    case_.querySelectorAll(".figma-video--player video").forEach((vid) => {
      new IntersectionObserver(([e]) => { if (!e.isIntersecting) vid.pause(); }).observe(vid);
    });
  }
})();
