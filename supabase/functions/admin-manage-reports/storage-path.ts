export function storagePathFromPublicUrl(photoUrl: unknown, supabaseUrl: string): string | null {
  if (typeof photoUrl !== "string" || photoUrl.length > 2048) return null;
  try {
    const parsed = new URL(photoUrl);
    const expected = new URL(supabaseUrl);
    if (parsed.origin !== expected.origin) return null;
    const prefix = "/storage/v1/object/public/zgloszenia-zdjecia/";
    if (!parsed.pathname.startsWith(prefix)) return null;
    const encodedPath = parsed.pathname.slice(prefix.length);
    if (!encodedPath) return null;
    const segments = encodedPath.split("/").map((part) => decodeURIComponent(part));
    if (segments.length !== 2 || segments[0] !== "reports" || !segments[1]) return null;
    if (segments.some((part) => part === "." || part === ".." || part.includes("\\") || /[\u0000-\u001f]/.test(part))) return null;
    return segments.join("/");
  } catch {
    return null;
  }
}
