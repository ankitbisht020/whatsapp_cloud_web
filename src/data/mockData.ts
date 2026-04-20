export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  businessName: string;
  whatsappAccessToken: string;
  phoneNumberId: string;
  wabaId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MediaAsset {
  id?: string;
  url: string;
  relativeUrl?: string;
  type: 'image' | 'video' | 'document';
  filename: string;
  originalName?: string;
  mimeType: string;
  size: number;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Template {
  id: string;
  name: string;
  language: string;
  headerType: 'text' | 'media' | 'none';
  headerContent: string;
  body: string;
  footer: string;
  status: 'approved';
  variables: string[];
  media: MediaAsset | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Broadcast {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalMessages: number;
  sentCount: number;
  failedCount: number;
  contactIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface LogEntry {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  templateId: string;
  templateName: string;
  broadcastId: string;
  broadcastName: string;
  status: 'sent' | 'failed' | 'pending';
  timestamp: string;
  error: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ContactInput {
  name: string;
  phone: string;
  tags: string[];
}

export interface TemplateInput {
  name: string;
  language: string;
  headerContent: string;
  body: string;
  footer: string;
  media: MediaAsset | null;
}

export interface BroadcastInput {
  name: string;
  templateId: string;
  contactIds: string[];
  tags: string[];
}

export interface RegisterClientInput {
  name: string;
  email: string;
  password: string;
  businessName: string;
  whatsappAccessToken: string;
  phoneNumberId: string;
  wabaId: string;
}

export interface LoginClientInput {
  email: string;
  password: string;
}

export const AUTH_TOKEN_STORAGE_KEY = 'broadcasthub.client.token';

export const dummyVariables: Record<string, string> = {
  '{{1}}': 'Rahul',
  '{{2}}': 'WELCOME20',
  '{{3}}': 'April 20, 2026',
  '{{4}}': 'TXN-29384',
};

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'ar', label: 'Arabic' },
] as const;

export const MEDIA_TYPE_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' },
] as const;

export const getLanguageLabel = (language: string) => {
  const option = LANGUAGE_OPTIONS.find((item) => item.value === language);
  return option?.label ?? language.toUpperCase();
};

export const extractTemplateVariables = (...texts: string[]) => {
  const matches = texts
    .flatMap((text) => text.match(/\{\{\d+\}\}/g) ?? [])
    .sort((left, right) => Number(left.replace(/\D/g, '')) - Number(right.replace(/\D/g, '')));

  return Array.from(new Set(matches));
};
