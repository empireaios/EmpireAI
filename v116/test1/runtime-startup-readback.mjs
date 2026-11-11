import fs from 'node:fs';
import path from 'node:path';
const root = process.env.RAILWAY_VOLUME_MOUNT_PATH;
if (process.env.WORK8_MEMBERSHIP_ROLE !== 'startup-readback' || !root) throw Error('STARTUP_ADMISSION_REQUIRED');
const ledger = path.join(root, 'commissioning', 'openai-october-2026.sqlite');
if (fs.existsSync(ledger)) {
  const {writeInferenceReadback} = await import('../backend/dist/brain/llm/inference-readback.js');
  writeInferenceReadback(ledger, 'startup-readback', 'none', []);
}
if(process.env.WORK8_V116_ENROLLMENT_FILE||process.env.WORK8_V116_ENROLLMENT_SHA256){const {enrollIfDeclared}=await import('./v116-enrollment-entry.mjs');await enrollIfDeclared();}
process.exit(0);
