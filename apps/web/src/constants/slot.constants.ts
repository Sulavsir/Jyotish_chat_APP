/**
 * Slot constants for Jyotish time slots (30-min slots).
 * Used for generating available time range options (e.g. 6:00 - 6:30).
 */

export const SLOT_DURATION_MINUTES = 30;

/** First hour (inclusive) for slot start times. */
export const SLOT_START_HOUR = 6;
/** Last hour (inclusive) for slot start times; slots end by SLOT_END_HOUR:30. */
export const SLOT_END_HOUR = 22;

export interface SlotTimeRangeOption {
  /** Start time "HH:mm" (used to build slot startAt). */
  start: string;
  /** End time "HH:mm" (start + 30 min). */
  end: string;
  /** Display label e.g. "6:00 - 6:30". */
  label: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Returns time range options for 30-min slots from SLOT_START_HOUR to SLOT_END_HOUR.
 * Each option is one 30-min window with label "H:MM - H:MM".
 */
export function getSlotTimeRangeOptions(): SlotTimeRangeOption[] {
  const options: SlotTimeRangeOption[] = [];
  for (let h = SLOT_START_HOUR; h <= SLOT_END_HOUR; h++) {
    options.push({
      start: `${pad2(h)}:00`,
      end: `${pad2(h)}:30`,
      label: `${pad2(h)}:00 - ${pad2(h)}:30`,
    });
    if (h < SLOT_END_HOUR) {
      options.push({
        start: `${pad2(h)}:30`,
        end: `${pad2(h + 1)}:00`,
        label: `${pad2(h)}:30 - ${pad2(h + 1)}:00`,
      });
    }
  }
  return options;
}

/** Minimum date for date picker (next day) in YYYY-MM-DD. */
export function getMinSlotDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
