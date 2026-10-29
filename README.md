# Sharvani SP — portfolio

A static site (HTML, CSS, vanilla JS). No build step, no dependencies.

## Run locally
```
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Editing content
The homepage is built from the Figma frame "Portfolio final 1" (page 2 of the Sharvani SP portfolio file).
- Homepage copy (hero, statement, outside the briefs, about card, what next) is written in `index.html`.
- `js/content.js` holds the selected works (title, summary, tags, cover image, case study details), the email and links.
  The Resume button uses the `[Resume]` link there; until it's set, it shows "coming soon".
- Images exported from Figma live in `assets/final/`.
- The browser-tab icon is the blue doodle, the same mark shown next to SP in the nav (`assets/favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, made from `assets/final/logo.webp`).

Text in `[square brackets]` is placeholder. Projects without an `image` show a plain pale panel, as in the design.

## Structure
- `index.html`: the homepage. On desktop each block sits at its Figma position (`--x`, `--y`, `--w` in Figma pixels)
  and the whole page scales with the window. Under 900px wide the same content stacks for tablets and phones.
- `project.html`: case study template (`project.html?p=<slug>`)
- `css/style.css`: colours and fonts at the top in `:root` (`--blue` is the accent), then sections
- `js/main.js`: renders the selected works and case studies from `content.js`
- `js/cursor.js`: the eye cursor (desktop only). It turns blue over anything clickable and over the nav bar.
- `js/preloader.js`: the intro on the homepage. On black with moving dots, the doodle (without its glasses) looks left, then right,
  the glasses drop on, "sharvani" types in and the screen slides up. A click or key press skips it. It doesn't play for reduced motion
  or when you come back from another page of the site (the small script in the `<head>` of `index.html` decides).
- `js/dot-grid.js`: the softly moving dot grid behind the hero and the "I'm drawn to the little things" statement.
  The statement's lines appear one by one as you scroll to it (the `.s-line` spans in `index.html`).
  Dots near the cursor grow and turn blue. Everything holds still for visitors who ask for reduced motion.
- `js/sections.js`: as you scroll, the parts of Selected Works, Outside the briefs and What next ? rise in one after another,
  and sections you've scrolled past blur and dim a little so the one in view gets the attention.
- Work cards: the `hover` image in `js/content.js` fades in over the cover on hover (Andaaj has one; the others are `null` for now).
- `js/liquid-name.js`: the slow liquid wobble on the hero name (an SVG turbulence filter). It settles while you hover the name.
- `js/about-scroll.js`: the About me scroll story. The basket starts empty; as you scroll, the stickers drop in one by one
  (face first, the order is the `data-drop` number on each sticker in `index.html`) and the text on the blue card is uncovered alongside.
  On desktop the story starts as the face leaves the record, so "Hey, I'm Sharvani" and the other stickers come in with it,
  and the section is only pinned for a short stretch. Each sticker gives a very small bounce as it lands (`.cart-item.is-landed`).
  The stickers live in `assets/final/about/`.
  Once the basket is full, visitors can pick the stickers up and drop them anywhere (the eye cursor says "Drag").
- `js/outside.js`: Outside the briefs. The blue record turns (CSS) while its stickers stay still. Pointing at a sticker makes the
  note under the record blink; clicking it brings in the paper card with the same name on the left (only where the sticker is
  actually drawn counts), and clicking again, clicking elsewhere or Escape puts it away. Clicking the face scrolls to About me. The fish card plays a YouTube video in its blue frame
  (`data-youtube` in index.html) and the folk card an animated logo (`folk-ns-studio.webp`, from Alex's GIF).
- The dot grid (`js/dot-grid.js`) runs behind every `.dots-zone`: hero + statement, and Outside the briefs + About me.
- On desktop the face sticker on the record flies down into the About basket as you scroll (`js/about-scroll.js`).
  On touch screens a tap shows the card under the record. Images are in `assets/final/outside/`
  (`sticker-<name>.webp` goes with `card-<name>.webp`; replace a card file in place to update it).
- `js/falling-tabs.js`: in "What next ?", the pill tabs drop in one after another and land in a pile along the bottom,
  once, when the section comes into view. The tab labels are the `<span>`s inside `.tab-pile` in `index.html`. Once they have landed, hovering a tab pushes it aside (it springs back once the pointer has moved off its spot), and pressing and dragging moves it anywhere in the section.
- The big faint doodle at the bottom right of "What next ?" is `assets/doodle/doodle.svg` (the vector doodle from Figma), shown dark blue (`.next-doodle`). It floats gently up and down (CSS animation, off for reduced motion).
- The Gmail, LinkedIn and Instagram links in "What next ?" use `email` and the LinkedIn / Instagram links in `js/content.js`.
  Until they're filled in, clicking one shows "coming soon".

## Publishing
Settings → Pages → deploy from the `main` branch, root folder.
The CSS and JS links in `index.html` and `project.html` end in `?v=<number>`. Bump that number whenever the CSS or JS changes,
so visitors' browsers load the new files instead of an old cached copy.
