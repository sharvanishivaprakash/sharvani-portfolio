# Sharvani SP — portfolio

A static site (HTML, CSS, vanilla JS). No build step, no dependencies.

## Run locally
```
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Editing content
The homepage is built from the Figma frame "Portfolio final 1" (page 2 of the Sharvani SP portfolio file).
- Homepage copy (hero, statement, about card, design approach, what next) is written in `index.html`.
- `js/content.js` holds the selected works (title, summary, tags, cover image, case study details), the email and links.
  The Resume button uses the `[Resume]` link there; until it's set, it shows "coming soon".
- Images exported from Figma live in `assets/final/`.

Text in `[square brackets]` is placeholder. Projects without an `image` show a plain pale panel, as in the design.

## Structure
- `index.html`: the homepage. On desktop each block sits at its Figma position (`--x`, `--y`, `--w` in Figma pixels)
  and the whole page scales with the window. Under 900px wide the same content stacks for tablets and phones.
- `project.html`: case study template (`project.html?p=<slug>`)
- `css/style.css`: colours and fonts at the top in `:root` (`--blue` is the accent), then sections
- `js/main.js`: renders the selected works and case studies from `content.js`
- `js/cursor.js`: the eye cursor (desktop only). It turns blue over anything clickable and over the nav bar.
- `js/ascii-bg.js`: the moving ASCII field behind the hero and the "I connect the dots" statement.
  Characters swell and turn blue near the cursor, and a click sends out a ring. It stays still for visitors who ask for reduced motion.

## Publishing
Settings → Pages → deploy from the `main` branch, root folder.
