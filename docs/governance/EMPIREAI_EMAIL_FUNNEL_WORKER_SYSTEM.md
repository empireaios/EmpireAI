# EmpireAI Email Funnel Worker

PILLOW-EFW-001 / Q8-06 provides the Email Funnel Worker inside the Affiliate Factory.

The Email Funnel Worker creates complete affiliate email marketing funnel packages from approved Affiliate Opportunity Reports and SEO Content Reports. It generates lead magnets, email capture strategies, welcome and nurture sequences, funnel stages, and conversion-focused call-to-action strategies while preserving evidence and version history. It emits machine-readable Email Funnel Reports consumable by Q8-07 Analytics Worker.

The Email Funnel Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never sends live marketing emails, never manages email infrastructure, and never fabricates conversion or performance claims.

## Workflow

1. Consume Affiliate Opportunity Reports (from Q8-02).
2. Consume SEO Content Reports (`consumableByQ806` packages from Q8-05).
3. Generate lead magnet concepts aligned to topic/product evidence.
4. Generate email capture strategies (opt-in page concepts — not published live).
5. Define email funnel stages (awareness → capture → welcome → nurture → recommend → convert → reengage).
6. Generate welcome sequences and nurture/recommendation sequences.
7. Generate conversion-focused call-to-action strategies without fabricated rates.
8. Maintain funnel version history.
9. Produce an Email Funnel Report (`EFW-RPT-v1` / `EFW-001-v1`) with `consumableByQ807: true`.
10. Submit findings through the Executive Reporting Runtime and preserve audit history.

## Integrations

- Affiliate Factory Core
- Affiliate Opportunity Worker
- Review Content Worker
- SEO Content Worker
- Worker Registry
- Worker Lifecycle
- Executive Reporting Runtime
- Worker Recovery System
- Audit Runtime (optional)

## Boundaries

The Email Funnel Worker:

- **does** create lead magnets, email sequences, nurturing funnels, CTA strategies, and Email Funnel Reports from evidence
- does **not** send live marketing emails
- does **not** manage email infrastructure
- does **not** fabricate conversion or performance claims
- does **not** replace Analytics Worker
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** bypass Grand King approval
- does **not** implement Q8-07 or later

## Evidence discipline

Lead magnets and sequences are derived from opportunity, SEO, and optional review fixtures. No open rates, click rates, or conversion percentages are invented. An empty evidence set yields thinner offers and outstanding issues rather than fabricated performance claims.
