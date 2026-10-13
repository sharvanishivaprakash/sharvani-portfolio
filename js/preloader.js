/*
  Name intro shown before the homepage hero.
  "shar" stays still; the sage word rolls upward through a clipped window:
    shar ...  →  shar who  →  shar vani
  then the whole line rolls up to "hey, it's sharvani" in sage,
  the words lift away, the page fades in and the hero reveals (main.js listens for "preloader:done").
  Whether it plays is decided by the small inline script in index.html's <head>.
  Reduced motion: a short still "hey, it's sharvani", then the homepage.
*/
(function () {
  const root = document.documentElement;
  const el = document.getElementById("preloader");
  if (!el || !root.classList.contains("is-preloading")) { if (el) el.remove(); return; }

  const line = el.querySelector(".pl-line");
  const stack = el.querySelector(".pl-stack");
  const reel = el.querySelector(".pl-reel");
  const blur = document.getElementById("pl-round-blur");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(0.76, 0, 0.24, 1)";
  const STEP = 1.25; // em, matches --pl-lh in css/style.css

  // Timing in ms
  const FIRST_HOLD = 450; // shar ...
  const ROLL = 400;       // each roll
  const HOLD_WHO = 350;
  const HOLD_VANI = 450;
  const HOLD_GREET = 800; // hey, it's sharvani
  const EXIT = 320;       // page fade after the words have gone

  const timers = [];
  const anims = [];
  let finished = false;

  // Keep each line on one row: shrink the type only if the longest line would not fit.
  function fit() {
    line.style.fontSize = "";
    const room = el.clientWidth - 32;
    const w = Math.max(...[...stack.children].map((row) => row.scrollWidth));
    let fs = parseFloat(getComputedStyle(line).fontSize);
    if (w > room) { fs *= room / w; line.style.fontSize = fs + "px"; }
    if (blur) blur.setAttribute("stdDeviation", Math.max(0.6, fs * 0.014).toFixed(2)); // same rounding as the hero
  }

  // Exit: the words lift away first, then the page fades in and the hero fades up,
  // so the intro and the hero name are never on screen together.
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
      stack.style.transform = `translateY(${-STEP}em)`; // still "hey, it's sharvani"
      timers.push(setTimeout(finish, 1000));
      return;
    }

    const y = (n) => `translateY(${-n * STEP}em)`;
    const reelEnd = FIRST_HOLD + ROLL + HOLD_WHO + ROLL; // reel settles on "vani"
    const total = reelEnd + HOLD_VANI + ROLL + HOLD_GREET;
    const at = (t) => t / total;

    // The green word: ... → who → vani, each roll eased, each hold still.
    const words = reel.animate([
      { transform: y(0), offset: 0 },
      { transform: y(0), offset: at(FIRST_HOLD), easing: EASE },
      { transform: y(1), offset: at(FIRST_HOLD + ROLL) },
      { transform: y(1), offset: at(FIRST_HOLD + ROLL + HOLD_WHO), easing: EASE },
      { transform: y(2), offset: at(reelEnd) },
      { transform: y(2), offset: 1 },
    ], { duration: total, fill: "forwards" });

    // The whole line: "shar vani" rolls up and "hey, it's sharvani" rolls in.
    const lineRoll = stack.animate([
      { transform: y(0), offset: 0 },
      { transform: y(0), offset: at(reelEnd + HOLD_VANI), easing: EASE },
      { transform: y(1), offset: at(reelEnd + HOLD_VANI + ROLL) },
      { transform: y(1), offset: 1 },
    ], { duration: total, fill: "forwards" });

    anims.push(words, lineRoll);
    lineRoll.onfinish = finish;
    timers.push(setTimeout(finish, total + 1000)); // never leave the visitor on a blank screen
  }

  // Start once the lettering font is in (no swap mid-roll), but never wait long for it.
  let started = false;
  const start = () => { if (!started) { started = true; play(); } };
  timers.push(setTimeout(start, 800));
  if (document.fonts && document.fonts.load) {
    document.fonts.load('700 1em "Pixelify Sans"', "sharvni.who,’ yeit").then(start, start);
  } else start();
})();
