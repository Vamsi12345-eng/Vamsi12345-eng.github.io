# Portfolio site

## Deploy

1. Create a repo named exactly `Vamsi12345-eng.github.io`
2. Put `index.html` and the `img/` folder in the root
3. Push. Live at `https://vamsi12345-eng.github.io` in about a minute.

## Media

Everything lives in `img/`. All of it is optional — if a file is missing the
layer below it shows, and nothing breaks.

| File               | Where it appears       | Notes                        |
|--------------------|------------------------|------------------------------|
| `img/hero.mp4`     | Hero background loop   | keep under ~5 MB             |
| `img/hero-poster.jpg` | First frame, shown while the video loads | 1280 px wide |
| `img/hero.jpg`     | Fallback if no video   | optional                     |
| `img/bench.jpg`    | Mid-page divider strip | 2000 x 600 px                |

The fallback chain for the hero is: video → poster → `hero.jpg` → generated
circuit-trace pattern. You only need the first two.

### Making the poster frame

Grab a frame from the video itself so the transition is invisible:

```
ffmpeg -i hero.mp4 -ss 00:00:00 -frames:v 1 -q:v 3 hero-poster.jpg
```

### Re-compressing the video

```
ffmpeg -i input.mp4 -ss 00:00:05 -t 12 -vf "scale=1280:-2,fps=25" -c:v libx264 -crf 30 -preset slow -an -movflags +faststart hero.mp4
```

`-crf` is the quality dial: lower is better and bigger, higher is worse and
smaller. `-an` strips audio, which a muted background video never needs.
`+faststart` moves the index to the front of the file so playback can begin
before the whole thing has downloaded — don't drop that one.

### How the video is set up

The `<video>` tag carries `muted`, `playsinline`, `loop` and `autoplay`.
The first two are what make autoplay work at all: browsers block video with
sound, and iOS forces fullscreen without `playsinline`. The script at the
bottom of `index.html` handles the rest — fading in on the first frame,
falling back to the poster if a browser refuses autoplay, holding still for
visitors who've asked for reduced motion, and pausing in a background tab.

## Editing

Everything is in `index.html`. HTML comments mark each section.
Search for `REPO-NAME` to find the three placeholder slots.
