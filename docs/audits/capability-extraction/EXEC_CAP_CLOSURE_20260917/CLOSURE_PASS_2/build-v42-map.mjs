/**
 * Build V42_COMPATIBILITY_MAP.json from Capability Master sheet (inline str cells).
 * Explicitly NOT V53. WAVE_CREDIT=0.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.dirname(fileURLToPath(import.meta.url));
const xml = readFileSync(path.join(OUT, "_v42_unzip/xl/worksheets/sheet11.xml"), "utf8");

const rows = new Map();
for (const m of xml.matchAll(/<x:c r="([A-Z]+)(\d+)"[^>]*t="str"[^>]*><x:v>([^<]*)<\/x:v>/g)) {
  const col = m[1];
  const row = Number(m[2]);
  const val = m[3]
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  if (!rows.has(row)) rows.set(row, {});
  rows.get(row)[col] = val;
}

const caps = [];
for (const [row, cols] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
  const id = cols.A;
  if (!id || id === "ID" || !/^[A-Z]{2}-\d{2}$/.test(id)) continue;
  caps.push({
    id,
    domain: cols.B || "",
    capability: cols.C || "",
    whyBirthCritical: cols.D || "",
    priority: cols.E || "",
    workbookStatus: cols.F || "",
    nextAction: cols.N || "",
  });
}

/** Engineering evidence from EXEC_CAP_CLOSURE — not certification credit. */
const EVIDENCE = {
  TR_01: "held+driver factual grounding; FACT_PRECEDENCE",
  TR_03: "commercial arithmetic locks; ledger synthetic flag",
  TR_06: "correction supersession + 5d delivery parse",
  AU_01: "executive-authority-surface wired; live refuse",
  AU_02: "live listing refuse; action-permit",
  AU_05: "authority refuses supplier-born injection",
  JR_03: "correction supersession decision cases",
  CO_01: "candidate eval eligibility/ranking",
  CO_06: "NOT_BORN / unauthorized labels in contracts",
  ME_01: "session continuity in chat",
  ME_02: "durable pcr_* + operating-episode lessons",
  RT_02: "durable retrieve after pending; restart planned in soak",
  RT_03: "tier0 idempotent chat retries",
  SE_01: "UI harness secret-safe (no secret print)",
  FI_01: "synthetic budget stop in operating-episode",
  EX_01: "exact-line response contracts",
};

function mapStatus(cap) {
  const key = cap.id.replace("-", "_");
  const eng = EVIDENCE[key];
  if (cap.workbookStatus === "POST-BIRTH") {
    return {
      mapping: "POST_BIRTH_GAP",
      credit: "NONE",
      note: "Workbook marks post-Birth; synthetic mechanism only if tested",
      engineeringEvidence: eng || null,
    };
  }
  if (eng) {
    return {
      mapping: "MAPPED_ENGINEERING_EVIDENCE",
      credit: "NONE",
      note: "Mapped to engineering proof only — not Wave/Birth credit",
      engineeringEvidence: eng,
    };
  }
  return {
    mapping: "UNMAPPED",
    credit: "NONE",
    note: "No engineering proof mapped in this closure pass",
    engineeringEvidence: null,
  };
}

const requirements = caps.map((c) => ({ ...c, ...mapStatus(c) }));
const mapped = requirements.filter((r) => r.mapping === "MAPPED_ENGINEERING_EVIDENCE").length;
const unmapped = requirements.filter((r) => r.mapping === "UNMAPPED").length;
const postBirth = requirements.filter((r) => r.mapping === "POST_BIRTH_GAP").length;

const doc = {
  label: "V42_COMPATIBILITY_MAP",
  NOT_V53: true,
  v53Status: "NOT_FOUND",
  v42Path: "C:/Users/erlan/Downloads/EmpireAI_Pillow_Birth_Master_V42.xlsx",
  v42Sha256: "d84f79bd24dab9d6fb12b032ce2a0823b992ac6cd53690c382804049792bf91f",
  waveCredit: 0,
  birth: "NOT_BORN",
  sc01: "FROZEN",
  capabilityCount: requirements.length,
  counts: { mappedEngineering: mapped, unmapped, postBirthGap: postBirth },
  requirements,
};
writeFileSync(path.join(OUT, "V42_COMPATIBILITY_MAP.json"), JSON.stringify(doc, null, 2));
console.log(JSON.stringify(doc.counts, null, 2));
console.log("capabilities", requirements.length);
