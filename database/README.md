# Database

Data layer for EmpireAI—schemas, migrations, seeds, and database-related documentation.

## Responsibilities

- Canonical data models for users, organizations, ventures, and agent runs
- Version-controlled schema migrations
- Seed data for local development and demos
- Indexing, constraints, and performance considerations
- Backup and restore procedures (documented in `docs/`)

## Planned Structure

```
database/
├── migrations/    # Ordered schema change scripts
├── schemas/       # Reference DDL and entity diagrams
└── seeds/         # Development and test fixture data
```

## Conventions

- All schema changes go through migrations—no manual production edits
- Naming follows snake_case for tables and columns unless ORM dictates otherwise
- Coordinate breaking changes with `backend/` and `api/`

## Status

Scaffold only. Application code not yet implemented.
