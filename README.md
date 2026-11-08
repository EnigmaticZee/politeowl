# politeowl.com

Useful things, made with care. Plain static site, no build step.

## Files
- `index.html` — home: the owl on its moon, the shelf (filtered by apps, games, extensions, books),
  "Sure, you could build it yourself", the polite promise, and the night-sky footer
- `assets/home.css`, `assets/home.js` — styling and behaviour for the home page
  (app-icon physics uses matter-js 0.19.0 from cdnjs)
- `apps/*.html` — one page per app
- `assets/app-page.css` — the app pages and the 404 page; `assets/theme.css` — light and dark themes
- `404.html` — not-found page (uses absolute `/` paths, so it expects the site at a domain root)
- `brand/logo/`, `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` — logo files

## Keeping it accurate
Prices, platforms and versions live in each `apps/*.html` page (the buy panel, the bottom buy bar
and the details strip) and on the cards on the home page shelf and in "More from Polite Owl".
When something changes, update them all. Also confirm the three "polite promise" lines stay true
for every app.

## Checkout
Until an app's checkout is ready, its page shows a greyed-out "Buying opens soon" button in the buy
panel. To open buying, swap that `<button class="btn btn-soon" disabled>` for a link to the checkout,
`<a class="btn btn-primary magnetic" href="CHECKOUT-LINK"><span>Buy NAME</span>…</a>`, and add the
bottom buy bar (`<div class="buybar" id="buybar">`, see `apps/dupetabs.html`) with its Buy link to the
same checkout.

## Adding an app
In `index.html`, copy a `<li class="card" ...>` on the shelf and set `data-price`
(paid, or soon for things without a price yet) and `data-cat` to what it is: apps, games,
extensions or books. Its label under the name says where it runs ("Mac app", "Chrome extension").
The filter chips list only kinds that have something in them, and the whole row stays hidden while
there is just one kind. Update the chips and the count when you add the first thing of a new kind. Add a matching toy in the hero's
`#toys` list, put its icon in `assets/icons/` (256px and 512px), then copy an
`apps/*.html` page and update its details and "More from Polite Owl" cards.

## Running it locally
```bash
python3 -m http.server 4321
```
Then open http://localhost:4321.
