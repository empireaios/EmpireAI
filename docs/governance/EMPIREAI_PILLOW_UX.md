# EmpireAI Pillow User Experience

**Mission ID:** P7-03  
**Status:** Active  
**Depends on:** P7-02 Executive Cockpit UX  
**Successor:** P7-06 Live ETA ✅ · P7-07 Explainability ✅ · P8-01 Factory

## Purpose

Pillow is **not a chatbot**. Pillow is the constitutional Executive Intelligence of EmpireAI.

The Grand King communicates naturally. Pillow understands the complete constitutional state without repetition and proactively guides, explains, recommends, and supervises.

## Canonical Architecture

```
Founder Shell + Executive Cockpit + Intelligence Platform + Context Builder
        =
PILLOW_USER_EXPERIENCE (P7-03)
        ↓
Executive Conversation · Proactive Guidance · Explainability · Memory
```

## Pillow UX Principles

Natural Conversation · Executive First · Context Aware · Vision Aware · Repository Aware · Production Aware · Journey Aware · Business Aware · Explain Before Acting · Never Lose Context · Never Require Repetition

## Context Awareness (Automatic)

Pillow receives constitutional context on every message via `workspaceContext`:

- Current business, mission, journey, roadmap item
- Builder, Supervisor, Production, Guardian status
- Pending approvals, alerts, recommendations, risks
- Screen path, navigation history, selected records

Sources: Founder Shell API · Brain cockpit context · Cockpit screen registry

## Proactive Guidance

Pillow proactively surfaces WHY · WHAT · HOW · PROOF guidance items from:

- Executive next action
- Founder Shell recommendations
- Alerts and risks
- Builder recovery signals
- Pending approvals

## Explainability

Every executive action prompt (`summarise`, `explain`, `recommend`, `next_action`) requires WHY · WHAT · HOW · PROOF · impacts · risk · benefit structure.

## Conversation Memory

- **Client:** localStorage via `pillow-session-store.ts`
- **Server:** `pillow-host` session `conversationHistory`
- **Hydration:** `GET /api/pillow/history` on session restore

## Implementation

| Layer | Path |
|-------|------|
| Pillow UX core | `empireai-web/lib/pillow-ux/` |
| Screen context | `empireai-web/lib/pillow-ux/screen-context.ts` |
| Context awareness | `empireai-web/lib/pillow-ux/context-awareness.ts` |
| Provider | `empireai-web/lib/cockpit/global-assistant/GlobalAiAssistantProvider.tsx` |
| Context panel | `empireai-web/components/cockpit/pillow/PillowContextPanel.tsx` |
| Proactive guidance | `empireai-web/components/cockpit/pillow/PillowProactiveGuidance.tsx` |
| Executive chat | `empireai-web/components/cockpit/executive/ExecutiveHomeChatWorkspace.tsx` |
| Backend context | `backend/src/orchestration/pillow-host/workspace-context.ts` |

## Validation Alignment

Vision · Soul · CTD · Constitution Hierarchy · Architecture · Repository · Production Truth · Founder Shell · Executive Cockpit · ECC · VIE · Supervisor · Journey
