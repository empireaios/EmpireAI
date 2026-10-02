# Live Pillow display and inference failure — 2026-10-02

## Original owner evidence
Owner supplied two actual desktop screenshots at09:34/09:35 Singapore. Both show fixed left navigation occluding the start of the conversation, role label, list markers and composer. Owner reports numbered points cannot be seen. Cross-device server history remains resolved; this is not a history regression.
Source attachments retained: [
  {
    "fileId": "file_00000000f4448207aa96a2a2530eb038",
    "libraryId": "libfile_8a7bd6d1f69c819181373c1629906bfc",
    "sha256": "72cd0a3341394b6f8f9d8d57ab84bb275aef7810939f0e2efbc5cd7e3d4bcf85"
  },
  {
    "fileId": "file_000000005da082079957cdf905201256",
    "libraryId": "libfile_4531810165ec8191a057d53881a42f4c",
    "sha256": "7d5f6e476b37feaf531f5bf6c692cd76bf55d1b3934d1c4e774485fe080cff42"
  }
]

Owner's existing PROVIDER-CHECK-20261002-A response contains repeated literal /pillow-request JSON fragments followed by “Verdict: Unsupported as established fact”, “Recommended first moves”, supplier qualification/gates, bounded cohort advice and “EmpireAI is live and answering in production.” These are not independently attributed Claude/Gemini answers and do not establish connectivity.

## Independent runtime evidence
{
  "deployment": "718a74de-586d-4818-8904-a152414aa407",
  "period": "2026-10-02T01:33:14Z–01:33:35Z",
  "requestIds": [
    "a175b14c-a626-4fa2-bf5e-fa79e0f0e7a8",
    "9137d581-7a45-4577-8508-dc1bf5a05337",
    "20378cb7-d78d-4e25-9714-af76ae692a72"
  ],
  "result": "degraded_useful / degraded_synthetic_live_strip",
  "healthError": "UNIQUE constraint failed: inference_requests.id",
  "interpretation": "Duplicate admission blocked by existing durable guard; original call outcome/cost not proven by this error. No additional paid probe authorized as evidence repetition."
}
Read-only production /api/pillow/health200 returned Idle/running and lastError “UNIQUE constraint failed: inference_requests.id”. This proves a duplicate ledger admission was rejected. It does NOT identify the initial provider failure or prove whether the original attempt incurred cost.
No new paid Work requests; do not repeat the owner's probe for evidence. Ledger/provenance reconciliation remains required.

## Proven implementation defects and repair
1. Sidebar initialized expanded locally while shell independently restored collapsed browser preference. Navigation width and reserved space could diverge. One parent now owns both. Width animation removed so expansion cannot temporarily overrun reserved space.
2. Desktop conversation minimum height plus page headers produced nested viewport overflow. Pillow-only desktop shell/main/department/workspace now form a bounded flex viewport. Mobile base layout unchanged. List-marker inset/contrast improved.
3. Raw owner transport JSON reached semantic task/release processing. A distinct maintenance-window fixture reproduced JSON metadata in parsed task text. Parse supported envelope before semantic gates; retain explicit capability/consultation/calculations, process only human message as task. No test-marker special cases.
4. Inference exceptions entered useful-degraded commercial prose reconstruction. New typed nonretryable INFERENCE_FAILED remains an honest failure; worker treats it as fatal without another paid attempt. Durable request guard/accounting unchanged.

Backend84ab891fcafc733f9d43e4b30e14a4e0fb2d25de: four files only, exact diff independently read. Parent8dcc host blob independently matched reconstructed original692683d78ed5901204b14dc8b7fa7b03a844816f.
Frontend1352d6b03990fff356d8b83942e457c80976bb12: seven files only from4a6f97e; includes runtime compatibility. Supersedes intermediate0801700.
Backend build PASS. Thirteen targeted host/worker tests PASS including actual authenticated session and protected mutation denials, envelope/options preservation, provider failure with one attempt and fatal worker classification. Nine display/parser tests PASS. Frontend optimized build PASS for UI repair; combined frontend typecheck PASS. Preview readiness tracked in canonical handoff.
Visual browser verification remains blocked by nativecredential protection; no false visual pass. The owner's two screenshots are failure evidence, not retest evidence.

## Boundary
Production remains frontend4a6f97e/backend8dcc928 until owner promotes combined frontend1352d6b. Then deploy backend84ab891 to existing locked runtime, preserving credentials/volume/Redis and locks. No cutover reopen/legacy changes. Reconcile existing provider attempt before new paid test. Integration NOT CLOSED, certification PAUSED, consumed originalI1 preserved and never reused. NOT_BORN/commerceLOCKED unchanged.
