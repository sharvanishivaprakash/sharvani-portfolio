/*
  Renders the content from js/content.js into the page.
  index.html  → work grid, collage, playground, contact
  project.html?p=<slug> → one case study (placeholder until you write it)
*/
(function () {
  const S = window.SITE;
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const pad = (n) => String(n).padStart(2, "0");
  const isPlaceholder = (s) => !s || /^\[.*\]$/.test(String(s).trim());
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // A real image if one is set, otherwise a labelled placeholder box.
  function media(image, alt, label, tint) {
    if (image) return `<img src="${esc(image)}" alt="${esc(alt)}" loading="lazy">`;
    return `<div class="ph tint-${tint}" role="img" aria-label="Placeholder image: ${esc(label)}">[ ${esc(label)} ]</div>`;
  }

  function metaList(m) {
    const rows = [["Type", m.type], ["Discipline", m.discipline], ["Year", m.year], ["Team", m.team]];
    return rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
  }

  /* ---------- Shared bits ---------- */

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
  const fc = $("#footer-coords");
  if (fc) fc.textContent = S.coordinates;

  const clock = $("#clock");
  if (clock) {
    const tick = () => {
      const opts = { hour: "2-digit", minute: "2-digit", hour12: false };
      if (S.timezone) opts.timeZone = S.timezone;
      let t;
      try { t = new Intl.DateTimeFormat("en-GB", opts).format(new Date()); }
      catch (e) { t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()); }
      clock.textContent = `${S.location} · ${t}`;
    };
    tick();
    setInterval(tick, 30000);
  }

  const bar = $(".nav-bar, .top-nav");
  if (bar) {
    const onScroll = () => bar.classList.toggle("is-scrolled", scrollY > 8);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
  }

  // On the homepage the hero waits for the name intro (js/preloader.js) to finish.
  const reveal = () => requestAnimationFrame(() => document.body.classList.add("is-loaded"));
  if (document.documentElement.classList.contains("is-preloading")) addEventListener("preloader:done", reveal, { once: true });
  else reveal();

  const page = document.body.dataset.page;
  if (page === "home") renderHome();
  if (page === "project") renderProject();

  /* ---------- Home ---------- */

  function renderHome() {
    // Resume in the nav uses the Resume link from content.js
    const resume = S.links.find((l) => /resume/i.test(l.label));
    const navResume = $("#nav-resume");
    if (navResume && resume) navResume.href = resume.href;

    // Work
    $("#work-grid").innerHTML = S.projects
      .map((p, i) => `
        <article class="project${p.size === "large" ? " is-large" : ""}">
          <a class="project-link" href="project.html?p=${encodeURIComponent(p.slug)}" data-cursor="view" data-cursor-label="Open">
            <div class="project-media">
              <span class="mono project-num">${pad(i + 1)}</span>
              ${media(p.image, p.title, `${p.title} cover image`, (i % 4) + 1)}
            </div>
            <div class="project-body">
              <h3>${esc(p.title)}</h3>
              <span class="mono project-open">Open <span class="arrow" aria-hidden="true">→</span></span>
              <p class="project-summary">${esc(p.summary)}</p>
              <dl class="mono project-meta">${metaList(p.meta)}</dl>
            </div>
          </a>
        </article>`)
      .join("");

    // About
    $("#about-intro").textContent = S.about.intro;
    const shapes = ["", "is-tall", "", "is-wide", "is-tall", "", "is-wide"];
    $("#collage").innerHTML = S.about.collage
      .map((c, i) => `
        <li class="polaroid ${shapes[i % shapes.length]}">
          <button class="polaroid-card" type="button" aria-expanded="false">
            ${media(c.image, c.caption, `Photo: ${c.caption}`, (i % 4) + 1)}
            <span class="polaroid-caption">${esc(c.caption)}</span>
          </button>
          <span class="polaroid-note">${esc(c.note)}</span>
        </li>`)
      .join("");
    // Tap / Enter shows the note; one at a time.
    const cards = document.querySelectorAll(".polaroid");
    cards.forEach((li) => {
      const btn = li.querySelector(".polaroid-card");
      btn.addEventListener("click", () => {
        const open = !li.classList.contains("is-open");
        cards.forEach((o) => { o.classList.remove("is-open"); o.querySelector(".polaroid-card").setAttribute("aria-expanded", "false"); });
        li.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
      });
    });

    // Playground
    $("#play-grid").innerHTML = S.playground
      .map((it, i) => {
        const inner = `
          <div style="--ratio:${Number(it.ratio) || 1}">${media(it.image, it.title, `${it.kind}`, ((i + 2) % 4) + 1)}</div>
          <div class="mono play-cap"><span>${esc(it.title)}</span><span class="kind">${esc(it.kind)}</span></div>`;
        return `<li class="play-item">${
          it.href ? `<a class="play-link" href="${esc(it.href)}" data-cursor="view" data-cursor-label="Look">${inner}</a>` : `<div class="play-link">${inner}</div>`
        }</li>`;
      })
      .join("");

    // Contact
    const toast = $("#toast");
    let toastTimer;
    const say = (msg) => {
      toast.textContent = msg;
      toast.classList.add("is-on");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2600);
    };

    $("#email-text").textContent = S.email;
    const hello = $("#say-hello");
    if (isPlaceholder(S.email)) {
      hello.addEventListener("click", (e) => { e.preventDefault(); say("Email coming soon. Add it in js/content.js."); });
    } else {
      hello.href = `mailto:${S.email}`;
    }
    $("#copy-email").addEventListener("click", async () => {
      if (isPlaceholder(S.email)) return say("No email yet. Add it in js/content.js.");
      try { await navigator.clipboard.writeText(S.email); say("Copied. Talk soon!"); }
      catch (e) { say(S.email); }
    });

    $("#socials").innerHTML = S.links
      .map((l) => {
        const ext = /^https?:/.test(l.href);
        return `<li><a href="${esc(l.href)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${esc(l.label)}</a></li>`;
      })
      .join("");
    document.querySelectorAll("#socials a").forEach((a) => {
      if (a.getAttribute("href") === "#") a.addEventListener("click", (e) => { e.preventDefault(); say("Link coming soon."); });
    });
    if (navResume && navResume.getAttribute("href") === "#") navResume.addEventListener("click", (e) => e.preventDefault());

    // Active nav item follows the section in view.
    const links = document.querySelectorAll(".nav a[data-section]");
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

    const blocks = ["Context", "Problem", "Process", "Outcome"]
      .map((h) => `
        <section class="case-block">
          <h2>${h}</h2>
          <p>[Placeholder] Write the ${h.toLowerCase()} for ${esc(p.title)} here.</p>
        </section>`)
      .join("");

    $("#case").innerHTML = `
      <a class="mono case-back" href="index.html#work">← All work</a>
      <span class="mono case-num">${pad(idx + 1)} / ${pad(S.projects.length)}</span>
      <h1>${esc(p.title)}</h1>
      <p class="case-summary">${esc(p.summary)}</p>
      <dl class="mono case-meta">${metaList(p.meta)}</dl>
      <figure class="case-hero">${media(p.image, p.title, `${p.title} hero image`, (idx % 4) + 1)}</figure>
      ${blocks}
      <a class="case-next" href="project.html?p=${encodeURIComponent(next.slug)}" data-cursor="view" data-cursor-label="Next">
        <span class="mono">Next project</span><strong>${esc(next.title)} →</strong>
      </a>`;
  }
})();
