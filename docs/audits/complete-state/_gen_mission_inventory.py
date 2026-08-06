"""Generate Complete State mission inventory from audit packs (evidence-first)."""
from __future__ import annotations

import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
AUDITS = ROOT / "docs" / "audits"
PILLOW = AUDITS / "pillow"


def classify_pack(folder: Path, programme: str) -> dict:
    name = folder.name
    docs = (
        list(folder.glob("*CERTIFICATION*.md"))
        + list(folder.glob("CERTIFICATION_PACK.md"))
        + list(folder.glob("Q*_*.md"))
        + list(folder.glob("X*_*.md"))
        + list(folder.glob("*_CERTIFICATION.md"))
        + list(folder.glob("*EVIDENCE*.json"))
    )
    # Prefer human-readable cert/report md
    preferred = [p for p in docs if p.suffix == ".md"]
    evidence_file = preferred[0] if preferred else (docs[0] if docs else None)
    evidence = (
        str(evidence_file.relative_to(ROOT)).replace("\\", "/")
        if evidence_file
        else str(folder.relative_to(ROOT)).replace("\\", "/")
    )
    title = name
    if preferred:
        try:
            first = preferred[0].read_text(encoding="utf-8", errors="ignore").splitlines()[0]
            t = first.lstrip("#").strip()
            if t:
                title = t[:140]
        except OSError:
            pass
    # Audit pack / evidence present => COMPLETED at mission-pack level.
    # Live commerce activation is a separate enterprise capability classification.
    cls = "COMPLETED" if docs else "PARTIALLY_IMPLEMENTED"
    notes = "Mission audit pack present; external live activation assessed separately."
    return {
        "id": name,
        "programme": programme,
        "title": title,
        "classification": cls,
        "evidencePath": evidence,
        "notes": notes,
    }


def main() -> None:
    missions: list[dict] = []

    for prog, folder, title in [
        ("PRE-G", "pre-g-foundation", "PRE-G Foundation"),
        ("G", "g-phase", "G Phase"),
        ("P", "p-phase", "P Phase"),
        ("E", "e-phase", "E Phase"),
        ("T", "t-phase", "T Phase"),
        ("R", "r-phase", "R Phase"),
        ("X", "x-phase", "X Phase"),
        ("Q", "q-phase", "Q Phase"),
    ]:
        p = AUDITS / folder
        certs = list(p.glob("*CERTIFICATION*.md")) if p.exists() else []
        missions.append(
            {
                "id": f"{prog}-PHASE",
                "programme": prog,
                "title": title,
                "classification": "COMPLETED" if certs else "MISSING",
                "evidencePath": (
                    str(certs[0].relative_to(ROOT)).replace("\\", "/")
                    if certs
                    else f"docs/audits/{folder}"
                ),
                "notes": "Programme closer certification",
            }
        )

    if PILLOW.exists():
        for d in sorted(PILLOW.iterdir()):
            if not d.is_dir():
                continue
            name = d.name
            if re.match(r"q\d+-", name):
                missions.append(classify_pack(d, "Q"))
            elif re.match(r"x\d+-", name):
                missions.append(classify_pack(d, "X"))
            elif name.startswith("eesae"):
                missions.append(classify_pack(d, "EESAE"))
            elif name in {
                "executive-judgement",
                "executive-learning-memory",
                "executive-startup-readiness",
                "high-availability",
            }:
                missions.append(classify_pack(d, "POST-Q"))

    for folder, prog, title in [
        ("digital-soul", "DSV2", "Digital Soul V2"),
        ("pillow-shell", "UX-SHELL", "Pillow UX Operating Shell"),
        ("enterprise-restoration", "RESTORATION", "Enterprise Restoration"),
        ("auth", "AUTH", "Grand King Auth / Login Recovery"),
        ("mission-queue", "X", "Mission Queue Continuity"),
    ]:
        p = AUDITS / folder
        if not p.exists():
            missions.append(
                {
                    "id": folder,
                    "programme": prog,
                    "title": title,
                    "classification": "MISSING",
                    "evidencePath": f"docs/audits/{folder}",
                    "notes": "Audit folder missing",
                }
            )
            continue
        certs = (
            list(p.rglob("*CERT*.md"))
            + list(p.rglob("*COMPLETION*.md"))
            + list(p.rglob("*REPORT*.md"))
            + list(p.rglob("*VERIFICATION*.md"))
        )
        missions.append(
            {
                "id": folder,
                "programme": prog,
                "title": title,
                "classification": "COMPLETED" if certs else "PARTIALLY_IMPLEMENTED",
                "evidencePath": (
                    str(certs[0].relative_to(ROOT)).replace("\\", "/")
                    if certs
                    else f"docs/audits/{folder}"
                ),
                "notes": "Post-programme / cross-cutting capability",
            }
        )

    # Explicit non-missions
    # K Series intentionally skipped — not inventoried as MISSING.

    seen: set[str] = set()
    uniq: list[dict] = []
    duplicated = 0
    for m in missions:
        if m["id"] in seen:
            duplicated += 1
            continue
        seen.add(m["id"])
        uniq.append(m)

    # Spot-check known empty-shell candidates (marketing demo)
    empty_shells = [
        {
            "path": "empireai-web/components/cockpit/widgets/commerce/commerceMarketingDemoData.ts",
            "severity": "MEDIUM",
            "reason": "Commerce marketing panel imports demo data module — display may be non-operational",
            "classification_impact": "Does not demote Q3 mission packs; marks Commerce Marketing UI as display-limited",
        },
        {
            "path": "backend/src/runtime/marketplace-publishing/models/marketplace-adapter.ts",
            "severity": "HIGH",
            "reason": "supportsPublish defaults false until LIVE_COMMERCE_INTEGRATION_MODE=production + Amazon credentials",
            "classification_impact": "Amazon live publish READY_AFTER_GRAND_KING_ACTION / credential+flag gated",
        },
    ]

    totals = Counter(m["classification"] for m in uniq)
    # Account for skipped duplicates in totals if we want — report separately
    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "totals": dict(totals),
        "duplicateIdsSkipped": duplicated,
        "totalMissions": len(uniq),
        "kSeries": "INTENTIONALLY_SKIPPED_BY_APPROVED_DECISION",
        "emptyShellFindings": empty_shells,
        "missions": uniq,
    }
    out_path = Path(__file__).with_name("_MISSION_INVENTORY.json")
    out_path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print("total", len(uniq), "totals", dict(totals), "dupSkipped", duplicated)


if __name__ == "__main__":
    main()
