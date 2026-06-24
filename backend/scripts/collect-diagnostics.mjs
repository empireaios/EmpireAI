import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, "tsconfig.json");
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const diagnostics = ts.getPreEmitDiagnostics(program);

const lines = diagnostics.map((d) => {
  if (d.file && d.start !== undefined) {
    const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
    const message = ts.flattenDiagnosticMessageText(d.messageText, "\n");
    return `${d.file.fileName}(${line + 1},${character + 1}): error TS${d.code}: ${message}`;
  }
  return `error TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`;
});

const output = `errorCount=${lines.length}\n\n${lines.join("\n")}\n`;
const logPath = path.join(root, "typecheck-log.txt");
fs.writeFileSync(logPath, output, "utf8");
console.log(output);
process.exit(lines.length > 0 ? 1 : 0);
