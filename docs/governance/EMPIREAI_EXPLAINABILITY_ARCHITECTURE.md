# EmpireAI Explainability Architecture

**Mission ID:** P7-07  
**Status:** Active  
**Depends on:** P7-06 Live ETA · P7-03 Pillow UX · P6-03 Supervisor · P6-02 ECC · P5-04 VIE  
**Successor:** P8-01 Factory ✅ · P8-02 Commerce

## Purpose

EmpireAI shall never behave as a black box. Every recommendation, mission, automation, engineering decision, business decision, and constitutional decision shall be explainable with **WHY · WHAT · HOW · PROOF**, evidence, impacts, risk, confidence, and alternatives.

## Canonical Architecture

```
Pillow · ECC · VIE · Supervisor · Builder · Guardian · Recovery · Automation
        ↓
EXPLAINABILITY_ARCHITECTURE (P7-07)
        ↓
Explainability Panel · Executive Home · Pillow Proactive Guidance
```

## Explanation Model

Every significant recommendation includes: WHY · WHAT · HOW · PROOF · Business Impact · Engineering Impact · Architecture Impact · Production Impact · Risk · Expected Benefit · Confidence · Alternative Options

## Evidence Model

Vision · Soul · CTD · Constitution Hierarchy · Roadmap · Current Mission · Architecture · Repository · Production Truth · Journey · Runtime · Historical Evidence · Validation Results

## Implementation

| Layer | Path |
|-------|------|
| Assembler | `pillow/src/explainability/` |
| API | `GET /api/pillow/explainability` |
| Dashboard | `empireai-web/components/cockpit/explainability/ExplainabilityDashboard.tsx` |
| Route | `/cockpit/founder/explainability` |
