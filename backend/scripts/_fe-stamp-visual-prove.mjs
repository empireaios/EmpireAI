import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const stamp = await (await fetch("https://empire-ai.co/api/eos-bundle-stamp")).json();
console.log("STAMP", JSON.stringify(stamp));
const advanced = String(stamp.gitCommitSha || "").startsWith("aa05941e") === false;
console.log("LIVE_FRONTEND_STAMP_ADVANCED", advanced);
console.log("SHA_PREFIX", String(stamp.gitCommitSha || "").slice(0, 8));

const md = readFileSync(
  new URL("../../empireai-web/lib/cockpit/executive/executive-chat-markdown.ts", import.meta.url),
  "utf8",
);
const comp = readFileSync(
  new URL("../../empireai-web/components/cockpit/executive/ExecutiveChatMarkdown.tsx", import.meta.url),
  "utf8",
);
const containsRepair =
  md.includes("splitInlineOrderedMarkers") &&
  md.includes("countInlineNextSectionOccurrences") &&
  comp.includes("space-y-5");
console.log("LOCAL_HEAD_CONTAINS_VISUAL_REPAIR", containsRepair);

const head = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
console.log("LOCAL_HEAD", head);
console.log("STAMP_MATCHES_HEAD", head.startsWith(String(stamp.gitCommitSha || "").slice(0, 8)) || String(stamp.gitCommitSha || "").startsWith(head.slice(0, 8)));

// Prove repair is ancestor of stamped commit via git
try {
  execSync("git merge-base --is-ancestor 5fe18502 HEAD", { stdio: "ignore" });
  console.log("VISUAL_REPAIR_COMMIT_IN_ANCESTRY", true);
} catch {
  console.log("VISUAL_REPAIR_COMMIT_IN_ANCESTRY", false);
}

// Search login + cockpit HTML for hashed chunks mentioning space-y-5 (best-effort)
const pages = ["https://empire-ai.co/login", "https://empire-ai.co/pillow-shell-preview"];
let found = false;
for (const url of pages) {
  const html = await (await fetch(url)).text();
  const chunks = [...html.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]);
  for (const c of [...new Set(chunks)].slice(0, 40)) {
    try {
      const js = await (await fetch(`https://empire-ai.co${c}`)).text();
      if (js.includes("space-y-5") && (js.includes("list-decimal") || js.includes("splitInline"))) {
        console.log("FOUND_MARKER_IN", c);
        found = true;
        break;
      }
    } catch {
      /* continue */
    }
  }
  if (found) break;
}
console.log("LIVE_BUNDLE_MARKER_FOUND", found);
