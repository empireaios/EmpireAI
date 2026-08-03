# EmpireAI Channel Recommendation Worker

PILLOW-CRW-001 / Q4-17 provides the Channel Recommendation Worker.

The Channel Recommendation Worker analyses channel opportunities from Trend Research Worker, Media Analytics Worker, and Media Learning Worker outputs. It scores audience potential, revenue potential, production feasibility, competition, strategic fit, and content sustainability, then ranks opportunities and recommends Proceed, Monitor, or Reject — as structural recommendation signals only. It does **not** create channels automatically, configure platform accounts, or publish content.

## Authority

The Channel Recommendation Worker:

- operates as an isolated AI Worker (analyst) within the Media Factory
- receives trend research from the Trend Research Worker
- receives media analytics from the Media Analytics Worker
- receives media learning outputs from the Media Learning Worker
- analyses audience potential, revenue potential, production feasibility, competition, strategic fit, and expected content sustainability
- ranks channel opportunities by overall evidence-weighted score
- recommends Proceed, Monitor, or Reject with explained rationale
- bases every recommendation on evidence and distinguishes facts from assumptions
- preserves complete source traceability and audit history
- produces machine-readable Channel Recommendation Reports
- submits reports through the Executive Reporting Runtime
- operates autonomously under Pillow governance

## Boundaries

The Channel Recommendation Worker never:

- creates channels automatically
- configures platform accounts
- publishes content
- overrides Pillow
- overrides Grand King
- implements Q4-18 or later

## Mandatory rules

- Base recommendations on evidence
- Preserve complete source traceability
- Distinguish facts from assumptions
- Explain every recommendation
- Preserve audit history
- Submit reports through the Executive Reporting Runtime
- Never create channels automatically
- Structural recommendation signals only — await Pillow / Grand King decision
