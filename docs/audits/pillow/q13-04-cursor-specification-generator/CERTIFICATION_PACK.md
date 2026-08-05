# Q13-04 Cursor Specification Generator — Certification Pack

**Engine:** PILLOW-CSGEN-001  
**Mission:** Q13-04  
**Version:** CSGEN-001-v1 / Q13-CSGEN-v1

## Scope

Cursor specification generation only. Consumes Q1304 from Mission Planning Engine; exposes Q1305 for Q13-05 without implementing Q13-05+.

## Boundaries (locked)

- neverImplementCode
- neverExecuteCursorMissions
- neverImplementQ1305OrLater
- neverSelfApprove
- neverInventMissions
- neverFabricateRepositoryFindings
- neverBypassGovernance

## Certification status

Specification generator module implemented with 12/12 CSGEN tests + 12/12 MPENG regression = 24/24.
