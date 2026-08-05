# EmpireAI Communication Runtime

PILLOW-COMRT-001 / Q10-08 provides the Communication Runtime inside Pillow.

The Communication Runtime is the enterprise inter-worker and inter-factory messaging service for EmpireAI. It opens communication channels, routes messages deterministically, supports synchronous request-response and asynchronous delivery, handles acknowledgements and retries, manages collaboration sessions, and produces Communication Runtime Reports consumable by Q10-09 Approval Runtime.

The Communication Runtime reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never fabricates messages, never loses acknowledged messages from history, never exposes secrets (contextReference only), and never bypasses Pillow or Grand King governance.

## Message Types

request, response, event, broadcast, multicast, point_to_point, collaboration, acknowledgement, dead_letter, custom_extension.

## Delivery Statuses

pending, routed, delivered, acknowledged, failed, retrying, dead_lettered.

## Channel Types

worker_to_worker, factory_to_factory, runtime_service, collaboration_session.

## Priorities

critical, high, normal, low, bulk — deterministic routing sorts by priority rank, then timestamp, then messageId.

## Workflow

1. Connect and bootstrap communication services (channel manager, message router, sync/async engines, acknowledgement handler, retry engine, context propagator, collaboration session manager, metrics collector, health monitor, report builder).
2. Open channels for worker-to-worker, factory-to-factory, and runtime service participants.
3. Send messages with explicit caller-provided contextReference only — never fabricate content.
4. Route deterministically; deliver via sync (request+response correlated) or async (pending → routed → delivered).
5. Acknowledge deliveries; acknowledged messages remain in history permanently.
6. Retry failed deliveries; dead-letter after maxRetries.
7. Open and close collaboration sessions.
8. Produce Communication Runtime Reports (`COMRT-RPT-v1` / `COMRT-001-v1`) with `consumableByQ1009: true`.
9. Expose Q1009ConsumableContract for Q10-09 and preserve complete communication and audit history.

## Integrations

- Shared Runtime Core (topology, routing, Q1002 contract)
- Pillow Orchestration Runtime (structural dispatch signals, Q1003 contract)
- Mission Runtime (Q1004 contract consumption)
- Queue Runtime (Q1005 contract consumption)
- Memory Runtime (Q1006 contract consumption)
- API Runtime (Q1007 contract consumption)
- Tool Runtime (Q1008 contract consumption)
- Executive Reporting Runtime
- Audit Runtime
- Worker Registry / Factory Registry
- Worker Recovery System / Recovery

## Boundaries

The Communication Runtime:

- DOES open channels and route caller-sent messages by receiver, channelType, and priority.
- DOES support synchronous and asynchronous delivery with acknowledgements and retries.
- DOES produce Communication Runtime Reports for downstream Q10-09 consumption.
- DOES NOT fabricate messages or invent deliveries.
- DOES NOT delete or lose acknowledged messages from history.
- DOES NOT expose secrets — contextReference strings only.
- DOES NOT bypass Pillow governance or Grand King approval.
- DOES NOT execute business logic or replace worker/orchestration implementations.
- DOES NOT implement Q10-09 Approval Runtime or later.
