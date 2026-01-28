/**
 * Parse comma-separated string to array
 */
export function parseCommaSeparatedToArray(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
