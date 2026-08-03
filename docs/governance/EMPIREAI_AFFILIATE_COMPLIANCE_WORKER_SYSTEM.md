# EmpireAI Affiliate Compliance Worker

PILLOW-ACW-001 / Q8-08 provides the Affiliate Compliance Worker inside the Affiliate Factory.

The Affiliate Compliance Worker validates that affiliate businesses comply with evidenced affiliate programme requirements, disclosure obligations, platform policies, and internal governance before launch or publication. It identifies compliance issues from verifiable evidence, generates remediation recommendations, preserves compliance audit history, and emits machine-readable Affiliate Compliance Reports consumable by Q8-09 Affiliate Certification.

The Affiliate Compliance Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never fabricates compliance results, never provides unverified legal conclusions, never publishes affiliate content, and never automatically approves non-compliant assets.

## Workflow

1. Consume Affiliate Opportunity Reports from Q8-02.
2. Consume Review Content Reports from Q8-04.
3. Consume SEO Content Reports from Q8-05.
4. Validate affiliate disclosures against evidenced disclosure signals.
5. Validate platform policy compliance against evidenced acknowledgements.
6. Validate required disclaimers against evidenced disclaimer text/presence.
7. Detect potential compliance violations and classify policy findings.
8. Recommend corrective actions without publishing or modifying live assets.
9. Assess approval readiness (operational readiness only — not legal approval).
10. Produce an Affiliate Compliance Report (`ACW-RPT-v1` / `ACW-001-v1`) with `consumableByQ809: true`.
11. Submit findings through the Executive Reporting Runtime and preserve audit history.

## Integrations

- Affiliate Factory Core
- Affiliate Opportunity Worker
- Comparison Site Worker
- Review Content Worker
- SEO Content Worker
- Email Funnel Worker
- Analytics Worker
- Executive Reporting Runtime
- Audit Runtime
- Worker Registry
- Worker Lifecycle
- Worker Recovery System

## Boundaries

The Affiliate Compliance Worker:

- DOES validate disclosures, platform rules, and disclaimers from evidence.
- DOES recommend remediation and produce compliance reports.
- DOES NOT publish affiliate content.
- DOES NOT replace legal professionals or provide legal advice.
- DOES NOT override programme requirements, approved architecture, Pillow, or Grand King.
- DOES NOT implement Q8-09 or later.
