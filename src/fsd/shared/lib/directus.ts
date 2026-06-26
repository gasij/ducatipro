const DIRECTUS_URL = process.env.DIRECTUS_URL;

if (!DIRECTUS_URL) {
  throw new Error('DIRECTUS_URL is not set in environment variables');
}

export const directusUrl = DIRECTUS_URL;

export async function directusFetch(path: string, init?: RequestInit) {
  const url = `${directusUrl}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

export async function checkDirectusHealth(): Promise<{ok: boolean; status?: string; error?: string}> {
  try {
    const res = await directusFetch('/server/ping');
    if (!res.ok) {
      return {ok: false, error: `HTTP ${res.status} ${res.statusText}`};
    }
    const text = await res.text();
    return {ok: true, status: text.trim()};
  } catch (err) {
    return {ok: false, error: String(err)};
  }
}
