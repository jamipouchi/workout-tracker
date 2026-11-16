# workout-tracker

One Cloudflare Worker (`workout-tracker-frontend`, deployed by Workers Builds on push to `main`) on `workout-tracker.miquelpuigturon.com`:

- `src/`: SolidStart SPA, built statically to `.output/public` and served as Worker static assets.
- `worker/index.ts`: Hono API, mounted at `/api/*` (`run_worker_first` in `wrangler.jsonc`). Uses D1 (`workout_tracker`).
- `migrations/`: D1 schema.

Writes need `X-API-Key` matching the `API_KEY` secret. The frontend sends the value stored in
`localStorage['workout_tracker_api_key']`.

## Develop

```sh
npm install
echo 'API_KEY=dev' > .dev.vars
npm run migrate:local
npm run dev:api   # wrangler on :8787
npm run dev       # vinxi on :3000, calls :8787/api
```

`npm run preview` builds and serves the production setup (assets + API) through `wrangler dev`.

## Deploy

```sh
npm run deploy                 # vinxi build && wrangler deploy
npx wrangler secret put API_KEY  # first deploy, or to rotate the key
```
