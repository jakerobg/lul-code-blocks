# Sandbox dev tooling

    python3 tools/dev-proxy.py     # then open http://localhost:8899/

`dev-proxy.py` serves this directory and proxies `/mock?lat=&lon=` to the zoning
mock, attaching the API key server-side. `index.html` sets
`window.LUL_SANDBOX_API_BASE = "/mock"` so the block calls the proxy instead of
the live endpoint.

**Why it exists:** `api.zoningatlas.org` does not answer browser calls from a
localhost origin — the identical fetch succeeds from `landuselabs.com` and fails
with "Failed to fetch" from `http://localhost`. Rather than widen the API's CORS
policy for development, the proxy puts the browser and the API on the same origin,
so CORS never applies.

**It is also a working prototype of the production proxy.** Same shape:
browser (no key) → proxy → upstream (key added server-side). If you deploy the
Cloudflare Worker or Azure App Service version, it does exactly what this does.

`index.html` and `dev-proxy.py` are DEV ONLY. Only `api_sandbox.html` is pasted
into Squarespace, and it calls the live endpoint whenever
`window.LUL_SANDBOX_API_BASE` is unset — which is always, in production.
