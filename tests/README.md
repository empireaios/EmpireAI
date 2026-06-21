# Tests

Automated test suites for EmpireAI across unit, integration, and end-to-end layers.

## Responsibilities

- Unit tests for backend logic, utilities, and agent tools
- Integration tests for API, database, and external service boundaries
- End-to-end tests for critical user journeys in `frontend/`
- Test fixtures, factories, and shared helpers
- Coverage reporting and CI test gates

## Planned Structure

```
tests/
├── unit/          # Fast, isolated tests
├── integration/   # API, DB, and service integration tests
└── e2e/           # Browser and full-stack scenario tests
```

## Conventions

- Tests mirror the structure of the code they cover
- Use seeds from `database/seeds/` for consistent integration data
- E2E tests target staging-like environments, not production

## Status

Scaffold only. Test suites not yet implemented.
