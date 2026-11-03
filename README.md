# augen

Music visualizers on one site. The front page (`index.html`) holds a single audio source (upload, drop, or a library track) and a grid of visualizers; every visualizer opens with that track already loaded.

```
index.html              front page: source panel + visualizer grid
catalog.js              list of visualizers and bundled library tracks
shared/source.js        the shared track (IndexedDB, synced across tabs)
shared/hub.js           included by each visualizer: Home button, preload, keeps the source in sync
shared/export.js        streams MP4 exports to serve.py
serve.py                local server: the site, plus exports written into exports/
visualizers/<id>/       one folder per visualizer, index.html inside
audio/                  bundled tracks
```

## Run

```bash
cd ~/Documents/Projects/augen && python3 serve.py
```

Then open http://localhost:8770. `serve.py` serves the site like `python3 -m http.server` (which also still works) and adds one thing: MP4 exports stream into `exports/` as they render, so memory stays flat at any length or size in any browser. In Chrome or Edge the save dialog comes first and wins if you pick a file; under any other server, exports download at the end instead.

## Adding a visualizer

1. Put the page at `visualizers/<id>/index.html`.
2. Give it a global `loadArrayBuffer(arrayBuffer, name, autoplay)`, a hidden `<input type="file" id="file">`, and a control bar at `.ui > .bar:last-child` (where the Home button goes).
3. Before `</body>`:
   ```html
   <script src="../../shared/export.js"></script>
   <script src="../../shared/source.js"></script>
   <script src="../../shared/hub.js"></script>
   ```
4. Add an entry to `visualizers` in `catalog.js` (`art` picks the card illustration in `index.html`; anything unknown gets a generic waveform).

`?src=path` on a visualizer URL still overrides the shared track.
