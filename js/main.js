/* Renders pages from window.SITE (js/content.js) and wires up the small interactions. */
(function () {
  const S = window.SITE;
  const page = document.body.dataset.page;
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Placeholder art, or the real image once `src` is set in content.js.
  function art(src, label, alt) {
    if (src) return `<img class="cover-img" src="${esc(src)}" alt="${esc(alt || "")}" loading="lazy">`;
    return `<div class="ph" role="img" aria-label="Placeholder image"><span>${esc(label)}</span></div>`;
  }

  /* ---------- Shared header bits and footer ---------- */
  const coords = $(".coords");
  if (coords) coords.textContent = S.coordinates;
  const socials = $(".socials");
  if (socials) socials.innerHTML = S.links.map((l) => `<li><a class="u" href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("");

  const footer = $("#footer");
  if (footer) {
    footer.innerHTML = `
      <span>© ${new Date().getFullYear()} ${esc(S.name)}</span>
      <a class="u" href="mailto:${esc(S.email)}">${esc(S.email)}</a>
      <ul>${S.links.map((l) => `<li><a class="u" href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("")}</ul>`;
  }

  /* ---------- Home ---------- */
  if (page === "home") {
    $("#role").textContent = S.role;
    $("#companies").innerHTML = S.companies.map((c) => `<li>${esc(c)}</li>`).join("");
    $("#headline").textContent = S.headline;
    $("#contact").innerHTML = `
      <p>${esc(S.location)}</p>
      <p>${esc(S.availability)}</p>
      <p>E: <a class="u" href="mailto:${esc(S.email)}">${esc(S.email)}</a></p>`;
    $("#interests").innerHTML = S.about.interests.map((t) => `<li>${esc(t)}</li>`).join("");
  }

  /* ---------- Projects ---------- */
  if (page === "projects") {
    $("#project-grid").innerHTML = S.projects
      .map(
        (p, i) => `
        <a class="project-card reveal" style="--i:${i}" href="project.html?p=${encodeURIComponent(p.slug)}" data-cursor="view">
          <div class="thumb">${art(p.cover, "Cover image", p.title)}</div>
          <div class="meta"><h2>${esc(p.title)}</h2><span class="cat">${esc(p.discipline)}</span></div>
        </a>`
      )
      .join("");
  }

  /* ---------- Side projects ---------- */
  if (page === "side") {
    $("#archive").innerHTML = S.sideProjects
      .map((sp) => {
        const external = /^https?:/.test(sp.href);
        return `
        <a class="archive-item" href="${esc(sp.href)}" data-cursor="view" data-cursor-label="${external ? "Open" : "View"}"${
          external ? ' target="_blank" rel="noopener"' : ""
        }>
          <div class="thumb">${art(sp.image, "Image", sp.title)}</div>
          <div class="meta"><h3>${esc(sp.title)}</h3><span class="cat">${esc(sp.kind)}</span></div>
        </a>`;
      })
      .join("");
  }

  /* ---------- Project detail ---------- */
  if (page === "project") {
    const slug = new URLSearchParams(location.search).get("p");
    const i = Math.max(0, S.projects.findIndex((p) => p.slug === slug));
    const p = S.projects[i];
    const next = S.projects[(i + 1) % S.projects.length];
    document.title = `${p.title} • ${S.name}`;
    const shots = [p.cover, ...(p.images || [])];

    $("#project").innerHTML = `
      <header class="project-head">
        <h1 class="project-title reveal">${esc(p.title)}</h1>
        <ul class="tags reveal" style="--i:1">${(p.tags || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <p class="project-started reveal" style="--i:2">Started this project in ${esc(p.year)}</p>
      </header>
      <div class="gallery reveal" style="--i:3">
        ${shots.map((src, k) => `<div class="shot${k > 0 ? " half" : ""}">${art(src, k ? "Project image" : "Hero image 16:9", p.title)}</div>`).join("")}
      </div>
      <section class="overview">
        <h2>Overview</h2>
        <div>
          <p>${esc(p.summary)}</p>
          ${p.sections.map((s) => `<p style="margin-top:1rem"><strong>${esc(s.heading)}.</strong> ${esc(s.body)}</p>`).join("")}
          <dl class="facts">
            <div><dt>Year</dt><dd>${esc(p.year)}</dd></div>
            <div><dt>Category</dt><dd>${esc(p.discipline)}</dd></div>
            <div><dt>Role</dt><dd>${esc(p.role)}</dd></div>
            <div><dt>Team</dt><dd>${esc(p.team)}</dd></div>
          </dl>
          <div class="actions">
            ${p.link ? `<a class="btn solid" href="${esc(p.link)}" target="_blank" rel="noopener">Visit project</a>` : ""}
            <a class="btn" href="projects.html">Back</a>
          </div>
        </div>
      </section>
      <a class="next-project" href="project.html?p=${encodeURIComponent(next.slug)}" data-cursor="view" data-cursor-label="Next">
        <small>Next project</small>
        <span class="title">${esc(next.title)}</span>
        <div class="thumb">${art(next.cover, "Cover image", next.title)}</div>
      </a>`;
  }

  /* ---------- About ---------- */
  if (page === "about") {
    const a = S.about;
    $("#portrait").innerHTML = art(a.portrait, "Portrait photo", `Portrait of ${S.name}`);
    $("#about-body").innerHTML = a.paragraphs.map((t) => `<p>${esc(t)}</p>`).join("");
    $("#interests").innerHTML = a.interests.map((t) => `<li>${esc(t)}</li>`).join("");
    $("#cv").innerHTML = a.experience
      .map((e) => `<li><span class="what">${esc(e.what)}</span><span class="where">${esc(e.where)}</span><span class="when">${esc(e.when)}</span></li>`)
      .join("");
    $("#about-email").href = `mailto:${S.email}`;
  }

  /* ---------- Kolam: a looping line drawn around a grid of dots ---------- */
  function drawKolam(svg) {
    // Four-petal rose curve (r = cos 2θ) weaving between dots, like a simple pulli kolam.
    const pts = [];
    for (let t = 0; t <= Math.PI * 2 + 0.001; t += Math.PI / 90) {
      const r = 44 * Math.cos(2 * t);
      pts.push(`${(50 + r * Math.cos(t)).toFixed(2)},${(50 + r * Math.sin(t)).toFixed(2)}`);
    }
    const dots = [[30, 30], [70, 30], [30, 70], [70, 70], [50, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2"/>`).join("");
    svg.innerHTML = `<path d="M${pts.join("L")}"/>${dots}`;
    svg.style.setProperty("--len", Math.ceil(svg.querySelector("path").getTotalLength()));
  }

  /* ---------- Page transitions ----------
     A panel sweeps up with the destination's name and a kolam being drawn,
     then sweeps away on the next page. Stands in for the reference's transition films. */
  const veil = document.createElement("div");
  veil.className = "veil";
  veil.setAttribute("aria-hidden", "true");
  veil.innerHTML = `<div class="veil-inner"><svg class="kolam" viewBox="0 0 100 100"></svg><span class="veil-label"></span></div>`;
  document.body.appendChild(veil);
  drawKolam(veil.querySelector("svg"));

  const pageName = (url) => {
    const f = url.pathname.split("/").pop() || "index.html";
    if (f.startsWith("side")) return "Side projects";
    if (f.startsWith("about")) return "About";
    if (f.startsWith("projects")) return "Projects";
    if (f.startsWith("project")) {
      const p = S.projects.find((x) => x.slug === url.searchParams.get("p"));
      return p ? p.title : "Project";
    }
    return S.name;
  };

  try {
    const from = sessionStorage.getItem("veil");
    if (from && !reduceMotion) {
      veil.querySelector(".veil-label").textContent = from;
      veil.classList.add("is-covering", "no-anim");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          veil.classList.remove("no-anim");
          veil.classList.replace("is-covering", "is-leaving");
        })
      );
    }
    sessionStorage.removeItem("veil");
  } catch (e) {}

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || reduceMotion || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    if (url.pathname === location.pathname && url.search === location.search) return; // in-page anchors just scroll
    e.preventDefault();
    const label = pageName(url);
    veil.querySelector(".veil-label").textContent = label;
    veil.classList.remove("is-leaving");
    veil.classList.add("is-covering");
    try { sessionStorage.setItem("veil", label); } catch (err) {}
    setTimeout(() => (location.href = url.href), 650);
  });
  // Coming back via the back button restores a covered page from cache; uncover it.
  addEventListener("pageshow", (e) => { if (e.persisted) veil.classList.remove("is-covering"); });

  /* ---------- Entrance ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add("is-ready")));
})();
