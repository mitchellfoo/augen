// Joins a visualizer to the augen site: a Home button in its control bar, the shared track
// preloaded on open, and any file dropped or loaded here becomes the shared track.
// A visualizer only needs a global loadArrayBuffer(arrayBuffer, name, autoplay) and a #file input.
(async () => {
  const bar = document.querySelector('.ui > .bar:last-child');
  if (bar) {
    const home = document.createElement('button');
    home.textContent = '← augen'; home.title = 'Back to all visualizers';
    home.onclick = () => { location.href = '../../'; };
    bar.prepend(home);
  }

  const remember = f => { if (f) AugenSource.set(f, f.name); };
  addEventListener('drop', e => remember(e.dataTransfer.files[0]));
  const input = document.getElementById('file');
  if (input) input.addEventListener('change', () => remember(input.files[0]));

  if (new URLSearchParams(location.search).has('src') || typeof loadArrayBuffer !== 'function') return;
  const s = await AugenSource.get();
  if (s) loadArrayBuffer(await s.blob.arrayBuffer(), s.name, false);
})();
