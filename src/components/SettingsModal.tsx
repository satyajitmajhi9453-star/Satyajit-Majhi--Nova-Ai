import React, { useState } from 'react';
import {
  X,
  Sliders,
  Palette,
  HardDrive,
  Download,
  Upload,
  Trash2,
  Check,
  ShieldCheck,
  Cpu,
  Volume2,
} from 'lucide-react';
import { AppSettings, Conversation } from '../types';
import {
  exportAllDataAsJSON,
  importDataFromJSON,
} from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  conversations: Conversation[];
  onReloadConversations: () => void;
  onClearAllConversations: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  conversations,
  onReloadConversations,
  onClearAllConversations,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'model' | 'data'>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const handleExportJSON = () => {
    const jsonStr = exportAllDataAsJSON(conversations, localSettings);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novachat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataFromJSON(content);
      if (res.success) {
        setImportStatus(`Successfully imported ${res.count || 0} chats!`);
        onReloadConversations();
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus(`Import failed: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const totalMessagesCount = conversations.reduce(
    (acc, curr) => acc + curr.messages.length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Settings & Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>General</span>
          </button>
          <button
            onClick={() => setActiveTab('model')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'model'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Model & Prompt</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'data'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Data & Privacy</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Theme selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Appearance Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['dark', 'light', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setLocalSettings({ ...localSettings, theme: t })}
                      className={`py-2.5 px-3 rounded-xl text-xs font-medium border text-center capitalize transition-all cursor-pointer ${
                        localSettings.theme === t
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* TTS Voice selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  AI Speech Voice (Read Aloud)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setLocalSettings({ ...localSettings, voice: v })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        localSettings.voice === v
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{v}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Send on enter */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                <div>
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                    Send message on Enter
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Press Shift + Enter for a new line
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.sendOnEnter}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, sendOnEnter: e.target.checked })
                  }
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'model' && (
            <div className="space-y-4">
              {/* Default Model */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Default Generation Model
                </label>
                <select
                  value={localSettings.defaultModel}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, defaultModel: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recommended)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep Reasoning)</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (High Speed)</option>
                </select>
              </div>

              {/* Temperature Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                    Creativity (Temperature): {localSettings.temperature}
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    {localSettings.temperature < 0.4
                      ? 'Deterministic / Precise'
                      : localSettings.temperature > 1.2
                      ? 'Creative / Wild'
                      : 'Balanced'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={localSettings.temperature}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Custom System Instruction */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Default System Instructions
                </label>
                <textarea
                  rows={4}
                  value={localSettings.systemInstruction}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      systemInstruction: e.target.value,
                    })
                  }
                  placeholder="e.g. You are an expert engineer. Always write clean TypeScript..."
                  className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              {/* Privacy Notice Card */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">
                    100% Client-Side Storage
                  </div>
                  <p className="mt-1 leading-relaxed text-zinc-600 dark:text-zinc-400">
                    All conversations, messages, and settings are saved exclusively in your browser's
                    LocalStorage. No external databases, no telemetry, and no sign-in tracking.
                  </p>
                </div>
              </div>

              {/* Storage Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {conversations.length}
                  </div>
                  <div className="text-[11px] text-zinc-500">Total Conversations</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {totalMessagesCount}
                  </div>
                  <div className="text-[11px] text-zinc-500">Total Messages</div>
                </div>
              </div>

              {/* Import/Export Actions */}
              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleExportJSON}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium text-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-500" />
                    <span>Backup to JSON</span>
                  </button>

                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium text-xs transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 text-blue-500" />
                    <span>Import JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {importStatus && (
                  <p className="text-center text-xs text-emerald-500 font-medium py-1">
                    {importStatus}
                  </p>
                )}
              </div>

              {/* Clear All Chats */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                {confirmClearOpen ? (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                    <p className="text-rose-600 dark:text-rose-400 font-semibold mb-2">
                      Are you sure? This permanently wipes all saved chats from local storage.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onClearAllConversations();
                          setConfirmClearOpen(false);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-500 cursor-pointer"
                      >
                        Yes, Delete All
                      </button>
                      <button
                        onClick={() => setConfirmClearOpen(false)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClearOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All Conversations</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
