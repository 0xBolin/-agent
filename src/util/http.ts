export async function fetchText(
  url: string,
  init: RequestInit = {},
  timeoutMs = 25000
): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "JobBlock/0.1 (+https://github.com/job-block; Web3 job agent)",
        Accept: "text/html,application/json,*/*",
        ...(init.headers || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 25000
): Promise<T> {
  const text = await fetchText(
    url,
    {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.headers || {}),
      },
    },
    timeoutMs
  );
  return JSON.parse(text) as T;
}
