# Meridian

A production-style real estate platform for listings, agents, agencies, inquiries, viewing requests, and role-based dashboards.

Written in **JavaScript and JSX** (not TypeScript) for the application layer.

## What it includes

- Property search, filters, categories, and detail pages
- Agent and agency profiles
- Accounts, favorites, inquiries, and viewing requests
- Client, agent, and admin dashboards
- Listing create/edit with admin review
- Reviews, notifications, saved searches
- Frontend caching (TanStack Query) and backend TTL cache
- Auth and Postgres-backed data

## Roles

- `CLIENT` — save homes, enquire, request viewings
- `AGENT` — publish listings, answer enquiries
- `AGENCY_ADMIN` — agency listings
- `ADMIN` — users, agents, agencies, property moderation

## Stack

- TanStack Start (React, file-based routes)
- JavaScript / JSX
- Tailwind CSS
- Better Auth
- Postgres / PGLite
- TanStack Query

## Local run

```bash
npm install
npm run dev
```

The app serves on port 8080.

## Notes

Platform auth, database, and preview helpers remain TypeScript because they are part of the host runtime. All Meridian product code (routes, UI, services, seed data) is JavaScript/JSX.
