import type {
  ApiError,
  ApiSuccess,
  CreateProverb,
  FilterOptions,
  Pagination,
  Proverb,
  TakeoutExport,
  UpdateProverb,
} from '@proverbs/contracts';


type ListResult = { data: Proverb[]; pagination: Pagination };

async function responseBody<T>(response: Response): Promise<ApiSuccess<T> | ApiError> {
  try {
    return (await response.json()) as ApiSuccess<T> | ApiError;
  } catch {
    throw new Error(`The server returned an invalid response (${response.status})`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(path, {
    ...init,
    headers: { ...(init?.body ? { 'content-type': 'application/json' } : {}), ...init?.headers },
  });
  const body = await responseBody<T>(response);
  if (!response.ok || !body.success) {
    throw new Error(body.success ? `Request failed (${response.status})` : body.error.message);
  }
  return body;
}

export const api = {
  async list(params: URLSearchParams): Promise<ListResult> {
    const result = await request<Proverb[]>(`/api/proverbs?${params}`);
    return {
      data: result.data,
      pagination: (result.meta?.pagination as Pagination | undefined) ?? {
        total: result.data.length,
        page: 1,
        pages: 1,
      },
    };
  },
  async random(params = new URLSearchParams()): Promise<Proverb> {
    const suffix = params.size ? `?${params}` : '';
    const response = await fetch(`/api/random${suffix}`);
    const body = (await responseBody<never>(response)) as
      { success: true; proverb: Proverb } | ApiError;
    if (!response.ok || !body.success) {
      throw new Error(body.success ? 'Request failed' : body.error.message);
    }
    return body.proverb;
  },
  filters: async () => (await request<FilterOptions>('/api/proverbs/filters')).data,
  create: async (value: CreateProverb) =>
    (await request<Proverb>('/api/proverbs', { method: 'POST', body: JSON.stringify(value) })).data,
  update: async (id: string, value: UpdateProverb) =>
    (
      await request<Proverb>(`/api/proverbs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(value),
      })
    ).data,
  delete: async (id: string) =>
    request<Record<string, never>>(`/api/proverbs/${id}`, { method: 'DELETE' }),
  exportTakeout: async () => (await request<TakeoutExport>('/api/config/export')).data,
};

