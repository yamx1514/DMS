export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions<TBody> {
  method?: HttpMethod;
  body?: TBody;
  signal?: AbortSignal;
}

export async function request<TResult, TBody = unknown>(
  url: string,
  { method = 'GET', body, signal }: RequestOptions<TBody> = {}
): Promise<TResult> {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return undefined as unknown as TResult;
  }

  return (await response.json()) as TResult;
}
