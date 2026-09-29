import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Image as ImageIcon,
  Globe,
  Mic,
  MicOff,
  X,
  Sparkles,
  Code,
  Zap,
} from 'lucide-react';
import { Attachment } from '../types';
import { SYSTEM_PERSONAS } from '../data/prompts';

interface ChatInputProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  isGenerating: boolean;
  onStopGeneration: () => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  selectedPersona: string;
  onSelectPersona: (personaId: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating,
  onStopGeneration,
  webSearchEnabled,
  onToggleWebSearch,
  selectedPersona,
  onSelectPersona,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [text]);

  // Focus textarea on load
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Max 10MB file limit
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Max size is 10MB.`);
        return;
      }

      const reader = new FileReader();

      if (file.type.startsWith('image/')) {
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              name: file.name,
              mimeType: file.type,
              data: dataUrl,
              size: file.size,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        // Text / code files
        reader.onload = () => {
          const content = reader.result as string;
          // Format as markdown code block or base64
          setAttachments((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              name: file.name,
              mimeType: file.type || 'text/plain',
              data: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(content)))}`,
              size: file.size,
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isGenerating) {
      onStopGeneration();
      return;
    }

    if (!text.trim() && attachments.length === 0) return;

    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const canSend = text.trim().length > 0 || attachments.length > 0;

  return (
    <div className="relative px-3 md:px-6 pb-4 pt-1 bg-gradient-to-t from-white via-white dark:from-zinc-950 dark:via-zinc-950 to-transparent">
      <div className="max-w-3xl mx-auto">
        {/* Quick Persona Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs select-none">
          <span className="text-zinc-400 dark:text-zinc-500 font-medium pl-1 text-[11px] uppercase tracking-wider shrink-0">
            Persona:
          </span>
          {SYSTEM_PERSONAS.map((p) => {
            const isSelected = p.id === selectedPersona;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPersona(p.id)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title={p.description}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Input Box Container */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-3xl bg-zinc-100 dark:bg-zinc-900 border transition-all duration-200 shadow-md ${
            isDragging
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5'
              : 'border-zinc-200 dark:border-zinc-800 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/10'
          }`}
        >
          {/* Staged Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 pb-0">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                >
                  {att.mimeType.startsWith('image/') ? (
                    <img
                      src={att.data}
                      alt={att.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Code className="w-4 h-4" />
                    </div>
                  )}
                  <div className="max-w-[120px] truncate text-xs text-zinc-700 dark:text-zinc-200 font-medium">
                    {att.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="p-1 text-zinc-400 hover:text-rose-500 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text Area Input */}
          <div className="flex items-end px-3.5 py-2.5">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording
                  ? 'Listening to speech...'
                  : 'Ask anything, draft code, or upload images... (Shift + Enter for new line)'
              }
              rows={1}
              disabled={disabled}
              className="flex-1 max-h-[200px] bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-[15px] focus:outline-none resize-none leading-relaxed py-1.5"
            />

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,text/*,.json,.js,.ts,.py,.md,.csv"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />

            {/* Left Action Buttons Inside Bar */}
            <div className="flex items-center gap-1 ml-2 mb-0.5">
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                title="Attach images or documents"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Web Search Quick Toggle Button */}
              <button
                type="button"
                onClick={onToggleWebSearch}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  webSearchEnabled
                    ? 'text-blue-500 bg-blue-500/10'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                }`}
                title={webSearchEnabled ? 'Web search enabled' : 'Enable web search'}
              >
                <Globe className="w-4 h-4" />
              </button>

              {/* Voice Input Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isRecording
                    ? 'text-rose-500 bg-rose-500/10 animate-pulse'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                }`}
                title={isRecording ? 'Stop voice recording' : 'Dictate with voice'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send or Stop Generation Button */}
              {isGenerating ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="p-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-all shadow-sm cursor-pointer ml-1"
                  title="Stop generating"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!canSend || disabled}
                  className={`p-2 rounded-xl transition-all shadow-sm ml-1 cursor-pointer ${
                    canSend && !disabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500 select-none">
          NovaChat can make mistakes. Verify important factual, mathematical, and medical information.
        </p>
      </div>
    </div>
  );
};
