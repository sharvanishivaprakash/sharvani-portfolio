/*
  The hero name: every letter of "SHARVANi *" is set in a different font (as in Figma),
  and the letters keep swapping to another font one after the other, left to right,
  like the frames of a hand-made GIF. Each swap also gives the letter a small random tilt.
  Every letter keeps the width it has in its Figma font, so the name doesn't jump about.
  Visitors who ask for reduced motion see the Figma fonts, standing still.
*/
(function () {
  const letters = [...document.querySelectorAll(".hero-name .nl")];
  if (!letters.length) return;
  const FONTS = ["f-peralta", "f-kranky", "f-silk", "f-mountains", "f-pacifico", "f-pangolin", "f-playwrite", "f-rainbow"];
  const START = [0, 1, 2, 3, 4, 2, 5, 6, 7];   // the Figma font of each letter (an index into FONTS)
  const FRAME = 110;                           // ms between two swaps, about 9 frames a second
  const font = START.slice();

  const set = (el, k) => { el.classList.remove(...FONTS); el.classList.add(FONTS[k]); };
  letters.forEach((el, i) => set(el, font[i]));
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // lock each letter's width to its Figma font once the fonts are in
  const lock = () => letters.forEach((el) => { el.style.width = ""; el.style.width = el.getBoundingClientRect().width + "px"; });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    letters.forEach((el, i) => set(el, START[i]));
    lock();
    addEventListener("resize", () => { letters.forEach((el, i) => set(el, START[i])); lock(); letters.forEach((el, i) => set(el, font[i])); });
    run();
  });

  let i = 0, last = 0;
  function run() {
    requestAnimationFrame(function frame(t) {
      if (t - last >= FRAME && !document.hidden) {
        last = t;
        const el = letters[i];
        // a new font for this letter, never the one it had or the one of the letter next to it
        let k;
        do k = Math.floor(Math.random() * FONTS.length);
        while (k === font[i] || k === font[i - 1] || k === font[i + 1]);
        font[i] = k;
        set(el, k);
        el.style.transform = `rotate(${(Math.random() * 8 - 4).toFixed(1)}deg)`;
        i = (i + 1) % letters.length;
      }
      requestAnimationFrame(frame);
    });
  }
})();
