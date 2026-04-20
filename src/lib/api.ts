import type {
  Broadcast,
  BroadcastInput,
  ClientProfile,
  Contact,
  ContactInput,
  LoginClientInput,
  LogEntry,
  MediaAsset,
  PaginationMeta,
  RegisterClientInput,
  Template,
  TemplateInput,
} from '../data/mockData';
import { AUTH_TOKEN_STORAGE_KEY, extractTemplateVariables } from '../data/mockData';

const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

interface RawClient {
  _id: string;
  name: string;
  email: string;
  businessName: string;
  whatsappAccessToken: string;
  phoneNumberId: string;
  wabaId: string;
  createdAt: string;
  updatedAt?: string;
}

interface RawMedia {
  _id?: string;
  url: string;
  relativeUrl?: string;
  mediaType: MediaAsset['type'];
  mimeType: string;
  filename: string;
  originalName?: string;
  size: number;
}

interface RawContact {
  _id: string;
  name: string;
  phone: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface RawTemplate {
  _id: string;
  name: string;
  language: string;
  header?: string;
  body: string;
  footer?: string;
  variables?: string[];
  media?: RawMedia | null;
  createdAt: string;
  updatedAt?: string;
}

interface RawBroadcast {
  _id: string;
  name: string;
  template: RawTemplate | string;
  filters?: {
    contactIds?: string[];
    tags?: string[];
  };
  status: Broadcast['status'];
  totalMessages?: number;
  sentCount?: number;
  failedCount?: number;
  createdAt: string;
  updatedAt?: string;
}

interface RawLogReference {
  _id: string;
  name?: string;
  phone?: string;
  language?: string;
  status?: string;
}

interface RawLog {
  _id: string;
  contact: RawLogReference | string;
  template: RawLogReference | string;
  broadcast: RawLogReference | string;
  status: LogEntry['status'];
  createdAt: string;
  sentAt?: string;
  error?: string;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

let authToken =
  typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || '' : '';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const normalizeClient = (client: RawClient): ClientProfile => ({
  id: client._id,
  name: client.name,
  email: client.email,
  businessName: client.businessName,
  whatsappAccessToken: client.whatsappAccessToken,
  phoneNumberId: client.phoneNumberId,
  wabaId: client.wabaId,
  createdAt: client.createdAt,
  updatedAt: client.updatedAt,
});

const normalizeMedia = (media: RawMedia): MediaAsset => ({
  id: media._id,
  url: media.url,
  relativeUrl: media.relativeUrl,
  type: media.mediaType,
  filename: media.filename,
  originalName: media.originalName,
  mimeType: media.mimeType,
  size: media.size,
});

const normalizeContact = (contact: RawContact): Contact => ({
  id: contact._id,
  name: contact.name,
  phone: contact.phone,
  tags: contact.tags ?? [],
  createdAt: contact.createdAt,
  updatedAt: contact.updatedAt,
});

const normalizeTemplate = (template: RawTemplate): Template => ({
  id: template._id,
  name: template.name,
  language: template.language,
  headerType: template.media ? 'media' : template.header ? 'text' : 'none',
  headerContent: template.header ?? '',
  body: template.body,
  footer: template.footer ?? '',
  status: 'approved',
  variables: template.variables ?? [],
  media: template.media ? normalizeMedia(template.media) : null,
  createdAt: template.createdAt,
  updatedAt: template.updatedAt,
});

const normalizeBroadcast = (broadcast: RawBroadcast): Broadcast => {
  const rawTemplate = typeof broadcast.template === 'string' ? null : broadcast.template;

  return {
    id: broadcast._id,
    name: broadcast.name,
    templateId:
      typeof broadcast.template === 'string'
        ? broadcast.template
        : rawTemplate?._id ?? '',
    templateName: rawTemplate?.name ?? '',
    status: broadcast.status,
    totalMessages: broadcast.totalMessages ?? 0,
    sentCount: broadcast.sentCount ?? 0,
    failedCount: broadcast.failedCount ?? 0,
    contactIds: broadcast.filters?.contactIds ?? [],
    tags: broadcast.filters?.tags ?? [],
    createdAt: broadcast.createdAt,
    updatedAt: broadcast.updatedAt,
  };
};

const normalizeLog = (log: RawLog): LogEntry => {
  const contact = typeof log.contact === 'string' ? null : log.contact;
  const template = typeof log.template === 'string' ? null : log.template;
  const broadcast = typeof log.broadcast === 'string' ? null : log.broadcast;

  return {
    id: log._id,
    contactId: typeof log.contact === 'string' ? log.contact : contact?._id ?? '',
    contactName: contact?.name ?? 'Unknown contact',
    contactPhone: contact?.phone ?? '',
    templateId: typeof log.template === 'string' ? log.template : template?._id ?? '',
    templateName: template?.name ?? 'Unknown template',
    broadcastId: typeof log.broadcast === 'string' ? log.broadcast : broadcast?._id ?? '',
    broadcastName: broadcast?.name ?? '',
    status: log.status,
    timestamp: log.sentAt ?? log.createdAt,
    error: log.error ?? '',
  };
};

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const getErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
  } catch {
    // Ignore JSON parsing errors and fall back to a generic message.
  }

  return `Request failed with status ${response.status}`;
};

const persistAuthToken = (token: string) => {
  authToken = token;

  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
};

const request = async <T>(path: string, options?: RequestOptions): Promise<T> => {
  const { auth = true, headers, ...init } = options ?? {};
  const normalizedHeaders = new Headers(headers ?? {});

  normalizedHeaders.set('Accept', 'application/json');

  if (!(init.body instanceof FormData) && !normalizedHeaders.has('Content-Type')) {
    normalizedHeaders.set('Content-Type', 'application/json');
  }

  if (auth && authToken && !normalizedHeaders.has('Authorization')) {
    normalizedHeaders.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: normalizedHeaders,
  });

  if (!response.ok) {
    throw new ApiError(await getErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const getStoredAuthToken = () => authToken;

export const setStoredAuthToken = (token: string) => {
  persistAuthToken(token);
};

export const clearStoredAuthToken = () => {
  persistAuthToken('');
};

export const api = {
  auth: {
    async register(input: RegisterClientInput) {
      const response = await request<ApiResponse<{ client: RawClient; token: string }>>(
        '/clients/register',
        {
          method: 'POST',
          auth: false,
          body: JSON.stringify(input),
        },
      );

      return {
        client: normalizeClient(response.data.client),
        token: response.data.token,
      };
    },
    async login(input: LoginClientInput) {
      const response = await request<ApiResponse<{ client: RawClient; token: string }>>(
        '/clients/login',
        {
          method: 'POST',
          auth: false,
          body: JSON.stringify(input),
        },
      );

      return {
        client: normalizeClient(response.data.client),
        token: response.data.token,
      };
    },
    async profile() {
      const response = await request<ApiResponse<RawClient>>('/clients/profile');
      return normalizeClient(response.data);
    },
  },
  media: {
    async upload(file: File) {
      const formData = new FormData();
      formData.append('file', file);

      const response = await request<ApiResponse<RawMedia>>('/media/upload', {
        method: 'POST',
        body: formData,
      });

      return normalizeMedia(response.data);
    },
  },
  contacts: {
    async list(params?: {
      page?: number;
      limit?: number;
      search?: string;
      tags?: string[];
    }) {
      const query = buildQueryString({
        page: params?.page ?? 1,
        limit: params?.limit ?? 500,
        search: params?.search,
        tags: params?.tags?.length ? params.tags.join(',') : undefined,
      });

      const response = await request<ApiResponse<RawContact[]>>(`/contacts${query}`);
      return {
        data: response.data.map(normalizeContact),
        meta: response.meta,
      };
    },
    async create(input: ContactInput) {
      const response = await request<ApiResponse<RawContact>>('/contacts', {
        method: 'POST',
        body: JSON.stringify(input),
      });

      return normalizeContact(response.data);
    },
    async bulkUpload(file: File) {
      const formData = new FormData();
      formData.append('file', file);

      return request<{
        success: boolean;
        message: string;
        matchedCount: number;
        modifiedCount: number;
        upsertedCount: number;
      }>('/contacts/bulk-upload', {
        method: 'POST',
        body: formData,
      });
    },
    async remove(id: string) {
      await request<{ success: boolean; message: string }>(`/contacts/${id}`, {
        method: 'DELETE',
      });
    },
  },
  templates: {
    async list() {
      const response = await request<ApiResponse<RawTemplate[]>>('/templates');
      return response.data.map(normalizeTemplate);
    },
    async create(input: TemplateInput) {
      const response = await request<ApiResponse<RawTemplate>>('/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          language: input.language,
          header: input.headerContent,
          body: input.body,
          footer: input.footer,
          variables: extractTemplateVariables(input.headerContent, input.body),
          media: input.media
            ? {
                type: input.media.type,
                url: input.media.url,
                filename: input.media.filename,
                mimeType: input.media.mimeType,
                size: input.media.size,
              }
            : null,
        }),
      });

      return normalizeTemplate(response.data);
    },
    async remove(id: string) {
      await request<{ success: boolean; message: string }>(`/templates/${id}`, {
        method: 'DELETE',
      });
    },
  },
  broadcasts: {
    async list() {
      const response = await request<ApiResponse<RawBroadcast[]>>('/broadcasts');
      return response.data.map(normalizeBroadcast);
    },
    async create(input: BroadcastInput) {
      const response = await request<ApiResponse<RawBroadcast>>('/broadcasts', {
        method: 'POST',
        body: JSON.stringify(input),
      });

      return normalizeBroadcast(response.data);
    },
  },
  logs: {
    async list(params?: {
      page?: number;
      limit?: number;
      status?: LogEntry['status'];
      contact?: string;
      broadcast?: string;
      fromDate?: string;
      toDate?: string;
    }) {
      const query = buildQueryString({
        page: params?.page ?? 1,
        limit: params?.limit ?? 500,
        status: params?.status,
        contact: params?.contact,
        broadcast: params?.broadcast,
        fromDate: params?.fromDate,
        toDate: params?.toDate,
      });

      const response = await request<ApiResponse<RawLog[]>>(`/logs${query}`);
      return {
        data: response.data.map(normalizeLog),
        meta: response.meta,
      };
    },
  },
};

export { API_BASE_URL };
