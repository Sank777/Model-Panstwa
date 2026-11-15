export function parseBearerHeader(value: string | null): { token: string | null; invalid: boolean } {
  if (value === null || value.trim() === "") return { token: null, invalid: false };
  const match = value.match(/^Bearer\s+([^\s]+)$/i);
  return match ? { token: match[1], invalid: false } : { token: null, invalid: true };
}
