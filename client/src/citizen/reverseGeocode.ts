/**
 * Best-effort reverse geocoding via OpenStreetMap Nominatim (free, no API key).
 * Never fabricates an address: returns null on any failure/timeout, in which
 * case callers should fall back to displaying raw coordinates.
 */
export async function reverseGeocode(latitude: number, longitude: number, signal?: AbortSignal): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=17&addressdetails=0`;
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}
