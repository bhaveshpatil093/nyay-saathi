/**
 * Monotonically increasing, chronologically sortable unique identifier.
 * Format: prefix_timestamp36_random5 (e.g. case_1hz4x8_9b2a1)
 */
let lastTimestamp = 0;
let counter = 0;

export function generateId(prefix = 'id'): string {
  let now = Date.now();
  if (now === lastTimestamp) {
    counter++;
  } else {
    lastTimestamp = now;
    counter = 0;
  }

  // Base36 timestamp for compactness + sorting
  const timeStr = now.toString(36);
  const countStr = counter > 0 ? counter.toString(36).padStart(2, '0') : '';
  const randStr = Math.random().toString(36).substring(2, 6);

  return `${prefix}_${timeStr}${countStr}_${randStr}`;
}

export function getIsoTimestamp(): string {
  return new Date().toISOString();
}
