// Exports through serve.py: the video goes to the local server in pieces while it renders and is written straight
// into augen/exports/, so memory stays flat at any length or size, in any browser. Under any other server (plain
// http.server, a static host) open() finds no endpoint and returns null, and the visualizer downloads instead.
// A sink has the shape the muxer's StreamTarget writes to: write(data, pos), plus pending/error for the render loop
// to wait on and close()/abort() at the end.
window.AugenExport = {
  async open(name) {
    let id, file;
    try {
      const r = await fetch(`/__augen/export?name=${encodeURIComponent(name)}`, { method:'POST' });
      if (!r.ok) return null;
      ({ id, file } = await r.json());
    } catch (e) { return null; }
    const url = `/__augen/export/${id}`;
    let chain = Promise.resolve();
    const sink = {
      file, pending:0, error:null,
      write(data, pos) {
        const body = data.slice();   // the muxer's buffer is not ours to keep
        sink.pending += body.byteLength;
        chain = chain.then(async () => {
          if (sink.error) return;
          try { const r = await fetch(`${url}?pos=${pos}`, { method:'PUT', body }); if (!r.ok) throw new Error(`server said ${r.status}`); }
          catch (e) { sink.error = new Error('could not write to serve.py: ' + e.message); }
          finally { sink.pending -= body.byteLength; }
        });
      },
      async close() {
        await chain; if (sink.error) throw sink.error;
        const r = await fetch(`${url}/done`, { method:'POST' }); if (!r.ok) throw new Error('serve.py could not finish the file');
        return (await r.json()).file;
      },
      async abort() { await chain; try { await fetch(`${url}/abort`, { method:'POST' }); } catch (e) {} },
    };
    return sink;
  },
};
