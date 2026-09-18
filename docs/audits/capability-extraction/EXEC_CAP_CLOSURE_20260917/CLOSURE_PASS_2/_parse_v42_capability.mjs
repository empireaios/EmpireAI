import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.dirname(fileURLToPath(import.meta.url));
const unzip = path.join(OUT, "_v42_unzip");
const sharedRaw = readFileSync(path.join(unzip, "xl/sharedStrings.xml"), "utf8");
// Flatten si blocks — may contain multiple <t>
const sis = [...sharedRaw.matchAll(/<si>([\s\S]*?)<\/si>/g)];
const strings = sis.map((m) => {
  const parts = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) =>
    t[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))),
  );
  return parts.join("");
});

const workbook = readFileSync(path.join(unzip, "xl/workbook.xml"), "utf8");
const sheetNames = [...workbook.matchAll(/name="([^"]+)"/g)].map((m) =>
  m[1].replace(/&amp;/g, "&"),
);

// Capability Master ≈ sheet11 by order
const capIdx = sheetNames.findIndex((n) => /capability\s*master/i.test(n));
const sheetFile = `sheet${capIdx >= 0 ? capIdx + 1 : 11}.xml`;
const sheetXml = readFileSync(path.join(unzip, "xl/worksheets", sheetFile), "utf8");
const cells = [...sheetXml.matchAll(/<c r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]+)")?[^>]*>(?:[\s\S]*?<v>([^<]*)<\/v>)?/g)];

function colToIdx(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

const rows = new Map();
for (const m of cells) {
  const col = m[1];
  const row = Number(m[2]);
  const t = m[3] || "";
  const v = m[4] ?? "";
  let val = v;
  if (t === "s") val = strings[Number(v)] ?? "";
  if (!rows.has(row)) rows.set(row, []);
  rows.get(row)[colToIdx(col)] = val;
}

const matrix = [...rows.entries()]
  .sort((a, b) => a[0] - b[0])
  .slice(0, 80)
  .map(([r, cols]) => ({ row: r, cells: cols.map((c) => (c == null ? "" : String(c))) }));

// Extract EC-like / capability IDs from all strings
const capabilityIds = [];
const idRe = /\b(?:EC[-_]?\d{1,3}|W1[-_]?T\d{1,3}|CAP[-_]?\d{1,3}|Birth[-_]?Gate[-_]?\d+)\b/gi;
for (const s of strings) {
  const hits = s.match(idRe);
  if (hits) for (const h of hits) capabilityIds.push(h.toUpperCase().replace(/_/g, "-"));
}
const uniqueCaps = [...new Set(capabilityIds)].sort();

const out = {
  sheetNames,
  capabilityMasterSheet: sheetNames[capIdx] || null,
  capabilityMasterFile: sheetFile,
  sharedStringCount: strings.length,
  uniqueCapabilityIdHints: uniqueCaps,
  capabilityMasterPreviewRows: matrix,
  sampleStrings: strings.filter((s) => s.trim().length > 4).slice(0, 120),
};
writeFileSync(path.join(OUT, "_v42_capability_parse.json"), JSON.stringify(out, null, 2));
console.log(
  JSON.stringify(
    {
      sheets: sheetNames.length,
      shared: strings.length,
      capSheet: out.capabilityMasterSheet,
      idHints: uniqueCaps.length,
      previewRows: matrix.length,
    },
    null,
    2,
  ),
);
