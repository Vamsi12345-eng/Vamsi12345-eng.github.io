# Portfolio site

## Deploy

1. Create a repo named exactly `Vamsi12345-eng.github.io`
2. Put `index.html` and the `img/` folder in the root
3. Push. Live at `https://vamsi12345-eng.github.io` in about a minute.

## Photos

The site looks for two files. Both are optional — if either is missing, a
generated circuit-trace pattern shows in its place and nothing breaks.

| File            | Where it appears        | Best size        |
|-----------------|-------------------------|------------------|
| `img/hero.jpg`  | Full-width top banner   | 2000 x 1200 px   |
| `img/bench.jpg` | Mid-page divider strip  | 2000 x 600 px    |

Keep each under ~400 KB so the page stays fast (squoosh.app will compress them).

**Use your own bench photos if you have them** — an RFSoC board, a scope trace,
a spectrum analyser screen. They beat stock every time and cost you nothing in
licensing. If you'd rather use stock, these are free for commercial use with no
attribution required:

- unsplash.com — search: circuit board macro, oscilloscope, electronics lab
- pexels.com — search: microchip, laboratory equipment
- pixabay.com — search: pcb, semiconductor

Photos are darkened by a navy overlay, so pick images with visible structure
rather than fine detail — the detail gets lost.

## The hero animation

`anim/` holds the 3D loop that plays behind the headline:
Code → Board → Silicon → Fabrication → Rocket → Transit → Settlement.

`index.html` loads `anim/hero.html`. That page pulls in `site-loop-3d.jsx`
(mounts it), `moon-3d.jsx` (the 3D scene), `animations-v3.jsx` (the timeline)
and `support.js` (the runtime). three.js comes from a CDN.

The 2D schematic version is still in the folder as `hero-2d.html` +
`site-loop.jsx` + `moon-loop.jsx`. To switch back, change the iframe `src`
near the bottom of `index.html` from `anim/hero.html` to `anim/hero-2d.html`.
Commit the whole folder either way.

Two things worth knowing:

**It won't run from a double-clicked file.** The runtime fetches the `.jsx`
files, which browsers block over `file://`. To preview locally, open a terminal
in this folder and run `python -m http.server`, then visit
`http://localhost:8000`. On GitHub Pages it works normally.

**Mobile.** The runtime pulls React, a JSX compiler and three.js from CDNs —
roughly 3 MB before the first frame draws, plus real GPU work. It runs on all
screen sizes by default (`MIN_WIDTH = 0` in the script at the bottom of
`index.html`). Set that to `700` to skip phones and show the photo/pattern hero
instead. Reduced-motion and data-saver requests are always honoured, whatever
`MIN_WIDTH` says.

To retune it, edit `SITE_TWEAKS` at the top of `anim/site-loop-3d.jsx` —
camera lead, exposure, and the vignette toggle. The original files also
shipped an editor panel with sliders; that's removed from the site version so
visitors don't see authoring controls.

## Editing

Everything is in `index.html`. HTML comments mark each section.
Search for `REPO-NAME` to find the three placeholder slots.
