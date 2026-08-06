# Learning Governance Report

**Date:** 2026-07-26  
**Deploy:** `38594cd5`  
**Verdict:** **PASS** (production)

## Live governance

| Action | Result |
|--------|--------|
| Review API registered (Cockpit-critical) | **200** BFF + Brain |
| Pending confirmation with GK flags | **PASS** (Cat A requiresGrandKingApproval) |
| Approve → EKB | **PASS** |
| Reject → excluded from KB | **PASS** |
| Cat D promote/escalate blocked | **PASS** |
| Constitutional auto-refuse on bypass | **PASS** |

## Classifications (runtime)

Permanent / Strategic / Temporary / Experimental / Historical / Owner-approved / Rejected — mapped in `pillow/src/learning/governance.ts`; live approve/reject exercised on production.
