# Backend

Core server application for EmpireAI—business logic, authentication, data access, and integration with AI agents and external services.

## Responsibilities

- REST and/or GraphQL API implementation
- User and organization management
- Authorization and security middleware
- Persistence layer integration with `database/`
- Agent orchestration hooks and webhook handlers
- Background job processing and event handling

## Planned Structure

```
backend/
├── src/           # Application modules, services, and routes
└── config/        # Environment and service configuration templates
```

## Conventions

- Implement APIs according to specifications in `api/`
- Keep domain logic separate from transport and infrastructure layers
- Secrets and credentials via environment variables only

## Status

Scaffold only. Application code not yet implemented.
