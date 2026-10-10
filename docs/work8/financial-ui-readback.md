# Simulated financial owner readback

Existing Orders page consumes the optional `simulatedFinancials` response field only within its existing Isolated synthetic evidence tab. New `SimulatedFinancials.tsx` uses the approved journey table/card/details CSS and adds no fetch, route, controls or authority.

Product, progress, quoted revenue/COGS/freight and refund intent are visible. Charged fees/taxes, settlement, bank receipt and realised contribution remain Unknown without evidence. Simulation labels remain visible. Source identifiers and assumptions are in the existing closed technical-evidence dialog. Missing optional backend field renders no section; older backend compatibility is preserved.

Validation: three SSR tests pass under Node 22.23.2 with kernel egress denial. ESLint passes both edited TSX files. Local visual check renders an actual canonical synthetic-worker readback at 1440px desktop and 390px mobile: no horizontal overflow, no outbound requests, one correctly labelled order, no open evidence dialogs. Mobile screenshot manually inspected. These are component checks, not authenticated preview or production acceptance. Evidence: finance-local-visual-qa.json and finance-desktop.webp / finance-mobile.webp.
