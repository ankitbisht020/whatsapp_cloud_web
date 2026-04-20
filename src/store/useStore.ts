import { create } from 'zustand';
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
import {
  api,
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from '../lib/api';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

interface AuthStore {
  client: ClientProfile | null;
  token: string;
  isAuthenticated: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
  registerClient: (input: RegisterClientInput) => Promise<ClientProfile>;
  loginClient: (input: LoginClientInput) => Promise<ClientProfile>;
  fetchProfile: () => Promise<ClientProfile>;
  logout: () => void;
  clearError: () => void;
}

interface ContactsStore {
  contacts: Contact[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  fetchContacts: () => Promise<void>;
  createContact: (contact: ContactInput) => Promise<Contact>;
  uploadContacts: (file: File) => Promise<{
    matchedCount: number;
    modifiedCount: number;
    upsertedCount: number;
  }>;
  deleteContact: (id: string) => Promise<void>;
  deleteContacts: (ids: string[]) => Promise<void>;
}

interface TemplatesStore {
  templates: Template[];
  isLoading: boolean;
  isUploadingMedia: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  uploadTemplateMedia: (file: File) => Promise<MediaAsset>;
  createTemplate: (template: TemplateInput) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
}

interface BroadcastsStore {
  broadcasts: Broadcast[];
  isLoading: boolean;
  error: string | null;
  fetchBroadcasts: () => Promise<void>;
  createBroadcast: (broadcast: BroadcastInput) => Promise<Broadcast>;
}

interface LogsStore {
  logs: LogEntry[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  fetchLogs: () => Promise<void>;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export const useContactsStore = create<ContactsStore>((set) => ({
  contacts: [],
  meta: null,
  isLoading: false,
  error: null,
  fetchContacts: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.contacts.list({ page: 1, limit: 500 });
      set({
        contacts: response.data,
        meta: response.meta ?? null,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load contacts',
      });
      throw error;
    }
  },
  createContact: async (contact) => {
    const createdContact = await api.contacts.create(contact);
    set((state) => ({
      contacts: [createdContact, ...state.contacts],
      meta: state.meta ? { ...state.meta, total: state.meta.total + 1 } : state.meta,
      error: null,
    }));

    return createdContact;
  },
  uploadContacts: async (file) => {
    const result = await api.contacts.bulkUpload(file);
    const refreshed = await api.contacts.list({ page: 1, limit: 500 });

    set({
      contacts: refreshed.data,
      meta: refreshed.meta ?? null,
      error: null,
    });

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    };
  },
  deleteContact: async (id) => {
    await api.contacts.remove(id);
    set((state) => ({
      contacts: state.contacts.filter((contact) => contact.id !== id),
      meta: state.meta ? { ...state.meta, total: Math.max(0, state.meta.total - 1) } : state.meta,
      error: null,
    }));
  },
  deleteContacts: async (ids) => {
    await Promise.all(ids.map((id) => api.contacts.remove(id)));
    set((state) => ({
      contacts: state.contacts.filter((contact) => !ids.includes(contact.id)),
      meta: state.meta
        ? { ...state.meta, total: Math.max(0, state.meta.total - ids.length) }
        : state.meta,
      error: null,
    }));
  },
}));

export const useTemplatesStore = create<TemplatesStore>((set) => ({
  templates: [],
  isLoading: false,
  isUploadingMedia: false,
  error: null,
  fetchTemplates: async () => {
    set({ isLoading: true, error: null });

    try {
      const templates = await api.templates.list();
      set({ templates, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load templates',
      });
      throw error;
    }
  },
  uploadTemplateMedia: async (file) => {
    set({ isUploadingMedia: true, error: null });

    try {
      const media = await api.media.upload(file);
      set({ isUploadingMedia: false });
      return media;
    } catch (error) {
      set({
        isUploadingMedia: false,
        error: error instanceof Error ? error.message : 'Failed to upload media',
      });
      throw error;
    }
  },
  createTemplate: async (template) => {
    const createdTemplate = await api.templates.create(template);
    set((state) => ({
      templates: [createdTemplate, ...state.templates],
      error: null,
    }));

    return createdTemplate;
  },
  deleteTemplate: async (id) => {
    await api.templates.remove(id);
    set((state) => ({
      templates: state.templates.filter((template) => template.id !== id),
      error: null,
    }));
  },
}));

export const useBroadcastsStore = create<BroadcastsStore>((set) => ({
  broadcasts: [],
  isLoading: false,
  error: null,
  fetchBroadcasts: async () => {
    set({ isLoading: true, error: null });

    try {
      const broadcasts = await api.broadcasts.list();
      set({ broadcasts, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load broadcasts',
      });
      throw error;
    }
  },
  createBroadcast: async (broadcast) => {
    const createdBroadcast = await api.broadcasts.create(broadcast);
    set((state) => ({
      broadcasts: [createdBroadcast, ...state.broadcasts],
      error: null,
    }));

    return createdBroadcast;
  },
}));

export const useLogsStore = create<LogsStore>((set) => ({
  logs: [],
  meta: null,
  isLoading: false,
  error: null,
  fetchLogs: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.logs.list({ page: 1, limit: 500 });
      set({
        logs: response.data,
        meta: response.meta ?? null,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load logs',
      });
      throw error;
    }
  },
}));

export const useAuthStore = create<AuthStore>((set) => ({
  client: null,
  token: getStoredAuthToken(),
  isAuthenticated: Boolean(getStoredAuthToken()),
  isReady: false,
  isLoading: false,
  error: null,
  initializeAuth: async () => {
    const token = getStoredAuthToken();

    if (!token) {
      set({
        client: null,
        token: '',
        isAuthenticated: false,
        isReady: true,
        isLoading: false,
        error: null,
      });
      return;
    }

    set({
      token,
      isAuthenticated: true,
      isLoading: true,
      error: null,
    });

    try {
      const client = await api.auth.profile();
      set({
        client,
        token,
        isAuthenticated: true,
        isReady: true,
        isLoading: false,
      });
    } catch (error) {
      clearStoredAuthToken();
      resetWorkspaceStores();
      set({
        client: null,
        token: '',
        isAuthenticated: false,
        isReady: true,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Session expired',
      });
      throw error;
    }
  },
  registerClient: async (input) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.auth.register(input);
      setStoredAuthToken(response.token);
      set({
        client: response.client,
        token: response.token,
        isAuthenticated: true,
        isReady: true,
        isLoading: false,
      });
      return response.client;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unable to register client',
      });
      throw error;
    }
  },
  loginClient: async (input) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.auth.login(input);
      setStoredAuthToken(response.token);
      set({
        client: response.client,
        token: response.token,
        isAuthenticated: true,
        isReady: true,
        isLoading: false,
      });
      return response.client;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unable to log in',
      });
      throw error;
    }
  },
  fetchProfile: async () => {
    set({ isLoading: true, error: null });

    try {
      const client = await api.auth.profile();
      set({
        client,
        isAuthenticated: true,
        isReady: true,
        isLoading: false,
      });
      return client;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load profile',
      });
      throw error;
    }
  },
  logout: () => {
    clearStoredAuthToken();
    resetWorkspaceStores();
    set({
      client: null,
      token: '',
      isAuthenticated: false,
      isReady: true,
      isLoading: false,
      error: null,
    });
  },
  clearError: () => set({ error: null }),
}));

function resetWorkspaceStores() {
  useContactsStore.setState({
    contacts: [],
    meta: null,
    isLoading: false,
    error: null,
  });
  useTemplatesStore.setState({
    templates: [],
    isLoading: false,
    isUploadingMedia: false,
    error: null,
  });
  useBroadcastsStore.setState({
    broadcasts: [],
    isLoading: false,
    error: null,
  });
  useLogsStore.setState({
    logs: [],
    meta: null,
    isLoading: false,
    error: null,
  });
}
