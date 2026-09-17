import fs from "node:fs";
const p = "backend/.env";
let login = false;
let pass = false;
let model = false;
if (fs.existsSync(p)) {
  for (const line of fs.readFileSync(p, "utf8").split(/\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const k = m[1];
    const v = String(m[2] || "")
      .replace(/^["']|["']$/g, "")
      .trim();
    if (!v) continue;
    if (k === "EMPIRE_LOGIN_EMAIL" || k === "FOUNDER_EMAIL") login = true;
    if (k === "EMPIRE_LOGIN_PASSWORD" || k === "FOUNDER_PASSWORD") pass = true;
    if (k === "OPENAI_API_KEY" || k === "ANTHROPIC_API_KEY") model = true;
  }
}
console.log(
  JSON.stringify({
    envFile: fs.existsSync(p),
    loginEmailPresent: login,
    loginPasswordPresent: pass,
    modelKeyPresent: model,
  }),
);
