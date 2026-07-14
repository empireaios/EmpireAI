import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const indexPath = path.join(repoRoot, "pillow/src/index.ts");
let index = fs.readFileSync(indexPath, "utf8");

const exported = new Set();
const exportFromRe = /export\s*\{([^}]+)\}/g;
let em;
while ((em = exportFromRe.exec(index))) {
  for (const part of em[1].split(",")) {
    const t = part.trim();
    const name = (t.startsWith("type ") ? t.slice(5) : t)
      .split(/\s+as\s+/)
      .pop()
      .trim();
    if (name) exported.add(name);
  }
}

// Modules referenced in TS2742 errors from backend build
const modules = `ai-evolution-architecture
architecture-evolution-architecture
autonomous-decision-monitor
builder-console
business-automation
business-factory
capital-allocation-engine
capital-risk-engine
cash-reserve-intelligence
cockpit-ux-architecture
commerce-operating-model
commercial-intelligence
competitor-intelligence-engine
conflict-resolution-engine
corporate-vision-engine
cost-optimization-engine
crisis-decision-engine
cross-business-intelligence
customer-behaviour-intelligence
decision-audit-engine
decision-simulation-engine
department-planning-engine
empire-evolution-architecture
enterprise-audit-engine
enterprise-constitutional-guardian
enterprise-governance-framework
enterprise-pattern-engine
enterprise-risk-governance
enterprise-valuation-engine
executive-accountability-engine
executive-advisory-engine
executive-approval-intelligence
executive-architecture-framework
executive-benchmark-engine
executive-budget-planner
executive-calendar-engine
executive-capital-strategy
executive-compliance-engine
executive-confidence-engine
executive-consensus-engine
executive-constitutional-monitor
executive-decision-architecture
executive-decision-certification
executive-dependency-engine
executive-escalation-engine
executive-ethics-engine
executive-exception-manager
executive-finance-framework
executive-forecast-intelligence
executive-governance-certification
executive-insight-engine
executive-intelligence-certification
executive-knowledge-graph
executive-kpi-engine
executive-performance-dashboard
executive-planning-certification
executive-planning-dashboard
executive-policy-engine
executive-policy-evolution
executive-prediction-engine
executive-recommendation-engine
executive-resilience-engine
executive-review-board
executive-roadmap-engine
executive-scenario-planner
executive-transparency-engine
executive-trust-engine
explainability
financial-executive-certification
financial-scenario-engine
grand-king-executive-cockpit
grand-king-operating-account
industry-intelligence-engine
initiative-portfolio-engine
innovation-intelligence-engine
investment-evaluation-engine
knowledge-evolution-architecture
live-eta
long-term-growth-planner
market-intelligence-engine
opportunity-discovery-engine
opportunity-prioritization-engine
priority-management-engine
profit-optimization-engine
repository-evolution-architecture
resource-allocation-engine
risk-assessment-engine
roi-intelligence-engine
strategic-alignment-monitor
strategic-objective-engine
threat-detection-engine
trade-off-analysis-engine`.split("\n");

function extractTypeExports(modIndexContent) {
  const types = new Set();
  const typeBlockRe = /export\s+type\s*\{([^}]+)\}/g;
  let m;
  while ((m = typeBlockRe.exec(modIndexContent))) {
    for (const part of m[1].split(",")) {
      const name = part.trim();
      if (name) types.add(name);
    }
  }
  const singleTypeRe = /export\s+type\s+(\w+)/g;
  while ((m = singleTypeRe.exec(modIndexContent))) {
    types.add(m[1]);
  }
  return [...types];
}

const blocks = [];
for (const mod of modules) {
  const modIndex = path.join(repoRoot, "pillow/src", mod, "index.ts");
  if (!fs.existsSync(modIndex)) continue;
  const content = fs.readFileSync(modIndex, "utf8");
  const types = extractTypeExports(content).filter((t) => !exported.has(t));
  if (types.length === 0) continue;
  blocks.push(
    `export {\n  ${types.map((t) => `type ${t}`).join(",\n  ")},\n} from "./${mod}/index.js";`,
  );
}

// LifecycleEventType for pillow-routes inline import
if (!exported.has("LifecycleEventType")) {
  blocks.push(
    `export { type LifecycleEventType } from "./amazon-order-management/index.js";`,
  );
}

if (blocks.length === 0) {
  console.log("No additional type exports needed");
  process.exit(0);
}

const appendix = [
  "",
  "// --- PRE-G recertification: portable bridge return types ---",
  ...blocks,
  "",
].join("\n");

fs.writeFileSync(indexPath, index.trimEnd() + appendix);
console.log(`Appended ${blocks.length} type export blocks`);
