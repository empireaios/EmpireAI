# Q2-05 Opportunity Evaluation Worker Certification

**Mission:** Q2-05 — Opportunity Evaluation Worker  
**Doctrine:** PILLOW-OEW-001  
**Module:** `opportunity-evaluation-worker`  
**Status:** FINAL PASS

## Summary

Isolated Empire Builder Factory AI Worker that receives Business Model (Q2-03) and Market Research (Q2-04) outputs, scores demand / feasibility / profit / risk / strategic fit, generates a weighted overall opportunity score, and recommends Proceed / Improve / Reject without approving the business.

## Prerequisites verified

- Q2-01 Empire Builder Factory Core — present
- Q2-02 Business Idea Interpreter — present
- Q2-03 Empire Builder Model Generator (`PILLOW-EMG-001`) — present
- Q2-04 Market Research Worker (`PILLOW-MRW-001`) — present

## Naming note

Module uses `opportunity-evaluation-worker` / `PILLOW-OEW-001` to avoid collision with existing `opportunity-discovery-engine` and `opportunity-prioritization-engine`.

## Boundaries

- Never approves businesses
- Never modifies business models
- Never launches businesses
- Never overrides Pillow or Grand King
- Never implements Q2-06 or later

## Integrations

Worker Registry, Worker Lifecycle, Worker Assignment Engine, Executive Reporting Runtime, Worker Performance Review, Worker Recovery System.

## Verification

```bash
npx --yes tsx --test "src/validation/tests/opportunity-evaluation-worker.test.ts"
```
