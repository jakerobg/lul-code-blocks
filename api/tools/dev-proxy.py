#!/usr/bin/env python3
"""Dev server for the sandbox: static files + a local API proxy.

Why this exists: api.zoningatlas.org does not answer browser calls from a
localhost origin (measured — the same fetch succeeds from landuselabs.com), so
the block cannot be exercised end-to-end on a local preview. Rather than ask for
a CORS change, this serves the page AND proxies the API call, so the browser only
ever talks to its own origin and CORS never enters the picture.

It is the same shape as the production proxy — browser -> proxy (no key) ->
upstream (key added server-side) — so it doubles as a working prototype of the
Worker/App Service you would deploy.

    python3 tools/dev-proxy.py            # then open http://localhost:8899/

Routes:
    /mock?lat=&lon=   -> the zoning mock, with X-API-Key attached here
    everything else   -> files from the api/ directory

DEV ONLY. Never deploy this; it has no rate limiting and prints to stdout.
"""

import http.server, socketserver, urllib.request, urllib.error, urllib.parse, json, os, sys

PORT = int(os.environ.get("PORT", "8899"))
UPSTREAM = "https://api.zoningatlas.org/rpc/zoning_point_mock"
API_KEY = os.environ.get("LUL_DEMO_KEY", "yGhdb35gai5WARajNafMBuVj")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.rstrip("/") == "/mock":
            return self.proxy(parsed)
        return super().do_GET()

    def proxy(self, parsed):
        q = urllib.parse.parse_qs(parsed.query)
        lat, lon = (q.get("lat", [""])[0], q.get("lon", [""])[0])
        url = f"{UPSTREAM}?lat={urllib.parse.quote(lat)}&lon={urllib.parse.quote(lon)}"
        req = urllib.request.Request(
            url,
            headers={
                "X-API-Key": API_KEY,
                "Accept": "application/json",
                # a browser-ish UA: the upstream sits behind a bot challenge that
                # refuses default python-urllib
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                body, status = r.read(), r.status
        except urllib.error.HTTPError as e:
            body, status = e.read(), e.code
        except Exception as e:
            body = json.dumps({"code": "proxy_error", "message": str(e)}).encode()
            status = 502

        print(f"  proxied lat={lat} lon={lon} -> {status} ({len(body)} bytes)", flush=True)
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        if "/mock" not in (args[0] if args else ""):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"sandbox dev server  http://localhost:{PORT}/")
        print(f"  proxying /mock -> {UPSTREAM}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")
