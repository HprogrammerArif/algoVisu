# QuantumViz Frontend

Vanilla HTML / CSS / JavaScript. **No build step, no npm.** Open it with any static server.

## Run

```bash
# from the repo root, pick one:
npx serve frontend -l 5500
# or
cd frontend && python -m http.server 5500
# or: VS Code "Live Server" on frontend/index.html
```

Then open `http://127.0.0.1:5500`. Make sure the backend is running and that
`frontend/config.js` `API_BASE_URL` matches it (and the backend `CORS_ORIGIN` matches this
origin).

## Layout

```
index.html        the workspace (sidebar / canvas / right drawer)
styles.css        the neon/CRT theme
js/
  algorithms.js   reversible step-generators (existing engine)
  visualizers.js  per-type renderers (existing engine)
  app.js          UI wiring + playback engine (existing engine)
  api/            NEW backend client (window.QV.*)
    client.js         fetch wrapper: base URL, JWT header, error normalization
    authApi.js        register / login / me / logout
    algorithmsApi.js  categories, algorithm list + detail
    bookmarksApi.js   list / add / remove (auth)
    progressApi.js    list / set (auth)
config.js         API_BASE_URL
```

## API client (ready for integration)

The `js/api/*` modules expose a `window.QV` namespace once loaded, e.g.:

```html
<script src="config.js"></script>
<script src="js/api/client.js"></script>
<script src="js/api/authApi.js"></script>
<script src="js/api/algorithmsApi.js"></script>
<!-- ... -->
<script>
  const cats = await QV.algorithmsApi.listCategories();
  const algo = await QV.algorithmsApi.detail('binary-search');
  await QV.authApi.login('admin@quantumviz.local', '...');
</script>
```

> **Status:** these client modules are written and ready but are **not yet wired into
> `index.html`** — that is Phase 8 (replace the hardcoded catalog with API data, add the
> login/register UI, and bookmarks/progress controls). The existing engine still runs on its
> built-in data until then. See [../docs/implementation-plan.md](../docs/implementation-plan.md).
