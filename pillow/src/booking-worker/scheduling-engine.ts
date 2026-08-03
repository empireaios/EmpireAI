import type { BookingStore } from "./booking-store.js";
import type {
  AvailabilityValidation,
  AvailabilityWindow,
  BookingInput,
  BookingRecord,
  CalendarSlot,
} from "./types.js";

let slotSeq = 0;
let windowSeq = 0;
let calendarSeq = 0;

export function resetSchedulingSequenceForTesting() {
  slotSeq = 0;
  windowSeq = 0;
  calendarSeq = 0;
}

function nextSlotId() {
  slotSeq += 1;
  return `bkw-slot-${String(slotSeq).padStart(4, "0")}`;
}

function nextWindowId() {
  windowSeq += 1;
  return `bkw-cal-win-${String(windowSeq).padStart(4, "0")}`;
}

function nextCalendarId() {
  calendarSeq += 1;
  return `bkw-cal-${String(calendarSeq).padStart(4, "0")}`;
}

/** Deterministic scheduling: slot generation, availability, conflict prevention. */
export class SchedulingEngine {
  ensureCalendar(
    store: BookingStore,
    businessProjectId: string,
    calendarId?: string | null,
  ) {
    const id = calendarId?.trim() || store.listCalendars()[0]?.calendarId || nextCalendarId();
    const existing = store.getCalendar(id);
    if (existing) return existing;
    return store.saveCalendar(
      {
        calendarId: id,
        businessProjectId,
        slots: [],
        windows: [],
      },
      "ensure_calendar",
    );
  }

  setAvailability(
    store: BookingStore,
    input: BookingInput,
    businessProjectId: string,
  ): AvailabilityWindow {
    const calendar = this.ensureCalendar(store, businessProjectId, input.calendarId);
    const workerId = input.assignedWorker?.trim() || "wkr-tech-unassigned";
    const start = input.startDateTime?.trim() || input.scheduledDateTime?.trim();
    if (!start) {
      throw new Error("Booking Worker setAvailability requires startDateTime or scheduledDateTime");
    }
    const duration = input.durationMinutes ?? 120;
    const end =
      input.endDateTime?.trim() ||
      new Date(Date.parse(start) + duration * 60_000).toISOString();
    const window: AvailabilityWindow = {
      windowId: nextWindowId(),
      calendarId: calendar.calendarId,
      workerId,
      startDateTime: start,
      endDateTime: end,
      serviceArea: input.serviceArea?.trim() || "unspecified",
      capacity: input.capacity ?? 1,
      notes: ["availability window registered structurally"],
    };
    const updated = {
      ...calendar,
      windows: [...calendar.windows, window],
    };
    store.saveCalendar(updated, "set_availability");
    return window;
  }

  allocateTimeSlots(
    store: BookingStore,
    input: BookingInput,
    businessProjectId: string,
    defaultSlotMinutes: number,
  ): CalendarSlot[] {
    const calendar = this.ensureCalendar(store, businessProjectId, input.calendarId);
    const duration = input.durationMinutes ?? defaultSlotMinutes;
    let windows = calendar.windows;
    if (!windows.length) {
      const window = this.setAvailability(store, input, businessProjectId);
      windows = [window];
    }
    const created: CalendarSlot[] = [];
    for (const window of windows) {
      const startMs = Date.parse(window.startDateTime);
      const endMs = Date.parse(window.endDateTime);
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) continue;
      let cursor = startMs;
      while (cursor + duration * 60_000 <= endMs) {
        const slot: CalendarSlot = {
          slotId: nextSlotId(),
          calendarId: calendar.calendarId,
          startDateTime: new Date(cursor).toISOString(),
          endDateTime: new Date(cursor + duration * 60_000).toISOString(),
          durationMinutes: duration,
          serviceArea: window.serviceArea,
          assignedWorkerId: window.workerId,
          bookingId: null,
          status: "open",
        };
        created.push(slot);
        cursor += duration * 60_000;
      }
    }
    const refreshed = store.getCalendar(calendar.calendarId)!;
    store.saveCalendar(
      {
        ...refreshed,
        slots: [...refreshed.slots, ...created],
      },
      "allocate_time_slots",
    );
    return created.map((s) => ({ ...s }));
  }

  validateAvailability(
    store: BookingStore,
    input: BookingInput,
    durationMinutes: number,
  ): AvailabilityValidation {
    const scheduled = input.scheduledDateTime?.trim();
    if (!scheduled) {
      return {
        validated: false,
        available: false,
        conflictDetected: false,
        conflictDetails: [],
        slotId: null,
        windowId: null,
        notes: ["scheduledDateTime required for availability validation"],
      };
    }
    const start = Date.parse(scheduled);
    const end = start + durationMinutes * 60_000;
    if (!Number.isFinite(start)) {
      return {
        validated: false,
        available: false,
        conflictDetected: false,
        conflictDetails: [],
        slotId: null,
        windowId: null,
        notes: ["invalid scheduledDateTime"],
      };
    }

    const workerId = input.assignedWorker?.trim() || null;
    const overlaps = workerId
      ? store.findOverlappingBookings(
          workerId,
          new Date(start).toISOString(),
          new Date(end).toISOString(),
          input.bookingId ?? undefined,
        )
      : [];

    const calendars = store.listCalendars();
    let matchingSlot: CalendarSlot | null = null;
    let matchingWindow: AvailabilityWindow | null = null;
    for (const calendar of calendars) {
      for (const slot of calendar.slots) {
        const sStart = Date.parse(slot.startDateTime);
        const sEnd = Date.parse(slot.endDateTime);
        if (start >= sStart && end <= sEnd && (slot.status === "open" || slot.status === "held")) {
          matchingSlot = slot;
          break;
        }
      }
      for (const window of calendar.windows) {
        const wStart = Date.parse(window.startDateTime);
        const wEnd = Date.parse(window.endDateTime);
        if (start >= wStart && end <= wEnd) {
          matchingWindow = window;
          break;
        }
      }
      if (matchingSlot) break;
    }

    const conflictDetected = overlaps.length > 0;
    const available = !conflictDetected && (!!matchingSlot || !!matchingWindow || !calendars.length);

    return {
      validated: true,
      available,
      conflictDetected,
      conflictDetails: overlaps.map(
        (b) => `overlap with ${b.bookingId} (${b.scheduledDateTime}–${b.scheduledEndDateTime})`,
      ),
      slotId: matchingSlot?.slotId ?? input.slotId ?? null,
      windowId: matchingWindow?.windowId ?? null,
      notes: matchingSlot
        ? ["matched open calendar slot"]
        : matchingWindow
          ? ["matched availability window"]
          : calendars.length
            ? ["no exact slot/window match; structural availability inferred when no worker conflict"]
            : ["no calendar yet; availability accepted pending calendar management"],
    };
  }

  preventConflicts(
    store: BookingStore,
    workerId: string,
    startIso: string,
    endIso: string,
    excludeBookingId?: string,
  ): { passed: boolean; overlaps: BookingRecord[] } {
    const overlaps = store.findOverlappingBookings(
      workerId,
      startIso,
      endIso,
      excludeBookingId,
    );
    return { passed: overlaps.length === 0, overlaps };
  }

  bindSlotToBooking(
    store: BookingStore,
    calendarId: string,
    slotId: string | null,
    bookingId: string,
    workerId: string | null,
  ) {
    const calendar = store.getCalendar(calendarId);
    if (!calendar || !slotId) return;
    const slots = calendar.slots.map((slot) =>
      slot.slotId === slotId
        ? {
            ...slot,
            bookingId,
            assignedWorkerId: workerId,
            status: "booked" as const,
          }
        : slot,
    );
    store.saveCalendar({ ...calendar, slots }, "bind_slot");
  }

  releaseSlotForBooking(store: BookingStore, booking: BookingRecord) {
    if (!booking.calendarId || !booking.slotId) return;
    const calendar = store.getCalendar(booking.calendarId);
    if (!calendar) return;
    const slots = calendar.slots.map((slot) =>
      slot.slotId === booking.slotId
        ? {
            ...slot,
            bookingId: null,
            status: "open" as const,
          }
        : slot,
    );
    store.saveCalendar({ ...calendar, slots }, "release_slot");
  }

  computeEndDateTime(startIso: string, durationMinutes: number): string {
    const start = Date.parse(startIso);
    if (!Number.isFinite(start)) return startIso;
    return new Date(start + durationMinutes * 60_000).toISOString();
  }
}
