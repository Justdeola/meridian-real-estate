# Meridian

**Version 1.0.0**

A production-style real estate platform for listings, agents, agencies, inquiries, viewing requests, and role-based dashboards.

Written in **JavaScript and JSX**. Stack: TanStack Start, Better Auth, Postgres, Tailwind, Framer Motion.

**Repo:** [Justdeola/meridian-real-estate](https://github.com/Justdeola/meridian-real-estate)  
**Release:** [v1.0.0](https://github.com/Justdeola/meridian-real-estate/releases/tag/v1.0.0)  
**Live:** [meridian-real-estate-pi.vercel.app](https://meridian-real-estate-pi.vercel.app)

## Deploy on Vercel (from GitHub)

This repo is linked to Vercel. Every push to `main` deploys automatically.

### Environment variables

Add these in **Vercel → Project → Settings → Environment Variables**. Apply to **Production, Preview, and Development**. Then **Redeploy**.

| Name | Required | Value |
|---|---|---|
| `VITE_AUTH_ENABLED` | Yes | `true` (also set in `vercel.json`) |
| `BETTER_AUTH_SECRET` | Yes | Random 32+ char secret. Example: `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Yes | Your live URL, e.g. `https://meridian-real-estate.vercel.app` |
| `DATABASE_URL` | Yes | Postgres URL from [Neon](https://neon.tech) (or Vercel Storage → Postgres). Example: `postgresql://USER:PASSWORD@HOST/DB?sslmode=require` |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash Redis REST URL. Falls back to in-memory cache. |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis REST token. |

`npm run build` applies SQL migrations when `DATABASE_URL` is set. Listings seed automatically on first request if the catalog is empty.

### Neon in one minute

1. Open [neon.tech](https://neon.tech) → New project
2. Copy the connection string
3. Paste it as `DATABASE_URL` in Vercel
4. Redeploy

## Local run

```bash
npm install
npm run dev
```

Auth works in preview without env vars. For a real Postgres locally, set `DATABASE_URL`.

## Roles

- `CLIENT` — save homes, enquire, request viewings
- `AGENT` — publish listings, answer enquiries
- `AGENCY_ADMIN` — agency listings
- `ADMIN` — users, agents, agencies, property moderation
