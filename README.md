# augen

Music visualizers on one site. The front page (`index.html`) holds a single audio source (upload, drop, or a library track) and a grid of visualizers; every visualizer opens with that track already loaded.

```
index.html              front page: source panel + visualizer grid
catalog.js              list of visualizers and bundled library tracks
shared/source.js        the shared track (IndexedDB, synced across tabs)
shared/hub.js           included by each visualizer: Home button, preload, keeps the source in sync
visualizers/<id>/       one folder per visualizer, index.html inside
audio/                  bundled tracks
```

## Run

Needs to be served over http (IndexedDB and fetch don't work from `file://`):

```bash
cd ~/Documents/Projects/augen && python3 -m http.server 8770
```

Then open http://localhost:8770.

## Adding a visualizer

1. Put the page at `visualizers/<id>/index.html`.
2. Give it a global `loadArrayBuffer(arrayBuffer, name, autoplay)`, a hidden `<input type="file" id="file">`, and a control bar at `.ui > .bar:last-child` (where the Home button goes).
3. Before `</body>`:
   ```html
   <script src="../../shared/source.js"></script>
   <script src="../../shared/hub.js"></script>
   ```
4. Add an entry to `visualizers` in `catalog.js` (`art` picks the card illustration in `index.html`; anything unknown gets a generic waveform).

`?src=path` on a visualizer URL still overrides the shared track.
