/**
 * Fonepay HTTP client – fetch wrapper for merchant API.
 * All calls are server-side only; secret key never sent to client.
 */

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
};

export interface FonepayClientResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * POST to Fonepay merchant API with JSON body.
 */
export async function fonepayPost<T = unknown>(
  url: string,
  body: Record<string, unknown>,
  authHeader: string
): Promise<FonepayClientResponse<T>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });

  let data: T;
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = (await res.json()) as T;
  } else {
    const text = await res.text();
    data = { message: text } as T;
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}

/**
 * Build Basic auth header from username and password.
 */
export function buildBasicAuthHeader(username: string, password: string): string {
  const encoded = Buffer.from(`${username}:${password}`, 'utf-8').toString('base64');
  return `Basic ${encoded}`;
}
