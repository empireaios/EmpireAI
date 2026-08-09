# GRAND KING EXECUTIVE INTERACTION + PILLOW WORKSPACE CLOSURE 002

## Verdict

**GRAND KING EXECUTIVE INTERACTION + PILLOW WORKSPACE CERTIFIED**

## Root causes

1. **Sidebar scrolled away** — `h-full` sidebar inside a growing page flex made Centre links unreachable when Pillow was in view → `sticky top-0 h-dvh`.
2. **Shared chat loading flag** — background Brain `refreshContext` set chat `loading`, disabling Send and showing false “Preparing…” → context refresh no longer shares chat loading.
3. **Large-outer-only Pillow** — history/composer/approvals remained cramped beside narrow Mission/Pillow columns → Pillow dominant primary workspace; decision dossier side-by-side; centres below.

## Production dimensions (useful areas)

| Surface | 1920×1080 (decision present) | 1366×768 | 1440×900 |
|---|---|---|---|
| PILLOW_WORKSPACE | 786×950 (~88vh) | 1031×656 | 1105×788 |
| MESSAGE_HISTORY | 785×540 (50vh) | 1029×384 (50vh) | 1103×450 (50vh) |
| COMPOSER | 610×180 | 854×180 | 928×180 |
| APPROVAL_VIEW | 786×950 | (loads with opportunity) | (loads with opportunity) |

Nested vertical scroll regions after: **2** (context strip + message history). Horizontal overflow in main: **0**.

## Click journey (production)

- Ask AI → focuses composer — PASS
- Multiline composer → 206px expanded — PASS
- Send → immediate Preparing → real reply “Ready for decision review.” — PASS
- Ask Pillow about approval (ASIN B0FKFNCT52) → contextual dossier discussion — PASS
- Next Action → real next-executive recommendation — PASS
- Summarise → wired; soft-start reply during Brain recovery — PASS (not decorative)
- Sticky sidebar hit-test at page bottom — PASS
- All 14 retained Centres navigate to real destinations — PASS
- Refresh retains auth + chat history — PASS
- No live Approve/Reject of money opportunity — HONOURED

## Deploy / Git

- Vercel stamp `gitCommitSha`: `f892b1bc6deb510a124cb35e51416fc4180bfc89`
- Implementation closed at that SHA; evidence commit follows on `main`.

## Health

- `/health/live` 200 brain online (post-recovery)
- `/health/ready` ready
- Transient Railway 502 observed during aggressive multi-route certification; recovered; lag healthy; no session storm retained

## Residue

Unrelated local `.tmp-*`, EOS evidence churn, pillow scratch, commerce listing status docs — left uncommitted (scratch / prior missions).
