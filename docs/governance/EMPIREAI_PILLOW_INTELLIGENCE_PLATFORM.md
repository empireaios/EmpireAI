# EmpireAI Pillow Intelligence Platform Foundation

**Mission ID:** PILLOW-IP-001  
**Status:** Active  
**Layer:** Pillow · Executive Intelligence Platform

## Canonical Architecture

```
Soul File + EKLS + OpenAI Intelligence Platform + Marketplace APIs
+ Supplier APIs + Financial APIs + Communication APIs = Pillow
        ↓
   AI Workforce → Business Engines → Results → EKLS
```

## Intelligence Routing Priority

1. Soul File  
2. EKLS  
3. OpenAI General Intelligence  
4. OpenAI Web Search  
5. Marketplace APIs  
6. Supplier APIs  
7. Financial APIs  
8. Communication APIs  

Implementation: `pillow/src/intelligence-platform/intelligence-routing.ts`

## Capability Router

Maps executive intent to OpenAI capabilities or business integrations.

Implementation: `pillow/src/intelligence-platform/capability-router.ts`

## OpenAI Intelligence Platform

Capabilities: GPT Reasoning, General Knowledge, Web Search, File Search, File Analysis, Image Generation, Vision, Code Execution.

Implementation: `pillow/src/intelligence-platform/openai-platform.ts`

## Artifact System

Every capability execution creates a permanent EmpireAI Artifact stored in `.pillow/artifact-registry/artifacts.json`.

Implementation: `pillow/src/intelligence-platform/artifact-registry.ts`

## Executive Home UX

Full-height Executive Chat on `/cockpit` (Executive Home). Floating GlobalAiAssistantPanel hidden on Executive Home.

Implementation: `empireai-web/components/cockpit/executive/ExecutiveHomeChatWorkspace.tsx`

## API

- `GET /api/pillow/intelligence-platform` — artifact registry snapshot  
- Chat artifacts returned inline on `POST /api/pillow/chat`

## Knowledge Policies

- **Repository:** authoritative for EmpireAI facts — never fabricate  
- **General:** OpenAI model — no unnecessary live disclaimers for historical questions  
- **Live:** Web Search invoked automatically when current information is required
