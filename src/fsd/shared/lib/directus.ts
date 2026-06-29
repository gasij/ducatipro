export function isDirectusConfigured() {
  return Boolean(process.env.DIRECTUS_URL);
}

export function getDirectusUrl() {
  const url = process.env.DIRECTUS_URL;
  if (!url) {
    throw new Error('DIRECTUS_URL is not set in environment variables');
  }
  return url;
}

export async function directusFetch(path: string, init?: RequestInit) {
  const url = `${getDirectusUrl()}${path}`;
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
