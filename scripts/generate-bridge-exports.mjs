import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const indexPath = path.join(repoRoot, "pillow/src/index.ts");
let index = fs.readFileSync(indexPath, "utf8");

// Remove failed export * appendix
const marker = "// --- PRE-G recertification: targeted bridge exports ---";
const markerIdx = index.indexOf(marker);
if (markerIdx >= 0) {
  index = index.slice(0, markerIdx).trimEnd() + "\n";
  fs.writeFileSync(indexPath, index);
  console.log("Removed auto-appended export section");
}

const bridgeDir = path.join(repoRoot, "backend/src/orchestration/pillow-host");
const importRe =
  /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]@empireai\/pillow['"]/g;

function collectImports(filePath, needed) {
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
  collectImports(path.join(bridgeDir, file), needed);
}
for (const extra of [
  "backend/src/orchestration/pillow-host/pillow-host.ts",
  "backend/src/orchestration/pillow-host/types.ts",
  "backend/src/orchestration/pillow-host/brain-llm-adapter.ts",
]) {
  collectImports(path.join(repoRoot, extra), needed);
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
console.log(`Missing symbols for bridges: ${missing.length}`);

const pillowSrc = path.join(repoRoot, "pillow/src");
const symbolExportRe =
  /export\s+(?:type\s+)?(?:\{[^}]*\bSYMBOL\b[^}]*\}|(?:type\s+)?(?:const|function|class)\s+SYMBOL\b)/;

function findSymbolModule(symbol) {
  const dirs = fs.readdirSync(pillowSrc, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const dir of dirs) {
    const modDir = path.join(pillowSrc, dir.name);
    const files = walkTs(modDir);
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const re = new RegExp(
        `export\\s+(?:type\\s+)?(?:\\{[^}]*\\b${symbol}\\b[^}]*\\}|(?:type\\s+)?(?:const|function|class)\\s+${symbol}\\b)`,
      );
      if (re.test(content)) {
        const rel = path.relative(pillowSrc, file).replace(/\\/g, "/");
        const mod = dir.name;
        if (fs.existsSync(path.join(modDir, "index.ts"))) {
          return `./${mod}/index.js`;
        }
        return `./${rel.replace(/\.ts$/, ".js")}`;
      }
    }
  }
  return null;
}

function walkTs(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== "validation" && ent.name !== "cli") {
      out.push(...walkTs(p));
    } else if (ent.isFile() && ent.name.endsWith(".ts")) {
      out.push(p);
    }
  }
  return out;
}

const byModule = new Map();
const unresolved = [];
for (const symbol of missing) {
  const mod = findSymbolModule(symbol);
  if (!mod) {
    unresolved.push(symbol);
    continue;
  }
  if (!byModule.has(mod)) byModule.set(mod, []);
  byModule.get(mod).push(symbol);
}

console.log(`Resolved ${missing.length - unresolved.length} symbols across ${byModule.size} modules`);
if (unresolved.length) {
  console.log("Unresolved:", unresolved.slice(0, 20).join(", "));
}

const lines = [
  "",
  "// --- PRE-G recertification: bridge-required barrel exports ---",
];
for (const [mod, symbols] of [...byModule.entries()].sort()) {
  const items = symbols
    .map((s) => {
      // Heuristic: PascalCase or ends with Type/State/Report/Configuration/Input = type export
      const isType =
        /^[A-Z]/.test(s) &&
        !s.startsWith("create") &&
        !s.startsWith("build") &&
        !s.startsWith("reset") &&
        !s.startsWith("assemble") &&
        !s.startsWith("run") &&
        !s.startsWith("get") &&
        !s.startsWith("DEFAULT_") &&
        !/^[A-Z][A-Z0-9_]+$/.test(s);
      return isType ? `type ${s}` : s;
    })
    .join(",\n  ");
  lines.push(`export {\n  ${items},\n} from "${mod}";`);
}
lines.push("");

fs.writeFileSync(indexPath, index.trimEnd() + lines.join("\n") + "\n");
console.log(`Appended ${byModule.size} explicit export blocks`);
