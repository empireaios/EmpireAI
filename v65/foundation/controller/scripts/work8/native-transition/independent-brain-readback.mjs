// Separate native SQLite implementation: never calls getDatabase(), SQL.js, or
// a constructor capable of silently creating an empty replacement database.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {canonicalJson, sha256} from './live-brain-observation.mjs';
const quote = name => '"' + name.replaceAll('"', '""') + '"';

export function independentBrainReadback(file) {
  const stat = fs.lstatSync(file);
  assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && stat.size >= 512, 'BRAIN_EXPORT_FILE_INVALID');
  assert.equal(fs.realpathSync(file), file, 'BRAIN_EXPORT_ALIAS_REFUSED');
  const db = new DatabaseSync(file, {readOnly: true, allowExtension: false, timeout: 2000});
  try {
    db.exec('PRAGMA query_only=ON; BEGIN');
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok', 'BRAIN_EXPORT_INTEGRITY_FAILED');
    const names = db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='table' ORDER BY name").all();
    assert.ok(names.length > 0 && names.length <= 2000, 'BRAIN_EXPORT_SCHEMA_BOUND');
    const tables = {};
    for (const {name, sql} of names) {
      const rows = db.prepare('SELECT * FROM ' + quote(name) + ' LIMIT 50001').all();
      assert.ok(rows.length <= 50000, 'BRAIN_EXPORT_ROW_BOUND');
      const hashes = rows.map(row => sha256(canonicalJson(row))).sort();
      tables[name] = {schemaSha256: sha256(sql || ''), count: rows.length, hashes, logicalSha256: sha256(canonicalJson(hashes))};
      if (name === 'sqlite_sequence') tables[name].sequences = Object.fromEntries(rows.map(row => [row.name, Number(row.seq)]));
    }
    const schemaObjectsSha256 = sha256(canonicalJson(db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name,tbl_name").all()));
    const logicalStore = {present: true, applicationId: db.prepare('PRAGMA application_id').get().application_id, userVersion: db.prepare('PRAGMA user_version').get().user_version, tables};
    db.exec('COMMIT');
    return {logicalStore, schemaObjectsSha256, exportSha256: sha256(fs.readFileSync(file)), bytes: stat.size};
  } finally { db.close(); }
}

export function assertBrainLogicalEquality(baseline, readback) {
  assert.deepEqual(readback.logicalStore, baseline.logicalStore, 'BRAIN_CANONICAL_LOGICAL_STATE_CHANGED');
  const expectedSchema = baseline.schemaObjectsSha256 ?? baseline.attestation?.schemaObjectsSha256;
  assert.equal(readback.schemaObjectsSha256, expectedSchema, 'BRAIN_SCHEMA_OBJECTS_CHANGED');
}
