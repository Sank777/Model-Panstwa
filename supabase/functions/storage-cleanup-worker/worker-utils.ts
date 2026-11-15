export function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  const size = Math.max(left.length, right.length);
  for (let i = 0; i < size; i++) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

export function validManagedPath(bucket: string, path: string): boolean {
  if (bucket !== "zgloszenia-zdjecia" || path.length > 200) return false;
  return /^reports\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(path);
}

export function retryDelaySeconds(attempts: number): number {
  return Math.min(24 * 60 * 60, 60 * (2 ** Math.max(0, attempts - 1)));
}
