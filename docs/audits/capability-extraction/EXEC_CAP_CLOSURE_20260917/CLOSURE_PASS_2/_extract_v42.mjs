import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../../");
const OUT = path.join(
  ROOT,
  "docs/audits/capability-extraction/EXEC_CAP_CLOSURE_20260917/CLOSURE_PASS_2",
);
const V42 = "C:/Users/erlan/Downloads/EmpireAI_Pillow_Birth_Master_V42.xlsx";
const extractDir = path.join(OUT, "_v42_unzip");

mkdirSync(extractDir, { recursive: true });
const buf = readFileSync(V42);
const sha256 = createHash("sha256").update(buf).digest("hex");
const zipCopy = path.join(OUT, "_v42_copy.zip");
writeFileSync(zipCopy, buf);

execFileSync(
  "powershell",
  [
    "-NoProfile",
    "-Command",
    `Expand-Archive -LiteralPath '${zipCopy}' -DestinationPath '${extractDir}' -Force`,
  ],
  { stdio: "pipe" },
);

function readXml(rel) {
  const p = path.join(extractDir, rel);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}

const workbook = readXml("xl/workbook.xml") || "";
const sheetNames = [...workbook.matchAll(/name="([^"]+)"/g)].map((m) => m[1]);
const shared = readXml("xl/sharedStrings.xml") || "";
const strings = [...shared.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) =>
  m[1]
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"'),
);

// Sample first 200 unique non-trivial strings as capability cues
const cues = [];
const seen = new Set();
for (const s of strings) {
  const t = s.trim();
  if (t.length < 3 || t.length > 160) continue;
  const k = t.toLowerCase();
  if (seen.has(k)) continue;
  seen.add(k);
  cues.push(t);
  if (cues.length >= 250) break;
}

const summary = {
  path: V42,
  sha256,
  bytes: buf.length,
  sheetNames,
  sharedStringCount: strings.length,
  sampleCues: cues,
};
writeFileSync(path.join(OUT, "_v42_extract_summary.json"), JSON.stringify(summary, null, 2));
console.log(
  JSON.stringify(
    { sha256, sheets: sheetNames, sharedStringCount: strings.length, cueSample: cues.length },
    null,
    2,
  ),
);
