# Frontend — EmpireAI Commerce

React + TypeScript web application for EmpireAI Commerce. Implements routing, layouts, and the dashboard shell per `docs/NAVIGATION.md` and `docs/DASHBOARD_SCREENS.md`.

## Stack

- **React 19** + **TypeScript**
- **Vite** — dev server and build
- **React Router 7** — client routing
- **Lucide React** — icons
- **CSS Modules** — component styles

## Project structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── dashboard/      # Dashboard page shell
│   │   └── layout/         # Sidebar, TopNav, MobileNav
│   ├── layouts/
│   │   ├── AuthLayout.tsx  # Login / signup split layout
│   │   └── DashboardLayout.tsx
│   ├── pages/
│   │   ├── auth/           # Login
│   │   ├── dashboard/      # Dashboard route pages (shell only)
│   │   └── public/         # Landing
│   ├── routes/
│   │   ├── index.tsx       # Route definitions
│   │   └── paths.ts        # Path constants + nav config
│   ├── styles/             # Global CSS + variables
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build
npm run lint     # Typecheck
```

## Routes (implemented)

| Route | Page |
|-------|------|
| `/` | Landing |
| `/login` | Login |
| `/dashboard` | → redirects to `/dashboard/profit` |
| `/dashboard/profit` | Home / Profit |
| `/dashboard/orders` | Orders |
| `/dashboard/ads` | Advertising |
| `/dashboard/suppliers` | Suppliers |
| `/dashboard/ai-team` | AI Team |
| `/dashboard/intelligence` | Product Intelligence |
| `/dashboard/billing` | Billing |
| `/dashboard/settings/*` | Settings tabs |

Setup wizard routes (`/setup/*`) and auth guards are not implemented yet.

## Development

- **Login:** `/login` — UI only; no authentication backend
- **Dashboard preview:** use the link on the login page or go to `/dashboard/profit`
- Path aliases: `@/` → `src/`

## Status

Foundation complete: routing, layouts, sidebar, top navigation, mobile nav, login page, dashboard shell placeholders. Business logic and API integration pending.
