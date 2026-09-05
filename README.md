# Meridian

A production-style real estate platform for listings, agents, agencies, inquiries, viewing requests, and role-based dashboards.

Written in **JavaScript and JSX** for the application layer.

## Deploy on Vercel (GitHub)

Repo: [Justdeola/meridian-real-estate](https://github.com/Justdeola/meridian-real-estate)

Vercel is connected to GitHub. Create a project from that repo, then add the environment variables below (Project → Settings → Environment Variables). Apply them to **Production, Preview, and Development**.

### Required

| Name | Value |
|---|---|
| `VITE_AUTH_ENABLED` | `true` |
| `BETTER_AUTH_URL` | Your live URL, e.g. `https://meridian-real-estate.vercel.app` |
| `BETTER_AUTH_SECRET` | A long random string (32+ chars). Generate with `openssl rand -hex 32` |
| `DATABASE_URL` | Postgres connection string from [Neon](https://neon.tech) (or any Postgres). Example: `postgresql://USER:PASSWORD@HOST/DB?sslmode=require` |

### Optional (Redis cache)

If unset, the app uses in-memory cache.

| Name | Value |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |

After saving env vars, **Redeploy**. Migrations run during `npm run build`.

## Local run

```bash
npm install
npm run dev
```

## Roles

- `CLIENT` — save homes, enquire, request viewings
- `AGENT` — publish listings, answer enquiries
- `AGENCY_ADMIN` — agency listings
- `ADMIN` — users, agents, agencies, property moderation
