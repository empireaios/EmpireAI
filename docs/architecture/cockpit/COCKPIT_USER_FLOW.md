# Cockpit User Flow

**Mission:** REAL-079  
**Authority:** Grand King Executive Directive  
**Status:** V1 design — user flows and daily workflow  
**Version:** 1.0  

---

## 1. Personas

| Persona | Role | Primary Cockpit surfaces |
|---------|------|------------------------|
| **Grand King** | Founder / sovereign operator | Home, Command, Missions, Commerce, Finance |
| **Sentinel Admin** | Platform operator | Infrastructure Admin, AI Workforce Audit, Development |
| **Operator** | Day-to-day ops | Operations, Commerce (read), Intelligence (read) |

This document centers on **Grand King** daily workflow.

---

## 2. Grand King Daily Workflow

### 2.1 Overview

Grand King operates EmpireAI in **four daily modes**:

```
Morning Pulse → Command Session → Mission Triage → Department Deep Work
     │                │                  │                    │
  Executive Home   Command Centre    Mission Centre      Commerce / Finance / etc.
  (5–10 min)       (15–30 min)       (10–20 min)         (as needed)
```

### 2.2 Timeline (canonical day)

```mermaid
gantt
    title Grand King Daily Cockpit Workflow
    dateFormat HH:mm
    axisFormat %H:%M

    section Morning
    Login → Executive Home     :07:00, 10m
    Review pulse + KPIs        :07:05, 5m

    section Command
    Command Centre briefing    :07:15, 20m
    AI CEO decisions           :07:25, 10m

    section Missions
    Mission Centre triage      :07:45, 15m
    Approve Pillow / fulfillment :07:50, 10m

    section Deep Work
    Commerce / Launch          :08:00, 60m
    Intelligence scan          :09:00, 30m
    Finance check              :09:30, 15m

    section Afternoon
    Mission Centre check-in    :14:00, 10m
    Operations / orders        :14:15, 30m

    section Evening
    Executive Home EOD pulse   :18:00, 5m
    Governance / V1 blockers   :18:05, 10m
```

### 2.3 Step-by-step: Morning Pulse

```mermaid
flowchart TD
    A[Login /auth] --> B{Session valid?}
    B -->|No| A
    B -->|Yes| C[Executive Home /cockpit]
    C --> D[Scan 4 primary KPIs]
    D --> E{V1 blockers?}
    E -->|Yes| F[V1 Blocker Strip → Infrastructure or Governance]
    E -->|No| G{Urgent missions > 0?}
    G -->|Yes| H[Mission Centre /cockpit/missions]
    G -->|No| I[Command Centre /cockpit/command]
    F --> H
```

**Grand King questions answered in 30 seconds:**

1. Am I profitable today? → K-E-003 Profit Today  
2. Is anything on fire? → Mission queue + V1 strip  
3. Are agents working? → SSE activity + K-E-006  
4. What needs my brain? → Pending decisions count  

### 2.4 Step-by-step: Command Session

```mermaid
flowchart TD
    A[Command Centre] --> B[Read AI CEO briefing]
    B --> C[Review priority stack]
    C --> D{Pending decisions?}
    D -->|Yes| E[Approve / Deny each]
    D -->|No| F[Review portfolio table]
    E --> F
    F --> G{Company needs action?}
    G -->|Manufacture| H[Commerce → Store]
    G -->|Scale ads| I[Commerce → Ads]
    G -->|Investigate product| J[Intelligence → Products]
    G -->|None| K[Return Home or Missions]
```

### 2.5 Step-by-step: Mission Triage

```mermaid
flowchart TD
    A[Mission Centre] --> B[Filter: Urgent]
    B --> C{Mission type?}
    C -->|AI CEO decision| D[Inline approve/deny]
    C -->|Pillow Cursor| E[Review diff → Approve/Deny]
    C -->|Fulfillment| F[Operations panel → Approve]
    C -->|V1 blocker| G[Infrastructure → Connect]
    C -->|Notification| H[Acknowledge / Open link]
    D --> I{More urgent?}
    E --> I
    F --> I
    G --> I
    H --> I
    I -->|Yes| B
    I -->|No| J[Filter: Pending → schedule or delegate]
```

---

## 3. Core User Flows

### 3.1 Flow: Manufacture a new company

```mermaid
flowchart LR
    subgraph Intelligence
        A1[Products tab] --> A2[Scan / Scout]
        A2 --> A3[Select opportunity]
    end
    subgraph Commerce
        B1[Store tab] --> B2[Create company]
        B2 --> B3[Manufacture]
        B3 --> B4[Preview storefront]
        B4 --> B5[Deploy]
    end
    subgraph Operations
        C1[Orders tab] --> C2[First order flow]
    end
    subgraph Finance
        D1[Profit tab] --> D2[Verify ledger]
    end
    A3 --> B1
    B5 --> C1
    C2 --> D1
```

| Step | Screen | Action | Brain |
|------|--------|--------|-------|
| 1 | Intelligence → Products | Run scan | `intelligence:scan` |
| 2 | Commerce → Store | Create company | `store:create` |
| 3 | Commerce → Store | Manufacture | `store:manufacture` |
| 4 | Commerce → Store | Preview | `store:get_storefront` |
| 5 | Infrastructure → Deployments | Deploy | `production-deploy:execute_vercel` |
| 6 | Operations → Orders | Monitor | `orders:load` |

### 3.2 Flow: First revenue (Grand King path)

```mermaid
flowchart TD
    A[Infrastructure → Integrations] --> B[Connect Stripe + CJ]
    B --> C[Commerce → Store → Deployed URL]
    C --> D[Share checkout link / test purchase]
    D --> E[Operations → Orders → Fulfillment]
    E --> F[Founder approve fulfillment]
    F --> G[Finance → Profit → Verify ledger]
    G --> H[Executive Home → Profit Today updates]
```

### 3.3 Flow: Approve autonomous ad spend

```mermaid
sequenceDiagram
    participant GK as Grand King
    participant MC as Mission Centre
    participant CC as Command Centre
    participant Brain as Brain / Taylor

    Brain->>MC: L3 mission: Adjust budget +$500
    GK->>MC: Open urgent mission
    MC->>GK: Show rationale + company context
    alt Approve
        GK->>Brain: ai-ceo:approve or ads:optimize
        Brain->>MC: Mission completed
    else Deny
        GK->>Brain: Deny with note
        Brain->>MC: Mission closed
    end
    GK->>CC: Verify ROAS in Ads panel
```

### 3.4 Flow: Pillow Cursor mission

```mermaid
sequenceDiagram
    participant GK as Grand King
    participant Pillow as Pillow Companion
    participant MC as Mission Centre
    participant Dev as Development tab

    Pillow->>Brain: Register cursor_mission_execution
    Brain->>MC: New Pillow approval mission
    GK->>MC: Review mission card
    GK->>Dev: Open approval detail (evidence, missionId)
    alt Approve
        GK->>Pillow: Approve → Cursor executes
    else Deny
        GK->>Pillow: Deny → mission cancelled
    end
```

### 3.5 Flow: End-of-day governance check

```mermaid
flowchart TD
    A[Executive Home EOD] --> B[Check Profit Today vs morning]
    B --> C[Governance → V1 Certification]
    C --> D{Blockers increased?}
    D -->|Yes| E[Mission Centre → schedule fix]
    D -->|No| F[AI Workforce → review dispatches]
    F --> G[Logout or Pillow debrief]
```

---

## 4. Entry Points

| Entry | Destination | Condition |
|-------|-------------|-----------|
| Login success | Executive Home | Default all roles |
| Post-login (founder) | Executive Home | `post-login-destination` |
| Deep link `/cockpit/missions?id=` | Mission detail | Notification click |
| Deep link `/cockpit/commerce/store?company=` | Store detail | Activity feed |
| Pillow "Go to screen" | Contextual department | Screen context map |
| V1 blocker click | Governance → V1 | Blocker strip |

---

## 5. Navigation Flow Patterns

### 5.1 Hub-and-spoke

Grand King rarely browses sidebar linearly. Pattern:

```
Home → (issue detected) → Department → (action) → Mission Centre → Home
```

### 5.2 Mission-driven

```
Notification / Approval bar → Mission Centre → Target department → Back
```

### 5.3 Command-driven

```
Command Centre → Decision → Commerce/Finance/Intelligence → Command Centre
```

---

## 6. Error & Empty States

| State | Screen | Grand King message | CTA |
|-------|--------|-------------------|-----|
| Not authenticated | Any | Session expired | Login |
| Brain unreachable | Any | Brain API unavailable | Retry · Status |
| No companies | Command / Commerce | No ventures yet | Intelligence → Create |
| No missions | Mission Centre | All clear — empire running | Command Centre |
| Demo data mode | Any department | Demo data — connect integrations | Infrastructure |
| Sandbox fulfillment | Operations | Sandbox mode active | Connect CJ (live) |
| Operator denied | Finance | Insufficient permissions | Home |

---

## 7. Mobile / Tablet Flow (V1.1)

Grand King mobile is **Mission-first**, not department-deep:

```
Mobile landing → Mission Centre (urgent only)
              → Executive Home (KPI strip vertical)
              → Pillow FAB (primary action)
```

Department deep work deferred to desktop.

---

## 8. Keyboard Shortcuts (V1.1)

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Pillow Companion |
| `⌘M` | Mission Centre |
| `⌘H` | Executive Home |
| `⌘⇧C` | Command Centre |
| `g then m` | Go to Missions (vim-style, optional) |

---

## 9. Flow → Screen Map Index

| Flow | Primary screens | Document |
|------|-----------------|----------|
| Daily workflow | Home, Command, Missions | This doc §2 |
| Manufacture company | Intelligence, Commerce, Ops, Finance | §3.1 |
| First revenue | Infrastructure, Commerce, Ops, Finance | §3.2 |
| Ad approval | Missions, Command, Commerce/Ads | §3.3 |
| Pillow mission | Missions, Development | §3.4 |
| EOD governance | Home, Governance, Workforce | §3.5 |

Full screen inventory: `COCKPIT_SCREEN_MAP.md`

---

## 10. Success Metrics (UX)

| Metric | Target | Measures |
|--------|--------|----------|
| Time to first KPI on Home | < 3s | Performance |
| Morning pulse completion | < 10 min | Session analytics |
| Mission resolution rate | > 90% same day | Mission Centre |
| Clicks to approve decision | ≤ 3 | Mission flow |
| Department depth sessions | ≥ 2/day on active launch days | Navigation analytics |

---

*REAL-079 — Cockpit User Flow v1.0*
