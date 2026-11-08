// Read-only schema identity for each declared store. The caller holds the same
// SQLite read transaction used for its row inventory; no schema SQL is exported.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export function captureSchemaInventory(db) {
  const objects = db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name,tbl_name LIMIT 10001').all();
  assert.ok(objects.length <= 10000, 'DECLARED_STORE_SCHEMA_CHANGED:OBJECT_BOUND');
  const objectTypes = {table: 0, index: 0, view: 0, trigger: 0};
  for (const object of objects) {
    assert.ok(Object.hasOwn(objectTypes, object.type), 'DECLARED_STORE_SCHEMA_CHANGED:OBJECT_TYPE');
    objectTypes[object.type] += 1;
  }
  return {
    present: true,
    objectCount: objects.length,
    objectTypes,
    schemaObjectsSha256: createHash('sha256').update(JSON.stringify(objects)).digest('hex'),
  };
}

export function assertSchemaInventoryPreserved(baseline, current) {
  assert.deepEqual(current, baseline, 'DECLARED_STORE_SCHEMA_CHANGED:FULL_SCHEMA_OBJECTS');
}
