# EmpireAI API Runtime

PILLOW-APIRT-001 / Q10-06 provides the API Runtime inside Pillow.

The API Runtime is the enterprise API connection and routing service for workers, factories, and Pillow. It registers API providers, manages connections, authenticates via credential references only, routes structural requests with rate limiting, retries, and circuit breakers, and produces API Runtime Reports consumable by Q10-07 Tool Runtime.

The API Runtime reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never fabricates live API response bodies, never exposes secrets or API keys, and never bypasses governance.

## Service Types

supplier, marketplace, ai_model, payment, communication, internal_service, custom_extension.

## Auth Methods

api_key, oauth, bearer_token, basic, none, custom_extension.

All secret material is referenced only via `credentialReference` strings such as `cred://vault/...`. Raw keys, tokens, passwords, and credentials are never accepted, logged, or reported.

## Connection / Health / Rate / Circuit

- Connection statuses: disconnected, connecting, connected, degraded, failed, closed.
- Health statuses: healthy, degraded, unhealthy, unknown, standby.
- Rate limit statuses: ok, approaching, exceeded, unknown.
- Circuit states: closed, open, half_open.

## Workflow

1. Connect and bootstrap API services (provider registry, connection manager, auth manager, permission gate, router, retry policy, rate limiter, circuit breaker, health monitor, metrics collector, report builder).
2. Register API providers with endpoint, auth method, and credentialReference only.
3. Open/close connections and authenticate structurally (no secret material).
4. Route requests through permission → auth → rate limit → circuit → provider endpoint.
5. Retry transient failures; open circuit after consecutive failure threshold.
6. Produce API Runtime Reports (`APIRT-RPT-v1` / `APIRT-001-v1`) with `consumableByQ1007: true`.
7. Expose Q1007ConsumableContract for Q10-07 and preserve complete request and audit history.

## Integrations

- Shared Runtime Core (topology, routing, Q1002 contract)
- Pillow Orchestration Runtime (structural dispatch signals, Q1003 contract)
- Mission Runtime (Q1004 contract consumption)
- Queue Runtime (Q1005 contract consumption)
- Memory Runtime (Q1006 contract consumption)
- Approval Runtime
- Monitoring Runtime
- Executive Reporting Runtime
- Audit Runtime
- Worker Recovery System / Recovery

Optional transport dependency may execute live calls. Without a bound transport, requests remain structural (`liveCallExecuted: false`) and response bodies are never fabricated.

## Boundaries

The API Runtime:

- DOES register providers and route structural API requests by apiId.
- DOES authenticate using credentialReference strings only.
- DOES enforce rate limits, retries, and circuit breakers.
- DOES produce API Runtime Reports for downstream Q10-07 consumption.
- DOES NOT expose secrets, API keys, tokens, or credentials.
- DOES NOT fabricate live API response bodies without a bound transport.
- DOES NOT bypass Pillow governance or Grand King approval.
- DOES NOT override approved architecture, Pillow, or Grand King.
- DOES NOT implement Q10-07 Tool Runtime or later.
