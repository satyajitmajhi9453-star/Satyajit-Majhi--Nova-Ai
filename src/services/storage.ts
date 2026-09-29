import { Conversation, AppSettings } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'novachat_conversations',
  ACTIVE_ID: 'novachat_active_chat_id',
  SETTINGS: 'novachat_settings',
};

export const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: 'gemini-3.8-flash',
  systemInstruction: 'You are NovaChat, an advanced, insightful, and versatile AI assistant. Answer clearly, format code neatly with language identifiers, and use markdown tables or bullet points where suitable.',
  temperature: 0.7,
  webSearch: false,
  theme: 'dark',
  sendOnEnter: true,
  voice: 'Kore',
  thinkingLevel: 'LOW',
};

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load conversations from localStorage:', e);
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations to localStorage:', e);
  }
}

export function loadActiveChatId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
  } catch {
    return null;
  }
}

export function saveActiveChatId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
    }
  } catch (e) {
    console.error('Failed to save active chat ID:', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function exportAllDataAsJSON(conversations: Conversation[], settings: AppSettings): string {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    conversations,
    settings,
  };
  return JSON.stringify(payload, null, 2);
}

export function importDataFromJSON(
  jsonString: string
): { success: boolean; count?: number; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.conversations)) {
      return { success: false, error: 'Invalid file format. "conversations" array missing.' };
    }
    const current = loadConversations();
    // Merge without duplicates by ID
    const existingIds = new Set(current.map((c) => c.id));
    const merged = [...current];
    let addedCount = 0;

    for (const c of data.conversations) {
      if (c && c.id && c.title && Array.isArray(c.messages)) {
        if (!existingIds.has(c.id)) {
          merged.push(c);
          existingIds.add(c.id);
          addedCount++;
        }
      }
    }

    saveConversations(merged);
    return { success: true, count: addedCount };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Could not parse JSON file.' };
  }
}

export function exportConversationAsMarkdown(conv: Conversation): string {
  let md = `# ${conv.title}\n\n`;
  md += `*Exported on ${new Date().toLocaleString()} | Model: ${conv.model}*\n\n---\n\n`;

  for (const m of conv.messages) {
    const speaker = m.role === 'user' ? '👤 **User**' : '🤖 **NovaChat**';
    const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    md += `### ${speaker} (${time})\n\n`;
    if (m.attachments && m.attachments.length > 0) {
      md += `*Attached: ${m.attachments.map((a) => a.name).join(', ')}*\n\n`;
    }
    md += `${m.content}\n\n---\n\n`;
  }
  return md;
}
