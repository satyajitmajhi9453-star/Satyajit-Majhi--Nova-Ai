/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadConversations,
  saveConversations,
  loadActiveChatId,
  saveActiveChatId,
  loadSettings,
  saveSettings,
  exportConversationAsMarkdown,
} from './services/storage';
import { Conversation, Message, AppSettings, Attachment, GroundingChunk } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { SYSTEM_PERSONAS } from './data/prompts';
import { ArrowDown, AlertTriangle } from 'lucide-react';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeChatId, setActiveChatId] = useState<string | null>(() => loadActiveChatId());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);

  // Active chat settings
  const [selectedModel, setSelectedModel] = useState<string>(settings.defaultModel);
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(settings.webSearch);
  const [selectedPersona, setSelectedPersona] = useState<string>('default');

  // Streaming state
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scroll state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Apply Theme to <html> tag
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Persist conversations
  useEffect(() => {
    if (!isIncognito) {
      saveConversations(conversations);
    }
  }, [conversations, isIncognito]);

  // Persist active ID
  useEffect(() => {
    if (!isIncognito) {
      saveActiveChatId(activeChatId);
    }
  }, [activeChatId, isIncognito]);

  // Keyboard shortcut: Cmd+K / Ctrl+K for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync active conversation
  const currentConversation = conversations.find((c) => c.id === activeChatId) || null;

  // Auto-scroll logic
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [activeChatId]);

  // New Chat
  const handleNewChat = () => {
    if (isGenerating) {
      handleStopGeneration();
    }
    setActiveChatId(null);
  };

  // Select Chat
  const handleSelectChat = (id: string) => {
    if (isGenerating) {
      handleStopGeneration();
    }
    setActiveChatId(id);
    const target = conversations.find((c) => c.id === id);
    if (target?.model) {
      setSelectedModel(target.model);
    }
  };

  // Delete Chat
  const handleDeleteChat = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };

  // Rename Chat
  const handleRenameChat = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Toggle Pin
  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  // Duplicate / Branch Conversation
  const handleDuplicateChat = (id?: string) => {
    const targetId = id || activeChatId;
    if (!targetId) return;
    const original = conversations.find((c) => c.id === targetId);
    if (!original) return;

    const duplicated: Conversation = {
      ...original,
      id: Math.random().toString(36).substring(2, 9),
      title: `${original.title} (Branch)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
    };

    setConversations((prev) => [duplicated, ...prev]);
    setActiveChatId(duplicated.id);
  };

  // Clear Messages in current conversation
  const handleClearMessages = () => {
    if (!activeChatId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, messages: [], updatedAt: Date.now() } : c))
    );
  };

  // Export Markdown
  const handleExportMarkdown = () => {
    if (!currentConversation) return;
    const md = exportConversationAsMarkdown(currentConversation);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentConversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!currentConversation) return;
    const jsonStr = JSON.stringify(currentConversation, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentConversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Generate Title for new conversation
  const generateTitle = async (messageText: string, convId: string) => {
    try {
      const res = await fetch('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, title: data.title } : c))
          );
        }
      }
    } catch (e) {
      console.error('Failed to generate title:', e);
    }
  };

  // Send Message & Stream Response
  const handleSendMessage = async (
    content: string,
    attachments: Attachment[] = [],
    overrideMessages?: Message[]
  ) => {
    if (isGenerating) return;

    let targetConvId = activeChatId;
    let isBrandNewChat = false;

    // Create a new conversation if none active
    if (!targetConvId || !currentConversation) {
      const newId = Math.random().toString(36).substring(2, 9);
      targetConvId = newId;
      isBrandNewChat = true;

      const newConv: Conversation = {
        id: newId,
        title: content.slice(0, 30) || 'New Chat',
        messages: [],
        model: selectedModel,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        webSearch: webSearchEnabled,
      };

      setConversations((prev) => [newConv, ...prev]);
      setActiveChatId(newId);
    }

    // Prepare User Message
    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // Prepare Assistant Message Placeholder
    const assistantMessageId = Math.random().toString(36).substring(2, 9);
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // Calculate context messages
    const baseMessages = overrideMessages || (currentConversation ? currentConversation.messages : []);
    const updatedMessages = [...baseMessages, userMessage, assistantPlaceholder];

    // Update conversation state with user message & empty assistant placeholder
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? {
              ...c,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    // Auto-generate title on first user turn
    if (isBrandNewChat && content) {
      generateTitle(content, targetConvId);
    }

    // Begin SSE Streaming
    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Determine system instruction
    const persona = SYSTEM_PERSONAS.find((p) => p.id === selectedPersona);
    const combinedSystemInstruction = persona?.prompt || settings.systemInstruction;

    try {
      // Send conversation turns up to user message
      const apiMessages = [...baseMessages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments?.map((a) => ({
          mimeType: a.mimeType,
          data: a.data,
        })),
      }));

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel,
          systemInstruction: combinedSystemInstruction,
          temperature: settings.temperature,
          webSearch: webSearchEnabled,
          thinkingLevel: settings.thinkingLevel,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable response stream received.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let accumulatedGrounding: GroundingChunk[] = [];
      let accumulatedQueries: string[] = [];
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.text) {
              accumulatedText += parsed.text;
            }

            if (parsed.grounding && Array.isArray(parsed.grounding)) {
              accumulatedGrounding = [...accumulatedGrounding, ...parsed.grounding];
            }

            if (parsed.queries && Array.isArray(parsed.queries)) {
              accumulatedQueries = [...accumulatedQueries, ...parsed.queries];
            }

            // Real-time update in conversation messages
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== targetConvId) return c;
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: accumulatedText,
                          grounding:
                            accumulatedGrounding.length > 0 ? accumulatedGrounding : undefined,
                          queries:
                            accumulatedQueries.length > 0 ? accumulatedQueries : undefined,
                        }
                      : m
                  ),
                };
              })
            );

            // Keep autoscrolling during stream
            scrollToBottom(true);
          } catch (e: any) {
            if (e?.name !== 'SyntaxError') {
              console.error('Error parsing SSE chunk:', e);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation aborted by user.');
      } else {
        console.error('Streaming error:', err);
        // Set error message on the assistant turn
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConvId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: err.message || 'Generation failed. Please try again.',
                      isError: true,
                    }
                  : m
              ),
            };
          })
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
      scrollToBottom(true);
    }
  };

  // Regenerate Response
  const handleRegenerate = () => {
    if (!currentConversation || currentConversation.messages.length < 2) return;
    const msgs = currentConversation.messages;
    const lastUserIndex = msgs.map((m) => m.role).lastIndexOf('user');
    if (lastUserIndex === -1) return;

    const lastUserMessage = msgs[lastUserIndex];
    // Keep messages before the last user message
    const previousMessages = msgs.slice(0, lastUserIndex);

    // Call handleSendMessage with the user message and previous messages override
    handleSendMessage(
      lastUserMessage.content,
      lastUserMessage.attachments || [],
      previousMessages
    );
  };

  // Edit Message turn & Regenerate from that turn
  const handleEditSubmit = (messageIndex: number, newContent: string) => {
    if (!currentConversation) return;
    const msgs = currentConversation.messages;
    const targetMsg = msgs[messageIndex];
    if (!targetMsg) return;

    const previousMessages = msgs.slice(0, messageIndex);
    handleSendMessage(newContent, targetMsg.attachments || [], previousMessages);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased font-sans">
      {/* Collapsible Sidebar */}
      <Sidebar
        conversations={conversations}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onTogglePin={handleTogglePin}
        onDuplicateChat={handleDuplicateChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          const updated = { ...settings, ...newSettings };
          setSettings(updated);
          saveSettings(updated);
        }}
      />

      {/* Main Conversation Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Header */}
        <ChatHeader
          currentConversation={currentConversation}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={() => setWebSearchEnabled((v) => !v)}
          isIncognito={isIncognito}
          onToggleIncognito={() => setIsIncognito((v) => !v)}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onExportMarkdown={handleExportMarkdown}
          onExportJSON={handleExportJSON}
          onDuplicateChat={() => handleDuplicateChat()}
          onClearMessages={handleClearMessages}
          onOpenSettings={() => setSettingsModalOpen(true)}
        />

        {/* Incognito Notice Bar */}
        {isIncognito && (
          <div className="bg-purple-900/30 text-purple-300 text-xs px-4 py-2 border-b border-purple-800/40 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
              <span>Incognito Mode Active: Conversations will not be saved to LocalStorage.</span>
            </span>
            <button
              onClick={() => setIsIncognito(false)}
              className="text-purple-300 underline hover:text-white cursor-pointer ml-2"
            >
              Exit
            </button>
          </div>
        )}

        {/* Chat Messages or Welcome Screen */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden relative"
        >
          {!currentConversation || currentConversation.messages.length === 0 ? (
            <WelcomeScreen onSelectPrompt={(promptText) => handleSendMessage(promptText)} />
          ) : (
            <div className="max-w-3xl mx-auto py-6">
              {currentConversation.messages.map((message, index) => {
                const isLastAssistant =
                  message.role === 'assistant' &&
                  index === currentConversation.messages.length - 1;

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isStreaming={isLastAssistant && isGenerating}
                    onRegenerate={isLastAssistant ? handleRegenerate : undefined}
                    onEditSubmit={
                      message.role === 'user'
                        ? (newContent) => handleEditSubmit(index, newContent)
                        : undefined
                    }
                  />
                );
              })}
              <div ref={messagesEndRef} className="h-6" />
            </div>
          )}

          {/* Floating Scroll To Bottom Button */}
          {showScrollBottom && (
            <button
              onClick={() => scrollToBottom(true)}
              className="fixed bottom-28 right-6 z-30 p-2.5 rounded-full bg-zinc-900/90 dark:bg-zinc-800/90 text-white shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all border border-zinc-700/60 cursor-pointer animate-in fade-in"
              title="Scroll to bottom"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Input Bar */}
        <ChatInput
          onSendMessage={(content, attachments) => handleSendMessage(content, attachments)}
          isGenerating={isGenerating}
          onStopGeneration={handleStopGeneration}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={() => setWebSearchEnabled((v) => !v)}
          selectedPersona={selectedPersona}
          onSelectPersona={setSelectedPersona}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          saveSettings(newSettings);
        }}
        conversations={conversations}
        onReloadConversations={() => setConversations(loadConversations())}
        onClearAllConversations={() => {
          setConversations([]);
          setActiveChatId(null);
          saveConversations([]);
          saveActiveChatId(null);
        }}
      />
    </div>
  );
}
