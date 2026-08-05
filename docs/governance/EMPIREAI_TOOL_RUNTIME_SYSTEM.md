# EmpireAI Tool Runtime

PILLOW-TOOLRT-001 / Q10-07 provides the Tool Runtime inside Pillow.

The Tool Runtime is the enterprise tool registration and invocation service for workers, factories, and Pillow. It registers tools across categories, discovers them by category/provider/availability, authenticates via credential references only, invokes approved actions with permission gating and retries, monitors availability, and produces Tool Runtime Reports consumable by Q10-08 Communication Runtime.

The Tool Runtime reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never fabricates tool execution results, never exposes secrets or credentials, never invokes unauthorized tools, and never bypasses governance.

## Tool Categories

cursor, github, design, analytics, ai_provider, marketplace, supplier, cloud_platform, deployment, database, monitoring, internal_enterprise, custom_extension.

## Auth Methods

api_key, oauth, bearer_token, basic, none, custom_extension.

All secret material is referenced only via `credentialReference` strings such as `cred://vault/...`. Raw keys, tokens, passwords, and credentials are never accepted, logged, or reported.

## Connection / Availability

- Connection statuses: disconnected, connecting, connected, degraded, failed, closed.
- Availability statuses: available, degraded, unavailable, unknown, standby.

## Workflow

1. Connect and bootstrap tool services (tool registry, discovery, auth manager, permission gate, invocation engine, retry engine, availability monitor, usage tracker, metrics collector, report builder).
2. Register tools with category, auth method, permission policy, and credentialReference only.
3. Discover tools by category, provider, or availability.
4. Authenticate structurally (no secret material).
5. Invoke approved actions through validate → resolve → permission → auth → availability → invoke → retry.
6. Retry transient failures; update availability and usage from invocation evidence.
7. Produce Tool Runtime Reports (`TOOLRT-RPT-v1` / `TOOLRT-001-v1`) with `consumableByQ1008: true`.
8. Expose Q1008ConsumableContract for Q10-08 and preserve complete invocation and audit history.

## Integrations

- Shared Runtime Core (topology, routing, Q1002 contract)
- Pillow Orchestration Runtime (structural dispatch signals, Q1003 contract)
- Mission Runtime (Q1004 contract consumption)
- Queue Runtime (Q1005 contract consumption)
- Memory Runtime (Q1006 contract consumption)
- API Runtime (Q1007 contract consumption)
- Approval Runtime
- Executive Reporting Runtime
- Audit Runtime
- Worker Recovery System / Recovery

Optional toolAdapter dependency may execute live tool calls. Without a bound adapter, invocations remain structural (`liveExecution: false`) and result payloads are never fabricated.

## Boundaries

The Tool Runtime:

- DOES register tools and invoke approved structural tool actions by toolId.
- DOES authenticate using credentialReference strings only.
- DOES enforce permission policies, Pillow confirmation, and Grand King approval for high-risk tools.
- DOES produce Tool Runtime Reports for downstream Q10-08 consumption.
- DOES NOT expose secrets, API keys, tokens, or credentials.
- DOES NOT fabricate tool execution results without a bound toolAdapter.
- DOES NOT invoke unauthorized tools.
- DOES NOT bypass Pillow governance or Grand King approval.
- DOES NOT override approved architecture, Pillow, or Grand King.
- DOES NOT implement Q10-08 Communication Runtime or later.
