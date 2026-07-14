import fs from "fs";
import path from "path";

const bridgeDir = "backend/src/orchestration/pillow-host";
const indexPath = "pillow/src/index.ts";
const index = fs.readFileSync(indexPath, "utf8");

const importRe =
  /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]@empireai\/pillow['"]/g;

function collectImports(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  let m;
  while ((m = importRe.exec(content))) {
    for (const part of m[1].split(",")) {
      const name = part
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)[0]
        .trim();
      if (name) needed.add(name);
    }
  }
}

const needed = new Set();
for (const file of fs.readdirSync(bridgeDir).filter((f) => f.endsWith(".ts"))) {
  collectImports(path.join(bridgeDir, file));
}
for (const extra of [
  "backend/src/orchestration/pillow-host/pillow-host.ts",
  "backend/src/orchestration/pillow-host/pillow-routes.ts",
  "backend/src/orchestration/pillow-host/types.ts",
  "backend/src/orchestration/pillow-host/brain-llm-adapter.ts",
]) {
  collectImports(extra);
}

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

const missing = [...needed].filter((n) => !exported.has(n)).sort();
console.log(
  JSON.stringify(
    { needed: needed.size, exported: exported.size, missing: missing.length, symbols: missing },
    null,
    2,
  ),
);
