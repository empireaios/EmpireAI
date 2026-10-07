# Work 3 institutional memory

Uses the existing locked runtime, owner bearer/session boundary, native SQLite durability pattern, existing Pillow reasoning provider/accounting path, and Work 2 semantic read bridge. No OAuth changes and no additional MCP tool.

## Canonical state
`/data/commissioning/pillow-institutional.sqlite` contains provider-independent Pillow identity, immutable decision/expectation snapshots, and append-only versioned events. It never modifies the legacy business DB, mission store, transcripts or communication records. Existing seeded learning is not imported and the locked reasoning path no longer consumes its auto-approved bundle.

Ordinary completed material reasoning is captured as MODEL_GENERATED_CLAIM, not verified fact. Optional visible executive-memory structured output can record a decision, expectation and explicitly used memory IDs. Missing fields remain absent. Repeated request IDs are idempotent; changed content conflicts. No hidden reasoning is stored.

Owner-authenticated `POST /api/owner/advisor/memory` supports explicit durable doctrine, synthetic experience intake, and bounded lifecycle events. Origin/authenticity are assigned by the adapter, not accepted from the body. Owner outcomes are OWNER_ASSERTED, never independently verified operational truth. No historical backfill is performed. Future trusted observation adapters must establish verified evidence at the boundary before introducing operational classifications.

## Learning and review
OUTCOME attaches evidence hashes, observations and metrics. Discrepancy is calculated only for equal metric names/units. LESSON remains a candidate. Owner-confirmed heuristic promotion requires an observed outcome and an existing candidate, and refuses synthetic/conflicted experience. Contradictions, supersession, retraction and expiry remove active influence without changing the original decision. Explicit owner doctrine supersession preserves both versions. Review distinguishes process quality, outcome quality and exogenous explanations.

For a bounded paid review through ordinary Pillow chat, the owner may request `Review experience RECORD_ID`. Synthetic records additionally require `[SYNTHETIC_MEMORY_TEST]`; they remain excluded from ordinary context. Review output may append visible executive-review structured rationale and a candidate lesson. Review never promotes itself. Due dates are deterministic flags; there is no background LLM polling or recurring inference scheduler.

Context selection is indexed, domain/entity scoped, capped at 40 candidates, six active summaries plus three unresolved references, with bounded text. Current canonical authority and verified current evidence outrank historical material. Retrieved prose is evidence, not instructions. Retrieval IDs do not themselves prove influence: only model-declared supplied IDs are recorded as influences.

## Read and owner inspection
Existing fetch/list_records/search expose memory and memory:identity, plus memory:RECORD_ID. Search maps memory-related concepts to the domain. Owner Advisor UI inspects the same records and captures explicit durable owner direction. Neither reads nor writes invoke inference. Read redaction remains the Work 2 boundary.

## Limits and cost
No paid services, embeddings or always-on worker. SQLite ceiling 64 MiB; per workspace 10,000 records; 100 events per experience. Payloads, pagination and review context are bounded. At capacity writes fail visibly rather than silently deleting history; future governed retention is required. No claim that OWNER_ASSERTED evidence is independently verified. No automatic statistically meaningful calibration or broad historical extraction.

## Handover
Work 1: legacy seeded institutional memory and alternate executive/Soul stores remain historical and require later audit, not migration here.
Work 4: provide verified, timestamped source evidence and capability/freshness identities.
Work 5: provide settled/accrued financial outcomes and comparable expected/actual operands.
Work 6: link execution intent, current authority receipts, reconciliation, recovery and real outcomes; retain future governed Advisor internal submission into the existing gateway.
Work 7: render structured experience timelines, authenticity, unresolved outcomes and review controls beyond the minimal inspection surface.
Work 8: fresh independent adversarial certification of source forgery, poisoning, contradiction, stale precedence, review promotion, cross-workspace isolation and bounded retrieval. Work 9 remains locked.
