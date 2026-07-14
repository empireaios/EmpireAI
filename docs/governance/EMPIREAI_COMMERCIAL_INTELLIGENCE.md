# EmpireAI Commercial Intelligence Architecture

**Mission ID:** P8-05  
**Status:** Active  
**Depends on:** P8-04 Business Automation · P8-03 Marketplace · P8-02 Commerce · P8-01 Factory · PILLOW-CI-001  
**Successor:** P8-06 Grand King ✅ · P9-01 Repository

## Constitutional Purpose

**Automation executes. Intelligence decides.** Commercial Intelligence continuously transforms business data into profitable, explainable, constitutionally governed decisions — the decision engine of the Business Factory.

## Canonical Architecture

```
Business Data → Validation → Analysis → Opportunities/Risks → Recommendations → Executive Approval
        ↓
COMMERCIAL_INTELLIGENCE_ARCHITECTURE (P8-05)
        ↓
Business Factory · Commerce · Automation · Pillow · Cockpit
```

## Intelligence Pipeline

Business Data · Data Validation · Knowledge Extraction · Pattern Recognition · Business Analysis · Commercial Analysis · Opportunity Detection · Risk Detection · Recommendation Generation · Executive Approval · Business Improvement

## Implementation

| Layer | Path |
|-------|------|
| Assembler | `pillow/src/commercial-intelligence/` |
| Engine (legacy) | `pillow/src/commerce-intelligence/` (PILLOW-CI-001 — consolidated) |
| API | `GET /api/pillow/commercial-intelligence` |
| Dashboard | `empireai-web/components/cockpit/intelligence/CommercialIntelligenceDashboard.tsx` |
| Route | `/cockpit/commerce/intelligence` |
