# EmpireAI Market Research Worker

PILLOW-MRW-001 / Q2-04 provides the Market Research Worker inside the Empire Builder Factory.

The Market Research Worker performs comprehensive market research for every proposed business to determine whether sufficient market opportunity exists before additional business planning continues.

The Market Research Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix.

## Workflow

1. Receive a proposed business (intent and/or business model context).
2. Research market demand, market size, customer problems, and customer segments.
3. Research competitors, competitor strengths, and competitor weaknesses.
4. Research industry trends, opportunity size, barriers to entry, and market risks.
5. Produce a machine-readable Market Research Report (`MRW-RPT-v1` / `MRW-001-v1`).
6. Submit findings through the Executive Reporting Runtime and preserve audit history.

## Integrations

The worker integrates with:

- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Worker Performance Review
- Worker Recovery System

## Boundaries

The Market Research Worker:

- **does** research markets, analyse competitors, analyse customer demand, estimate opportunity size, and produce research reports
- does **not** decide whether to build the business
- does **not** generate branding
- does **not** build marketing plans
- does **not** launch businesses
- does **not** override Pillow
- does **not** override Grand King
- does **not** implement Q2-05 or later

## Market Research Report

Each report includes: Report ID, Timestamp, Business Build Mission ID, Business Type, Target Market, Customer Problems, Market Demand, Market Size, Competitor Analysis, Industry Trends, Opportunity Size, Risks, Confidence Score, Supporting Evidence, Recommendations, and Metadata Version (`MRW-001-v1`).

Findings must be evidence-based, distinguish facts from assumptions, identify missing information, and include confidence scores.

## Safety

Credentials and authentication tokens are never exposed. Full audit history is preserved. Sensitive values are masked in logs.
