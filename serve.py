#!/usr/bin/env python3
"""Serve augen locally, and take video exports straight to disk.

    python3 serve.py            # http://localhost:8770
    python3 serve.py 9000       # another port

Static files are served as with `python3 -m http.server` (never cached, so edits show on reload). On top of that,
a visualizer exporting an MP4 sends it here in pieces while it renders, and each piece is written into exports/
at its byte offset. The browser never holds the whole video, so any length or size works in any browser.

    POST /__augen/export?name=song.mp4      start a file    -> {"id": ..., "file": "exports/song.mp4"}
    PUT  /__augen/export/<id>?pos=<bytes>    write the body at that offset
    POST /__augen/export/<id>/done           finish         -> {"file": ...}
    POST /__augen/export/<id>/abort          delete the partial file

Listens on localhost only, so nothing on the network can write into the folder.
"""
import http.server, json, os, re, sys, threading, uuid
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.abspath(__file__))
EXPORTS = os.path.join(ROOT, 'exports')
OPEN = {}   # id -> (file object, path)
LOCK = threading.Lock()


def safe_name(name):
    base = re.sub(r'[^\w .()\-]+', '', os.path.basename(name or '')).strip(' .') or 'export'
    if not base.lower().endswith('.mp4'):
        base += '.mp4'
    stem, path, n = base[:-4], os.path.join(EXPORTS, base), 2
    while os.path.exists(path):   # never overwrite an earlier export
        path, n = os.path.join(EXPORTS, f'{stem} ({n}).mp4'), n + 1
    return path


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):   # exports print their own lines; their many PUTs would bury everything else
        if '/__augen/' not in str(args[0] if args else ''):
            super().log_message(fmt, *args)

    def reply(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def body(self):
        return self.rfile.read(int(self.headers.get('Content-Length') or 0))

    def do_POST(self):
        url = urlparse(self.path)
        parts = url.path.strip('/').split('/')
        if parts[:2] != ['__augen', 'export']:
            return self.reply(404, {'error': 'not found'})
        self.body()
        if len(parts) == 2:
            os.makedirs(EXPORTS, exist_ok=True)
            with LOCK:
                path = safe_name(parse_qs(url.query).get('name', [''])[0])
                fid = uuid.uuid4().hex
                OPEN[fid] = (open(path, 'w+b'), path)
            print(f'exporting {os.path.relpath(path, ROOT)}', flush=True)
            return self.reply(200, {'id': fid, 'file': os.path.relpath(path, ROOT)})
        with LOCK:
            entry = OPEN.pop(parts[2], None) if len(parts) == 4 else None
        if not entry:
            return self.reply(404, {'error': 'no such export'})
        f, path = entry
        f.close()
        if parts[3] == 'abort':
            os.remove(path)
            print(f'cancelled {os.path.relpath(path, ROOT)}', flush=True)
            return self.reply(200, {'ok': True})
        size = os.path.getsize(path) / 1048576
        print(f'saved {os.path.relpath(path, ROOT)} ({size:.0f} MB)', flush=True)
        return self.reply(200, {'file': os.path.relpath(path, ROOT)})

    def do_PUT(self):
        url = urlparse(self.path)
        parts = url.path.strip('/').split('/')
        data = self.body()
        with LOCK:
            entry = OPEN.get(parts[2]) if parts[:2] == ['__augen', 'export'] and len(parts) == 3 else None
            if entry:
                f = entry[0]
                f.seek(int(parse_qs(url.query).get('pos', ['0'])[0]))
                f.write(data)
        if not entry:
            return self.reply(404, {'error': 'no such export'})
        self.reply(200, {'ok': True})


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8770
    server = http.server.ThreadingHTTPServer(('localhost', port), Handler)
    print(f'augen on http://localhost:{port}  (exports save into {os.path.relpath(EXPORTS)}/)', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
