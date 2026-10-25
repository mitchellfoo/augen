// Everything the front page lists. Add a visualizer by dropping its page at
// visualizers/<id>/index.html and adding one entry here.
window.AUGEN = {
  visualizers: [
    {
      id: 'synchromy',
      title: 'Synchromy Machine',
      blurb: 'After Norman McLaren\'s Synchromy: the song drawn as optical-soundtrack marks, stacked in coloured film columns.',
      tags: ['2D', 'film', 'mic'],
      accent: '#f6cf1d',
      art: 'synchromy',
    },
    {
      id: 'sculpture',
      title: 'Sculpture Machine',
      blurb: 'A floating sculpture on a turntable. Drums build it up, notes carve it away, raymarched in cut paper, clay or ink.',
      tags: ['3D', 'WebGL2', 'raymarched'],
      accent: '#e8553a',
      art: 'sculpture',
    },
    {
      id: 'massing',
      title: 'Massing Machine',
      blurb: 'A building drawn as an architect\'s axo: flat pink walls, tan roofs, cut slabs and dotted hidden lines. A static model for now; the song comes next.',
      tags: ['3D', 'axo', 'booleans'],
      accent: '#e2b2d2',
      art: 'massing',
    },
  ],
  // Tracks bundled in audio/, offered alongside upload.
  library: [
    { file: 'audio/after_meaning.m4a', name: 'After Meaning' },
  ],
};
