# AA Studio

AA Studio is the content production layer of AICOS.

## What this repo is

- AA Console for internal content production
- Client Console for client production needs
- Briefs, strategy, production, repurposing, review, library, and performance
- Purple UI system retained from the old studio
- Front-end only for now, backend integration comes later

## Launch

```bash
npm install
npm run dev
```

## Environment setup

### Local development

1. Copy `.env.example` to `.env`.
2. Fill in your own values from Supabase and any local service keys you need, do not commit real keys.
3. Run `npm run dev`.

If you also run the Node API or Supabase functions locally, fill in the server section of `.env.example` too.

### Production builds

- GitHub Actions injects these secrets at build time:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_AA_CLIENT_ID`
- Do not add real `.env` files to the repo.
- `VITE_*` variables are public in the browser, so only use the anon key, never a service role key.

## Build

```bash
npm run build
```

## Structure

- `/` Home / console selector
- `/aa-console` internal studio launchpad
- `/client-console` client workspace launchpad
- `/briefs`, `/strategy`, `/production`, `/repurpose`, `/review`, `/library`, `/performance`
- `/client/*` client workspace pages
