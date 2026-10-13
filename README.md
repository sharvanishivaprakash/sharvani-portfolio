# Sharvani — portfolio

A static site (HTML, CSS, vanilla JS). No build step.

## Run locally
```
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Editing content
Everything you'll want to change lives in `js/content.js`:
- `projects` — main design projects (each gets a page at `project.html?p=<slug>`)
- `sideProjects` — experiments and smaller work
- `about` — intro, interests, experience

Text in `[square brackets]` is placeholder. For images, put files in `assets/` and set `cover`, `images`, `image` or `portrait` to their paths (for example `"assets/project-one/cover.jpg"`). Empty image slots show a labelled placeholder.

## Structure
- `index.html` — home: your name centred, companies, about line, contact
- `projects.html` — grid of main projects
- `side-projects.html`, `about.html`, `project.html`
- `css/style.css` — design tokens at the top, then components
- `js/main.js` — renders pages from content, preview and hero interactions
- `js/cursor.js` — custom cursor (desktop only; touch devices keep the normal behaviour)

## Publishing
Settings → Pages → deploy from the `main` branch, root folder.
