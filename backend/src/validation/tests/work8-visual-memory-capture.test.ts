// Existing Work8 test glob executes the shared Pillow capture/materialization
// examination without a duplicate workflow or copied assertions.
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
const examination = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../pillow/src/validation/tests/visual-memory-recovery-capture.test.ts');
await import(pathToFileURL(examination).href);
