/** Lightweight visual fingerprint for "Find My Photos" (center-weighted byte histogram). */

export function computeImageSignature(bytes: Uint8Array, length = 64): number[] {
  if (bytes.length === 0) return Array(length).fill(0);

  const start = Math.floor(bytes.length * 0.2);
  const end = Math.floor(bytes.length * 0.8);
  const slice = bytes.subarray(start, end);
  const chunk = Math.max(1, Math.floor(slice.length / length));
  const sig: number[] = [];

  for (let i = 0; i < length; i++) {
    const from = i * chunk;
    const to = Math.min(slice.length, from + chunk);
    let sum = 0;
    for (let j = from; j < to; j++) sum += slice[j];
    sig.push(to > from ? sum / (to - from) / 255 : 0);
  }

  const norm = Math.sqrt(sig.reduce((a, v) => a + v * v, 0)) || 1;
  return sig.map((v) => v / norm);
}
