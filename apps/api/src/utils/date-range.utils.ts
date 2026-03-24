/** Start of UTC calendar day for YYYY-MM-DD */
export function utcDayStart(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

/** End of UTC calendar day for YYYY-MM-DD */
export function utcDayEnd(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999Z`);
}
