# Frontend

User-facing web application for EmpireAI—the primary interface entrepreneurs use to interact with the AI Operating System.

## Responsibilities

- Dashboard, navigation, and core product UI
- Authentication and session UX
- Real-time views of agent activity, tasks, and business metrics
- Responsive layout for desktop and mobile
- Client-side state management and API consumption

## Planned Structure

```
frontend/
├── src/           # Application source (components, pages, hooks, utils)
├── public/        # Static assets served as-is
└── assets/        # Images, fonts, and design resources
```

## Conventions

- Follow the design system and component patterns defined in `docs/`
- Consume backend services via contracts in `api/`
- Environment-specific configuration via env files (not committed)

## Status

Scaffold only. Application code not yet implemented.
