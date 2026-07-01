# Vite Dashboard — Deprecated (REAL-126)

The legacy Vite `/dashboard/*` application is **deprecated** as of REAL-126.

## Canonical surface

All executive and operational UI lives in **empireai-web** at `/cockpit/*`.

## Redirect behaviour

- `/dashboard/*` routes redirect to the matching `/cockpit/*` path via `DashboardCockpitRedirect`.
- Redirect map: `frontend/src/lib/cockpit-redirects.ts`
- Set `VITE_COCKPIT_ORIGIN` to the deployed Cockpit host when marketing and Cockpit run on different origins.

## What remains in this package

- Public marketing landing (`/`)
- Authentication pages (`/login`)
- API proxy to Brain backend (dev)

## Do not add new dashboard features here

New screens belong under `empireai-web/app/(cockpit)/cockpit/`.
