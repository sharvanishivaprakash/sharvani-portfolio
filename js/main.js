/* Renders pages from window.SITE (js/content.js) and wires up small interactions. */
(function () {
  const S = window.SITE;
  const page = document.body.dataset.page;
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Placeholder art, or the real image once `src` is set in content.js.
  function art(src, tone, label, alt) {
    if (src) return `<img class="cover-img" src="${esc(src)}" alt="${esc(alt || "")}" loading="lazy">`;
    return `<div class="ph tone-${esc(tone || "indigo")}" role="img" aria-label="Placeholder image"><span>${esc(label)}</span></div>`;
  }

  /* ---------- Footer (shared) ---------- */
  const footer = $("#footer");
  if (footer) {
    footer.innerHTML = `
      <div class="wrap">
        <p class="footer-hello">Have an idea, a project or a question?<br><a href="mailto:${esc(S.email)}">Say hello.</a></p>
        <div class="footer-meta">
          <ul>${S.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("")}</ul>
          <span>© ${new Date().getFullYear()} ${esc(S.name)}</span>
        </div>
      </div>`;
  }

  /* ---------- Home ---------- */
  if (page === "home") {
    $("#intro").textContent = S.intro;

    $("#project-list").innerHTML = S.projects
      .map(
        (p) => `
        <li class="project-row">
          <a href="project.html?p=${encodeURIComponent(p.slug)}" data-cursor="view" data-preview="${esc(p.slug)}">
            <span class="title">${esc(p.title)}</span>
            <span class="thumb">${art(p.cover, p.tone, "Cover image", p.title)}</span>
            <p class="summary">${esc(p.summary)}</p>
            <span class="meta"><span>${esc(p.discipline)}</span><span>${esc(p.year)}</span></span>
          </a>
        </li>`
      )
      .join("");

    $("#home-side").innerHTML = S.sideProjects
      .slice(0, 4)
      .map((sp) => sideCard(sp))
      .join("");

    projectPreview();
    heroDots();
  }

  /* ---------- Side projects ---------- */
  if (page === "side") {
    $("#side-grid").innerHTML = S.sideProjects.map((sp) => sideCard(sp)).join("");
  }

  function sideCard(sp) {
    const external = /^https?:/.test(sp.href);
    return `
      <a class="side-card" href="${esc(sp.href)}" data-cursor="view" data-cursor-label="${external ? "Open" : "View"}"${
        external ? ' target="_blank" rel="noopener"' : ""
      }>
        <div class="art">${art(sp.image, sp.tone, "Image", sp.title)}</div>
        <h3>${esc(sp.title)}</h3>
        <div class="kind"><span>${esc(sp.kind)}</span><span>${esc(sp.year)}</span></div>
        <p>${esc(sp.note)}</p>
      </a>`;
  }

  /* ---------- Project detail ---------- */
  if (page === "project") {
    const slug = new URLSearchParams(location.search).get("p");
    const i = Math.max(0, S.projects.findIndex((p) => p.slug === slug));
    const p = S.projects[i];
    const next = S.projects[(i + 1) % S.projects.length];
    document.title = `${p.title} · ${S.name}`;

    $("#project").innerHTML = `
      <section class="project-hero">
        <h1 class="project-title reveal">${esc(p.title)}</h1>
        <ul class="tags reveal" style="--i:1">${(p.tags || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <p class="project-started reveal" style="--i:2">Started this project in ${esc(p.year)}</p>
        <div class="project-cover reveal" style="--i:3">${art(p.cover, p.tone, "Hero image 16:9", p.title)}</div>
      </section>
      <section class="overview">
        <h2>Overview</h2>
        <div>
          <p class="project-summary">${esc(p.summary)}</p>
          <dl class="facts">
            <div><dt>Year</dt><dd>${esc(p.year)}</dd></div>
            <div><dt>Discipline</dt><dd>${esc(p.discipline)}</dd></div>
            <div><dt>Role</dt><dd>${esc(p.role)}</dd></div>
            <div><dt>Duration</dt><dd>${esc(p.duration)}</dd></div>
            <div><dt>Team</dt><dd>${esc(p.team)}</dd></div>
          </dl>
          <div class="project-actions">
            ${p.link ? `<a class="pill pill-solid" href="${esc(p.link)}" target="_blank" rel="noopener"><span class="dot"></span>Visit project</a>` : ""}
            <a class="pill" href="index.html#work">Back to projects</a>
          </div>
        </div>
      </section>
      <div class="story">
        ${p.sections
          .map(
            (s, k) => `
          <section class="story-block">
            <h2>${esc(s.heading)}</h2>
            <div><p>${esc(s.body)}</p></div>
          </section>
          ${p.images[k] !== undefined ? `<div class="story-img">${art(p.images[k], p.tone, "Process image", p.title)}</div>` : ""}`
          )
          .join("")}
      </div>
      <a class="next-project" href="project.html?p=${encodeURIComponent(next.slug)}" data-cursor="view" data-cursor-label="Next">
        <div>
          <small>Next project</small>
          <span class="title">${esc(next.title)}</span>
        </div>
        <div class="next-thumb">${art(next.cover, next.tone, "Cover image", next.title)}</div>
      </a>`;
  }

  /* ---------- About ---------- */
  if (page === "about") {
    const a = S.about;
    $("#portrait").innerHTML = art(a.portrait, "kumkum", "Portrait photo", `Portrait of ${S.name}`);
    $("#about-body").innerHTML = a.paragraphs.map((t, k) => `<p class="${k === 0 ? "about-lead" : ""}">${esc(t)}</p>`).join("");
    $("#interests").innerHTML = a.interests.map((t) => `<li>${esc(t)}</li>`).join("");
    $("#cv").innerHTML = a.experience
      .map((e) => `<li><span class="what">${esc(e.what)}</span><span class="where">${esc(e.where)}</span><span class="when">${esc(e.when)}</span></li>`)
      .join("");
    $("#about-email").href = `mailto:${S.email}`;
  }

  /* ---------- Kolam: a looping line drawn around a grid of dots ---------- */
  document.querySelectorAll("svg.kolam").forEach(drawKolam);
  function drawKolam(svg) {
    // Four-petal rose curve (r = cos 2θ) weaving between four dots, like a simple pulli kolam.
    const pts = [];
    for (let t = 0; t <= Math.PI * 2 + 0.001; t += Math.PI / 90) {
      const r = 44 * Math.cos(2 * t);
      pts.push(`${(50 + r * Math.cos(t)).toFixed(2)},${(50 + r * Math.sin(t)).toFixed(2)}`);
    }
    const dots = [[30, 30], [70, 30], [30, 70], [70, 70], [50, 50]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2"/>`)
      .join("");
    svg.innerHTML = `<path d="M${pts.join("L")}"/>${dots}`;
    const path = svg.querySelector("path");
    svg.style.setProperty("--len", Math.ceil(path.getTotalLength()));
  }

  /* ---------- Hide header on scroll down, show on scroll up ---------- */
  const header = $(".site-header");
  let lastY = scrollY;
  addEventListener(
    "scroll",
    () => {
      const y = scrollY;
      header.classList.toggle("is-hidden", y > lastY && y > 200);
      lastY = y;
    },
    { passive: true }
  );

  /* ---------- Floating project preview on desktop ---------- */
  function projectPreview() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const box = document.createElement("div");
    box.className = "preview";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML = S.projects
      .map((p) => `<div data-slug="${esc(p.slug)}" style="opacity:0">${art(p.cover, p.tone, "Cover image", "")}</div>`)
      .join("");
    document.body.appendChild(box);

    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, raf = null;
    const loop = () => {
      cx += (x - cx) * (reduceMotion ? 1 : 0.12);
      cy += (y - cy) * (reduceMotion ? 1 : 0.12);
      const tilt = Math.max(-6, Math.min(6, (x - cx) * 0.05));
      box.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) rotate(${tilt}deg) scale(${box.classList.contains("is-on") ? 1 : 0.85})`;
      raf = requestAnimationFrame(loop);
    };

    document.querySelectorAll("[data-preview]").forEach((a) => {
      a.addEventListener("mouseenter", () => {
        box.querySelectorAll("[data-slug]").forEach((el) => (el.style.opacity = el.dataset.slug === a.dataset.preview ? 1 : 0));
        box.classList.add("is-on");
        if (!raf) loop();
      });
      a.addEventListener("mouseleave", () => box.classList.remove("is-on"));
    });
    addEventListener("mousemove", (e) => { x = e.clientX + 40; y = e.clientY; }, { passive: true });
  }

  /* ---------- Hero dot grid that swells near the pointer ---------- */
  function heroDots() {
    const canvas = $(".hero-dots");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const gap = 26;
    let w, h, dpr, mx = -999, my = -999, active = false;

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let y = gap / 2; y < h; y += gap) {
        for (let x = gap / 2; x < w; x += gap) {
          const d = Math.hypot(x - mx, y - my);
          const k = Math.max(0, 1 - d / 160);
          ctx.beginPath();
          ctx.arc(x, y, 1.1 + k * 2.6, 0, Math.PI * 2);
          ctx.fillStyle = k > 0 ? `rgba(179, 54, 91, ${0.18 + k * 0.5})` : "rgba(35, 33, 58, 0.13)";
          ctx.fill();
        }
      }
    }

    const hero = canvas.parentElement;
    hero.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      if (!active) {
        active = true;
        requestAnimationFrame(() => { draw(); active = false; });
      }
    });
    hero.addEventListener("pointerleave", () => { mx = my = -999; draw(); });
    addEventListener("resize", resize);
    resize();
  }

  /* ---------- Coordinates pin in the header ---------- */
  const coords = $(".coords");
  if (coords) coords.textContent = S.coordinates;

  /* ---------- Page transitions ----------
     A panel sweeps up over the page with the destination's name and a kolam being drawn,
     then sweeps away on the next page. Plays the part of the reference's transition films. */
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
    if (f.startsWith("project")) {
      const p = S.projects.find((x) => x.slug === url.searchParams.get("p"));
      return p ? p.title : "Project";
    }
    return url.hash === "#work" ? "Projects" : "Home";
  };

  try {
    const from = sessionStorage.getItem("veil");
    if (from && !reduceMotion) {
      veil.querySelector(".veil-label").textContent = from;
      veil.classList.add("is-covering", "no-anim");
      requestAnimationFrame(() => requestAnimationFrame(() => {
        veil.classList.remove("no-anim");
        veil.classList.replace("is-covering", "is-leaving");
      }));
    }
    sessionStorage.removeItem("veil");
  } catch (e) {}

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || reduceMotion || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.protocol === "mailto:") return;
    const samePage = url.pathname === location.pathname && url.search === location.search;
    if (samePage) return; // in-page anchors just scroll
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
