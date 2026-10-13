# Sharvani SP — portfolio

A static site (HTML, CSS, vanilla JS). No build step, no dependencies.

## Run locally
```
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Editing content
Everything you'll want to change lives in `js/content.js`:
- `statement`, `email`, `links`, `coordinates`, `location`, `timezone`
- `projects`: the four case studies. Each opens at `project.html?p=<slug>`. `size: "large"` makes it a wide tile.
- `about.collage`: the polaroids. `caption` is the handwritten line, `note` shows on hover or tap.
- `playground`: add or remove items freely. `ratio` is width ÷ height; `href` makes it a link.

Text in `[square brackets]` is placeholder. For images, put files in `assets/` and set `image` to the path
(for example `"assets/andaaj/cover.jpg"`). Empty image slots show a labelled placeholder box.
The hero character lives in `assets/character/`. Its pupils are separate layers (`iris-*.png`, clipped by `eye-mask-*.png`) so they can follow the cursor; a new picture needs those layers redone.

## Structure
- `index.html`: one page with Work, About, Playground and Contact
- `project.html`: case study template
- `css/style.css`: colours, fonts and spacing at the top in `:root`, then sections
- `js/main.js`: renders everything from `content.js`
- `js/pixel-name.js`: the hero name that rasterises into "Interaction Designer"
- `js/character.js`: the character's eyes following the pointer
- `js/cursor.js`: the eye cursor (desktop only; touch keeps the normal behaviour)

## Publishing
Settings → Pages → deploy from the `main` branch, root folder.
