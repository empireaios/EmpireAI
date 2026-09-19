/**
 * Fail-closed, at-most-once local submission journal. Reserve BEFORE sending a
 * request; a reservation is never cleared, including after an ambiguous result.
 * This prevents harness retries, not duplicate effects inside a remote service.
 * Callers must scrub response/event data before passing it here.
 */
import {
  chmodSync,
  closeSync,
  constants,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const VERSION = 1;
const ZERO_HASH = "0".repeat(64);
const digest = (value) => createHash("sha256").update(value).digest("hex");

function fail(code) {
  const error = new Error(code);
  error.code = code;
  error.fatal = true;
  return error;
}

function requireString(value, name) {
  if (typeof value !== "string" || !value.trim()) throw fail(`journal_invalid_${name}`);
}

function requireObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw fail(`journal_invalid_${name}`);
  }
}

function noSymlink(file) {
  if (existsSync(file) && lstatSync(file).isSymbolicLink()) throw fail("journal_symlink_refused");
}

function syncDirectory(directory) {
  // Windows does not expose directory fsync through Node. Every journal record
  // and sealed file is still file-fsynced on both platforms.
  if (process.platform === "win32") return;
  const fd = openSync(directory, constants.O_RDONLY);
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

function writeAll(fd, buffer, write = writeSync) {
  let offset = 0;
  while (offset < buffer.length) {
    const remaining = buffer.subarray(offset);
    const written = write(fd, remaining);
    if (!Number.isInteger(written) || written <= 0 || written > remaining.length) {
      throw fail("journal_incomplete_write");
    }
    offset += written;
  }
}

function validateTransition(cases, type, data) {
  requireObject(data, "data");
  if (type === "event") return;
  requireString(data.id, "id");
  const prior = cases.get(data.id);
  if (type === "reserve") {
    if (prior) throw fail("journal_duplicate_logical_id");
    for (const key of ["kind", "checkId", "sessionId"]) requireString(data[key], key);
    if (typeof data.promptHash !== "string" || !/^[a-f0-9]{64}$/i.test(data.promptHash)) {
      throw fail("journal_invalid_promptHash");
    }
  } else if (type === "admission") {
    if (!prior) throw fail("journal_admission_without_reservation");
    if (prior.finished || prior.requestId) throw fail("journal_duplicate_admission");
    requireString(data.requestId, "requestId");
    for (const other of cases.values()) {
      if (other.requestId === data.requestId) throw fail("journal_duplicate_request_id");
    }
  } else if (type === "finish") {
    if (!prior) throw fail("journal_finish_without_reservation");
    if (prior.finished) throw fail("journal_duplicate_finish");
    requireObject(data.row, "row");
    if (data.row.id !== data.id) throw fail("journal_result_id_mismatch");
    if ((data.row.requestId || null) !== (prior.requestId || null)) {
      throw fail("journal_result_request_id_mismatch");
    }
  } else {
    throw fail("journal_unknown_record_type");
  }
}

function applyTransition(cases, type, data) {
  if (type === "reserve") cases.set(data.id, { ...data, requestId: null, finished: false });
  if (type === "admission") cases.get(data.id).requestId = data.requestId;
  if (type === "finish") cases.get(data.id).finished = true;
}

/**
 * Optional write(fd, buffer) injection uses fs.writeSync's return convention.
 * A synchronous append/fsync failure poisons this instance. No later operation
 * can submit or record work through it. Reopening replays durable reservations.
 * An exclusive lock refuses concurrent writers. A crash leaves the lock in
 * place deliberately: stale-lock recovery requires explicit inspection.
 */
export function createJournal(runDir, { write = writeSync } = {}) {
  if (typeof write !== "function") throw fail("journal_invalid_write");
  const directory = path.resolve(runDir);
  noSymlink(directory);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
  const journalFile = path.join(directory, "submission-journal.jsonl");
  const lockFile = path.join(directory, ".submission-journal.lock");
  noSymlink(journalFile);
  noSymlink(lockFile);
  let lockFd;
  try {
    lockFd = openSync(lockFile, "wx", 0o600);
  } catch (cause) {
    const error = fail(cause.code === "EEXIST" ? "journal_writer_locked" : "journal_lock_failed");
    error.cause = cause;
    throw error;
  }

  let fd;
  let sequence = 0;
  let previousHash = ZERO_HASH;
  let closed = false;
  let poisoned = false;
  const cases = new Map();
  const releaseLock = () => {
    if (lockFd !== undefined) {
      closeSync(lockFd);
      lockFd = undefined;
      unlinkSync(lockFile);
      syncDirectory(directory);
    }
  };
  try {
    writeAll(lockFd, Buffer.from(JSON.stringify({ pid: process.pid, version: VERSION }) + "\n"));
    fsyncSync(lockFd);
    syncDirectory(directory);
    if (existsSync(journalFile)) {
      const contents = readFileSync(journalFile, "utf8");
      if (contents && !contents.endsWith("\n")) throw fail("journal_truncated_record");
      for (const line of contents.split("\n").slice(0, -1)) {
        let record;
        try {
          record = JSON.parse(line);
        } catch {
          throw fail("journal_corrupt_record");
        }
        const { hash, ...body } = record || {};
        if (
          body.version !== VERSION || body.sequence !== sequence + 1 ||
          body.previousHash !== previousHash || hash !== digest(JSON.stringify(body))
        ) throw fail("journal_corrupt_chain");
        validateTransition(cases, body.type, body.data);
        applyTransition(cases, body.type, body.data);
        sequence = body.sequence;
        previousHash = hash;
      }
    }
    fd = openSync(journalFile, constants.O_CREAT | constants.O_APPEND | constants.O_WRONLY |
      (constants.O_NOFOLLOW || 0), 0o600);
    chmodSync(journalFile, 0o600);
    fsyncSync(fd);
    syncDirectory(directory);
  } catch (cause) {
    if (fd !== undefined) closeSync(fd);
    releaseLock();
    throw cause;
  }

  const append = (type, data) => {
    if (closed) throw fail("journal_closed");
    if (poisoned) throw fail("journal_poisoned");
    // Snapshot before validation/persistence: callers cannot mutate prior rows.
    let snapshot;
    try {
      snapshot = JSON.parse(JSON.stringify(data));
      validateTransition(cases, type, snapshot);
    } catch (cause) {
      poisoned = true;
      if (cause.fatal === true) throw cause;
      const error = fail("journal_invalid_serializable_data");
      error.cause = cause;
      throw error;
    }
    const body = {
      version: VERSION,
      sequence: sequence + 1,
      previousHash,
      recordedAt: new Date().toISOString(),
      type,
      data: snapshot,
    };
    const hash = digest(JSON.stringify(body));
    try {
      writeAll(fd, Buffer.from(JSON.stringify({ ...body, hash }) + "\n"), write);
      fsyncSync(fd);
    } catch (cause) {
      poisoned = true;
      const error = fail("journal_persistence_failed");
      error.cause = cause;
      throw error;
    }
    // Crucially, no in-memory state changes happen before the fsync above.
    applyTransition(cases, type, snapshot);
    sequence = body.sequence;
    previousHash = hash;
    return Object.freeze({ sequence, hash });
  };

  return Object.freeze({
    reserve: (reservation) => append("reserve", reservation),
    recordAdmission: (id, requestId) => append("admission", { id, requestId }),
    finish: (id, row) => append("finish", { id, row }),
    event: (event) => append("event", event),
    close() {
      if (closed) return;
      closed = true;
      try {
        closeSync(fd);
      } finally {
        releaseLock();
      }
    },
  });
}

/** Exclusive immutable output: failure leaves evidence in place, never retries. */
export function sealJson(file, value) {
  const contents = Buffer.from(JSON.stringify(value, null, 2) + "\n");
  const target = path.resolve(file);
  const fd = openSync(target, "wx", 0o600);
  try {
    writeAll(fd, contents);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  syncDirectory(path.dirname(target));
  return Object.freeze({ file: target, sha256: digest(contents), bytes: contents.length });
}
