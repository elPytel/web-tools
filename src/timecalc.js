// Small reusable ESM module with time-difference logic.
// Functions are pure and easy to test.

export function computeDiffMinutes(start, end) {
  if (typeof start !== 'string' || typeof end !== 'string') {
    throw new Error('Invalid input');
  }
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  if ([h1, m1, h2, m2].some((v) => Number.isNaN(v))) {
    throw new Error('Invalid input');
  }

  let diff = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diff < 0) diff += 24 * 60; // allow wrap over midnight
  return diff;
}

export function formatPretty(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  return `${hours} h ${mins} min`;
}

export function computeDiff(start, end) {
  const minutes = computeDiffMinutes(start, end);
  return { minutes, pretty: formatPretty(minutes), hours: Math.floor(minutes / 60), mins: minutes % 60 };
}

export default computeDiff;
