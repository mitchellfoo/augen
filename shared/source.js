// The one audio source every augen page shares. The front page picks a track, each visualizer
// reads it. Kept in IndexedDB so it survives navigation and reloads (same origin only).
window.AugenSource = (() => {
  const DB = 'augen', STORE = 'source', KEY = 'current';
  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const tx = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(STORE, mode), req = fn(t.objectStore(STORE));
      t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error);
    });
  };
  const listeners = new Set();
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('augen-source') : null;
  const emit = s => { listeners.forEach(f => f(s)); };
  if (bc) bc.onmessage = async () => emit(await get());

  async function get() { try { return (await tx('readonly', s => s.get(KEY))) || null; } catch (e) { return null; } }
  async function set(blob, name, origin = 'upload') {
    const rec = { blob, name: name || blob.name || 'untitled', type: blob.type, size: blob.size, origin, added: Date.now() };
    await tx('readwrite', s => s.put(rec, KEY)); emit(rec); bc && bc.postMessage('changed');
    return rec;
  }
  async function clear() { await tx('readwrite', s => s.delete(KEY)); emit(null); bc && bc.postMessage('changed'); }
  const onChange = f => { listeners.add(f); return () => listeners.delete(f); };
  return { get, set, clear, onChange };
})();
