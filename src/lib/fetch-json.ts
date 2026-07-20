/**
 * Safe JSON fetcher: reads the response as text first, then parses JSON.
 * If the server returns a non-JSON response (e.g. Vercel error page),
 * it throws a meaningful error instead of a cryptic JSON parse failure.
 */
export async function fetchJson<T = any>(
  url: string,
  options: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned an invalid response (status ${res.status}): ${text.slice(0, 200)}`
    );
  }
}
