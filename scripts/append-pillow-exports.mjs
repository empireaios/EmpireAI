import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const pillowSrc = path.join(repoRoot, "pillow/src");
const indexPath = path.join(pillowSrc, "index.ts");
const index = fs.readFileSync(indexPath, "utf8");

const referenced = new Set();
const refRe = /from\s+["']\.\/([^/"']+)(?:\/index)?\.js["']/g;
let m;
while ((m = refRe.exec(index))) referenced.add(m[1]);

const skip = new Set([
  "validation",
  "cli",
  "bootstrap",
  "context",
  "intelligence",
  "session",
]);

const subsystems = fs
  .readdirSync(pillowSrc, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((name) => {
    if (skip.has(name)) return false;
    return fs.existsSync(path.join(pillowSrc, name, "index.ts"));
  })
  .sort();

const missing = subsystems.filter((name) => !referenced.has(name));
console.log(`Referenced: ${referenced.size}, subsystems with index: ${subsystems.length}, missing: ${missing.length}`);

const blocks = missing.map(
  (name) => `export * from "./${name}/index.js";`,
);

if (blocks.length === 0) {
  console.log("No missing subsystem exports.");
  process.exit(0);
}

const appendix = [
  "",
  "// --- Auto-appended subsystem barrel exports (PRE-G recertification) ---",
  ...blocks,
  "",
].join("\n");

fs.writeFileSync(indexPath, index.trimEnd() + appendix);
console.log(`Appended ${blocks.length} export * blocks to index.ts`);
