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

## Keeping it accurate
Prices, platforms and versions live in each `apps/*.html` page (the details strip) and in the
badges on the home page shelf. When something changes, update both. Also confirm the three
"polite promise" lines stay true for every app.

## Adding an app
In `index.html`, copy a `<li class="card" ...>` on the shelf and set `data-price`
(paid, or soon for apps without a price yet) and `data-cat` (tidy/files/everyday). Add a matching toy in the hero's
`#toys` list, put its icon in `assets/icons/` (256px and 512px), then copy an
`apps/*.html` page and update its details and "More from Polite Owl" cards.

## Running it locally
```bash
python3 -m http.server 4321
```
Then open http://localhost:4321.
