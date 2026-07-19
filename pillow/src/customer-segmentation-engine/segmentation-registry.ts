/** R4-16 — Segmentation registry. */

import type {
  CustomerSegment,
  SegmentationFailure,
  SegmentationRecord,
  SegmentChange,
} from "./types.js";

export class SegmentationRegistry {
  private readonly segments = new Map<string, CustomerSegment>();
  private readonly records = new Map<string, SegmentationRecord>();
  private readonly changes = new Map<string, SegmentChange>();
  private readonly failures = new Map<string, SegmentationFailure>();

  storeSegment(segment: CustomerSegment): void {
    this.segments.set(segment.segmentId, segment);
  }

  storeRecord(record: SegmentationRecord): void {
    this.records.set(record.segmentationRecordId, record);
  }

  storeChange(change: SegmentChange): void {
    this.changes.set(change.changeId, change);
  }

  storeFailure(failure: SegmentationFailure): void {
    this.failures.set(failure.failureId, failure);
  }

  getSegment(id: string): CustomerSegment | null {
    return this.segments.get(id) ?? null;
  }

  getRecord(id: string): SegmentationRecord | null {
    return this.records.get(id) ?? null;
  }

  listSegments(): CustomerSegment[] {
    return [...this.segments.values()];
  }

  listRecords(): SegmentationRecord[] {
    return [...this.records.values()];
  }

  listRecordsForCustomer(customerId: string): SegmentationRecord[] {
    return this.listRecords().filter((r) => r.customerId === customerId);
  }

  listChanges(): SegmentChange[] {
    return [...this.changes.values()];
  }

  listFailures(): SegmentationFailure[] {
    return [...this.failures.values()];
  }

  resetForTesting(): void {
    this.segments.clear();
    this.records.clear();
    this.changes.clear();
    this.failures.clear();
  }
}
