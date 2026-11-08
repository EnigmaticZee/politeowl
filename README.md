# politeowl.com

Useful things, made with care. Plain static site, no build step.

## Files
- `index.html` — home: the owl on its moon, the app shelf with filters,
  "Sure, you could build it yourself", the polite promise, and the night-sky footer
- `assets/home.css`, `assets/home.js` — styling and behaviour for the home page
  (app-icon physics uses matter-js 0.19.0 from cdnjs)
- `apps/*.html` — one page per app
- `assets/styles.css`, `assets/app.js` — styling for the app pages and the 404 page
- `404.html` — not-found page (uses absolute `/` paths, so it expects the site at a domain root)
- `brand/logo/`, `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` — logo files

## Before launch
Search the app pages for `[` to find every placeholder: download/buy links, prices,
platform versions, version numbers, screenshots. Also confirm the three "polite promise"
lines are true for every app.

## Adding an app
In `index.html`, copy a `<li class="card" ...>` on the shelf and set `data-price`
(free/paid) and `data-cat` (tidy/files/everyday). Add a matching toy in the hero's
`#toys` list, then copy an `apps/*.html` page.

## Running it locally
```bash
python3 -m http.server 4321
```
Then open http://localhost:4321.
