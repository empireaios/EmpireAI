# Scoped locked reasoning integration — 2026-10-02 Singapore

Cutover remains CLOSED at 41b8979. Certification remains PAUSED. Original unseen I1 and implementation diagnosis remain preserved on cert/pillow-unseen-20261002 at e0fd5ce; no consumed case was reused here.

## Change boundary
Builds on provider candidate be2423e, not a new architecture. The shared Brain router and original cumulative US$20 inference ledger remain authoritative.

- Pillow maps existing context-task capabilities to reasoning/analysis/summarization/critique. Ordinary requests do not fan out. Authenticated owner text may explicitly select a capability and justified two-provider consultation using the bounded /pillow-request JSON envelope. Consultation returns separately attributed answers, without a third synthesis call.
- One optional model-selected local arithmetic round supports at most three exact rational operations. No eval, code execution, network or write tool is admitted. A single 120-second signal bounds the complete inference/consultation/tool-response chain. Provider-level admission/reservation remains fail-closed before each call.
- ContextBuilder.buildReadOnly reuses source selection/loading but excludes all operational resolvers, restricts sources to the existing catalog, caps eight sources at 4,000 bytes each, rejects traversal/symlinks, and hashes the formerly oversized metadata fingerprint.
- Current mission observation and stored commissioning evidence use bounded owner-workspace reads. The new evidence reader performs SELECT only; no mirror recovery, product reselection, or approval import. Historical repository/evidence is explicitly labelled.
- Native /data/commissioning/pillow-reasoning.sqlite stores bounded recent transcript and idempotent pending conversation evidence. Rebind restores user/assistant context only, never approval state or historical authority. Newly captured transcripts survive store/process reinitialization; pre-integration saved UI results are not silently treated as complete hydrated history.
- Pending evidence is untrusted and pending_owner_review. No automatic institutional promotion, Soul/constitution edit or permission change exists in this path. Existing approved-knowledge reads remain.
- The answer gate now requires affirmative recommendation evidence rather than bare action-word mentions, removes ambient zero-commerce as a substitute for an expressed goal, preserves unrelated reasoning during correction, and tries validated original text before generated coverage.
- General tool-loop descriptions distinguish the bounded local tool round from unrestricted execution. HTTP authority locks and launch configuration remain unchanged by this integration delta.

Explicit consultation example (protocol documentation, not an examination):
/pillow-request {"message":"Review the supplied decision evidence.","capability":"critique","consultation":{"providers":["openai","anthropic"],"justification":"Independent review of conflicting decision evidence"}}

## Verification
Pillow build and backend full TypeScript build pass on Node 22.23.2. Backend succeeds with the existing default heap after correcting test imports to use the package boundary.
44 distinct targeted tests pass across integration, actual application fresh-login/authority, inference ledger, provider protocols/fallback, decision quality and release-gate checks. The strengthened actual-host test substitutes only the paid inference layer and proves repository/mission receipts reach it and transcript/pending evidence persist. This is offline integration evidence, not live provider proof or intelligence certification.
A separate child-process check also confirms transcript and pending-evidence readback after process reinitialization.
A separate-process budget test now resolves its child working directory relative to its own module. Two older semantic test failures were reproduced on the unchanged baseline: one coverage mutation was corrected by the general answer-preservation repair; one assertion now recognizes the noun 'verification' as well as the verb 'verify'. No expected examination answer was inserted.
During integration validation, the actual host exposed a 68,365-character repository receipt caused by the old expanded fingerprint; fixed by hashing metadata. Initial backend test imports crossed rootDir and increased compiler memory; corrected to package imports, generated compiler artifacts excluded from publication.

## Provider models/pricing reverified
Official pages read 2026-10-02 Singapore:
- Claude claude-sonnet-5-5: active; adaptive reasoning; standard US$2 input / US$10 output per million tokens. Conservative reservation still includes cache/regional upper bounds.
  https://platform.claude.com/docs/en/models/sonnet-5-5/overview
  https://platform.claude.com/docs/en/about-claude/pricing
- Gemini gemini-3.8-flash: supported reasoning model; introductory US$0.75 input / US$3.75 output per million tokens through 2026-12-31.
  https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
  https://ai.google.dev/gemini-api/docs/pricing
OpenAI gpt-6.1-sol and its existing accounting are unchanged.

## Remaining activation boundary
Not production verified yet. Deploy the compatible frontend before the exact new backend SHA. Then verify readiness/identity, privately provision one provider credential at a time, prove bounded real provider calls/routing/provenance/accounting, and read back cumulative usage before certification. No additional paid inference occurred during this implementation.

No broad scheduling, unrestricted workers, Birth, commerce, external writes, supplier/payment/fulfilment action or broad Owner UX work is enabled.
