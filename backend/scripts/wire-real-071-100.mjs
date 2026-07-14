#!/usr/bin/env node
/** Wire REAL-071 → REAL-100 into app, brain, permissions, module-routes */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "..", "src");

const MODULES = [
  ["071", "global-supplier-market"],
  ["072", "global-marketplace-adapter-framework"],
  ["073", "marketplace-difference-engine"],
  ["074", "country-difference-engine"],
  ["075", "global-price-intelligence"],
  ["076", "shipping-intelligence"],
  ["077", "product-launch-commander"],
  ["078", "post-launch-commander"],
  ["079", "product-scale-engine"],
  ["080", "product-retirement-engine"],
  ["081", "empire-revenue-forecast"],
  ["082", "empire-cashflow-engine"],
  ["083", "empire-investment-engine"],
  ["084", "global-opportunity-board"],
  ["085", "executive-strategy-room"],
  ["086", "king-decision-history"],
  ["087", "soul-learning-review"],
  ["088", "empire-pattern-library"],
  ["089", "global-expansion-score"],
  ["090", "empire-priority-engine"],
  ["091", "command-center-polish"],
  ["092", "ux-review-preparation"],
  ["093", "performance-review"],
  ["094", "security-review"],
  ["095", "architecture-review"],
  ["096", "commercial-review"],
  ["097", "version-1-freeze-review"],
  ["098", "version-1-release-candidate"],
  ["099", "version-1-go-live-approval"],
  ["100", "version-1-completion"],
];

function pascal(slug) {
  return slug.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

function snake(slug) {
  return slug.replace(/-/g, "_");
}

// --- app.ts ---
const appPath = path.join(SRC, "app.ts");
let app = fs.readFileSync(appPath, "utf8");
for (const [, slug] of MODULES) {
  const registerFn = `register${pascal(slug)}Routes`;
  const importLine = `import { ${registerFn} } from "./runtime/${slug}/routes/${slug}-routes.js";`;
  if (!app.includes(importLine)) {
    app = app.replace(
      'import { registerExecutiveCouncilRoutes }',
      `${importLine}\nimport { registerExecutiveCouncilRoutes }`,
    );
  }
  const callLine = `  await ${registerFn}(app, { authenticate, auditLogger: brain.auditLogger });`;
  if (!app.includes(callLine)) {
    app = app.replace(
      "  await registerExecutiveCouncilRoutes(app, {",
      `${callLine}\n\n  await registerExecutiveCouncilRoutes(app, {`,
    );
  }
}
fs.writeFileSync(appPath, app);

// --- brain/index.ts ---
const brainPath = path.join(SRC, "brain", "index.ts");
let brain = fs.readFileSync(brainPath, "utf8");
function camelTools(slug) {
  const parts = slug.split("-");
  return parts[0] + parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("") + "Tools";
}

for (const [, slug] of MODULES) {
  const toolsExport = camelTools(slug);
  const importLine = `import { ${toolsExport} } from "../runtime/${slug}/tools/${slug}-tools.js";`;
  if (!brain.includes(importLine)) {
    brain = brain.replace(
      'import { executiveCouncilTools }',
      `${importLine}\nimport { executiveCouncilTools }`,
    );
  }
  const spreadLine = `    ...${toolsExport},`;
  if (!brain.includes(spreadLine)) {
    brain = brain.replace(
      "    ...executiveCouncilTools,",
      `${spreadLine}\n    ...executiveCouncilTools,`,
    );
  }
}
fs.writeFileSync(brainPath, brain);

// --- permissions.ts ---
const permPath = path.join(SRC, "auth", "permissions.ts");
let perm = fs.readFileSync(permPath, "utf8");
const moduleIds = MODULES.map(([, s]) => `"${s}"`).join(",\n    ");
for (const roleMarker of ['founder:', 'operator:', 'admin:']) {
  const needle = `${roleMarker}`;
  // insert before global-commerce-execution in each role block
  if (!perm.includes('"global-supplier-market"')) {
    perm = perm.replace(
      /("version-1-executive-sign-off",\n)(    "global-commerce-execution",)/g,
      `$1${moduleIds.split("\n").map((l) => "    " + l.trim()).join("\n")}\n$2`,
    );
  }
}
fs.writeFileSync(permPath, perm);

// --- module-routes.ts ---
const routesPath = path.join(SRC, "agents", "routes", "module-routes.ts");
let routes = fs.readFileSync(routesPath, "utf8");
const entries = MODULES.map(([, slug]) =>
  `  { module: "${slug}", action: "dashboard", toolName: "${snake(slug)}.dashboard" },`,
).join("\n");
if (!routes.includes('"global-supplier-market"')) {
  routes = routes.replace(
    '  { module: "executive-council", action: "registry"',
    `${entries}\n  { module: "executive-council", action: "registry"`,
  );
}
fs.writeFileSync(routesPath, routes);

console.log("Wiring complete for REAL-071 → REAL-100");
