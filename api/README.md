# API

API contracts and shared interface definitions for EmpireAI services.

## Responsibilities

- OpenAPI / Swagger specifications for public and internal APIs
- Shared request/response schemas and error formats
- Versioning strategy and deprecation policy
- Client SDK generation inputs (future)
- Webhook and event payload definitions

## Planned Structure

```
api/
├── openapi/       # OpenAPI YAML/JSON specifications
└── contracts/     # Shared JSON Schema, protobuf, or TypeScript types
```

## Conventions

- Spec-first or spec-synced—contracts are the source of truth for cross-team boundaries
- Semantic versioning for breaking API changes
- Document authentication requirements per endpoint

## Status

Scaffold only. Specifications not yet defined.
