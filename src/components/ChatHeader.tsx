import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ChevronDown,
  Globe,
  Download,
  Share2,
  Trash2,
  Copy,
  Sliders,
  Check,
  Zap,
  Cpu,
  Feather,
  EyeOff,
  MoreVertical,
  FileDown,
} from 'lucide-react';
import { Conversation, ModelOption } from '../types';

interface ChatHeaderProps {
  currentConversation: Conversation | null;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  isIncognito: boolean;
  onToggleIncognito: () => void;
  onToggleSidebar: () => void;
  onExportMarkdown: () => void;
  onExportJSON: () => void;
  onDuplicateChat: () => void;
  onClearMessages: () => void;
  onOpenSettings: () => void;
}

const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    description: 'Fast, intelligent workhorse for multimodal vision, coding, & web search.',
    badge: 'Recommended',
    capabilities: ['Fast', 'Vision', 'Search'],
    contextWindow: '1M tokens',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    description: 'Deep reasoning, complex STEM logic, and advanced code architecture.',
    badge: 'Deep Reasoning',
    capabilities: ['Pro Logic', 'Deep Code', 'Math'],
    contextWindow: '2M tokens',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    description: 'Ultra-low latency for instant responses and concise outputs.',
    badge: 'Lightning',
    capabilities: ['Ultra Fast', 'Concise'],
    contextWindow: '1M tokens',
  },
];

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentConversation,
  selectedModel,
  onSelectModel,
  webSearchEnabled,
  onToggleWebSearch,
  isIncognito,
  onToggleIncognito,
  onToggleSidebar,
  onExportMarkdown,
  onExportJSON,
  onDuplicateChat,
  onClearMessages,
  onOpenSettings,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(e.target as Node)
      ) {
        setModelDropdownOpen(false);
      }
      if (
        actionsMenuRef.current &&
        !actionsMenuRef.current.contains(e.target as Node)
      ) {
        setActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <header className="relative z-30 flex items-center justify-between px-3 md:px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md transition-colors">
      {/* Left: Sidebar Toggle + Title */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Model Switcher Dropdown */}
        <div className="relative" ref={modelDropdownRef}>
          <button
            onClick={() => setModelDropdownOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 text-sm font-semibold transition-all cursor-pointer shadow-xs"
          >
            <span className="flex items-center gap-1.5">
              {activeModel.id === 'gemini-3.8-flash' && (
                <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
              )}
              {activeModel.id === 'gemini-3.1-pro-preview' && (
                <Cpu className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/20" />
              )}
              {activeModel.id === 'gemini-3.1-flash-lite' && (
                <Feather className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>{activeModel.name}</span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
          </button>

          {/* Dropdown Menu */}
          {modelDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 md:w-80 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                Model Architecture
              </div>
              <div className="py-1 space-y-1">
                {AVAILABLE_MODELS.map((model) => {
                  const isSelected = model.id === selectedModel;
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {model.id === 'gemini-3.8-flash' && (
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {model.id === 'gemini-3.1-pro-preview' && (
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                            <Cpu className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {model.id === 'gemini-3.1-flash-lite' && (
                          <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Feather className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {model.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {model.badge}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {model.description}
                        </p>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Temporary/Incognito chat badge */}
        {isIncognito && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 text-xs font-medium">
            <EyeOff className="w-3.5 h-3.5" />
            <span>Incognito Mode</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Web Search Grounding Toggle */}
        <button
          onClick={onToggleWebSearch}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
            webSearchEnabled
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
          title={
            webSearchEnabled
              ? 'Web search grounding active (Google Search)'
              : 'Enable Web Search grounding'
          }
        >
          <Globe
            className={`w-4 h-4 ${
              webSearchEnabled ? 'text-blue-500 animate-pulse' : 'text-zinc-400'
            }`}
          />
          <span className="hidden sm:inline">Search</span>
        </button>

        {/* Incognito Toggle Button */}
        <button
          onClick={onToggleIncognito}
          className={`p-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
            isIncognito
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
          title={
            isIncognito
              ? 'Incognito mode on (Chat won\'t be saved)'
              : 'Turn on Incognito mode'
          }
        >
          <EyeOff className="w-4 h-4" />
        </button>

        {/* More Actions Menu */}
        <div className="relative" ref={actionsMenuRef}>
          <button
            onClick={() => setActionsMenuOpen((v) => !v)}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Conversation options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {actionsMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
              <button
                onClick={() => {
                  onExportMarkdown();
                  setActionsMenuOpen(false);
                }}
                disabled={!currentConversation || currentConversation.messages.length === 0}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-emerald-500" />
                <span>Export as Markdown</span>
              </button>

              <button
                onClick={() => {
                  onExportJSON();
                  setActionsMenuOpen(false);
                }}
                disabled={!currentConversation || currentConversation.messages.length === 0}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-500" />
                <span>Export as JSON</span>
              </button>

              <button
                onClick={() => {
                  onDuplicateChat();
                  setActionsMenuOpen(false);
                }}
                disabled={!currentConversation}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Copy className="w-4 h-4 text-amber-500" />
                <span>Branch Conversation</span>
              </button>

              <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

              <button
                onClick={() => {
                  onClearMessages();
                  setActionsMenuOpen(false);
                }}
                disabled={!currentConversation || currentConversation.messages.length === 0}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear chat history</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
