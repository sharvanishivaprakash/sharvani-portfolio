/*
  Name intro shown before the homepage hero.
  "shar" stays still; the sage word rolls upward through a clipped window:
    ...  →  who  →  vani  →  hey, it's  →  vani
  then the white screen fades away and the hero reveals (main.js listens for "preloader:done").
  Whether it plays is decided by the small inline script in index.html's <head>.
  Reduced motion: a short still "shar vani", then the homepage.
*/
(function () {
  const root = document.documentElement;
  const el = document.getElementById("preloader");
  if (!el || !root.classList.contains("is-preloading")) { if (el) el.remove(); return; }

  const line = el.querySelector(".pl-line");
  const reel = el.querySelector(".pl-reel");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(0.76, 0, 0.24, 1)";
  const STEP = 1.2; // em, matches --pl-lh in css/style.css

  // Timing in ms: hold on "...", then [roll, hold] for each next word. Last hold is the name reveal.
  const FIRST_HOLD = 400;
  const ROLL = 400;
  const HOLDS = [300, 350, 400, 450]; // who, vani, hey it's, vani
  const EXIT = 320; // white fade after the words have gone

  const timers = [];
  const anims = [];
  let finished = false;

  // Centre the line on its resting state, "shar vani", so the name lands in the middle of the screen;
  // the window still keeps room for "hey, it's" to its right. Shrink the type only if that would not fit.
  function fit() {
    line.style.fontSize = "";
    line.style.marginRight = "";
    const range = document.createRange();
    range.selectNodeContents(reel.children[2]);
    const name = range.getBoundingClientRect().right - line.getBoundingClientRect().left; // "shar vani"
    const full = line.scrollWidth; // "shar" + space + window wide enough for "hey, it's"
    const room = el.clientWidth - 32;
    const need = 2 * full - name;
    const scale = need > room ? room / need : 1;
    if (scale < 1) line.style.fontSize = parseFloat(getComputedStyle(line).fontSize) * scale + "px";
    line.style.marginRight = -(full - name) * scale + "px";
  }

  // Exit: the words lift away first, then the white lifts and the hero fades up,
  // so the intro name and the hero name are never on screen together.
  function finish() {
    if (finished) return;
    finished = true;
    const words = line.animate(
      [{ opacity: 1, transform: "none" }, { opacity: 0, transform: reduce ? "none" : "translateY(-0.1em)" }],
      { duration: reduce ? 150 : 280, easing: "cubic-bezier(0.5, 0, 0.75, 0)", fill: "forwards" }
    );
    anims.push(words);
    words.onfinish = () => {
      done(); // main.js adds .is-loaded: the hero's own fade-up
      const out = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce ? 150 : EXIT, easing: "ease", fill: "forwards" });
      anims.push(out);
      out.onfinish = cleanup;
    };
    timers.push(setTimeout(cleanup, 280 + EXIT + 300)); // in case an animation never reports back
  }

  let announced = false;
  function done() {
    if (!announced) { announced = true; dispatchEvent(new Event("preloader:done")); }
  }

  function cleanup() {
    done();
    timers.forEach(clearTimeout);
    anims.forEach((a) => a.cancel());
    removeEventListener("resize", fit);
    root.classList.remove("is-preloading");
    el.remove();
  }

  function play() {
    fit();
    addEventListener("resize", fit);
    el.classList.add("is-ready");

    if (reduce) {
      reel.style.transform = `translateY(${-2 * STEP}em)`; // still "shar vani"
      timers.push(setTimeout(finish, 900));
      return;
    }

    // One continuous timeline: each roll eases, each hold sits still.
    const total = FIRST_HOLD + HOLDS.length * ROLL + HOLDS.reduce((a, b) => a + b, 0);
    const frames = [{ transform: "translateY(0em)", offset: 0 }];
    let t = FIRST_HOLD;
    HOLDS.forEach((hold, i) => {
      frames.push({ transform: `translateY(${-i * STEP}em)`, offset: t / total, easing: EASE });
      t += ROLL;
      frames.push({ transform: `translateY(${-(i + 1) * STEP}em)`, offset: t / total });
      t += hold;
    });
    frames.push({ transform: `translateY(${-HOLDS.length * STEP}em)`, offset: 1 });

    const roll = reel.animate(frames, { duration: total, fill: "forwards" });
    anims.push(roll);
    roll.onfinish = finish;
    timers.push(setTimeout(finish, total + 1000)); // never leave the visitor on a white screen
  }

  // Start once the display font is in (no swap mid-roll), but never wait long for it.
  let started = false;
  const start = () => { if (!started) { started = true; play(); } };
  timers.push(setTimeout(start, 800));
  if (document.fonts && document.fonts.load) {
    document.fonts.load('600 1em "Outfit"', "sharvni.who,’ ").then(start, start);
  } else start();
})();
