import React, { useState, useRef } from 'react';
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  X,
  ExternalLink,
  Globe,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { Message, Attachment } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEditSubmit?: (newContent: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  onRegenerate,
  onEditSubmit,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy message:', e);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editContent.trim() && onEditSubmit) {
      onEditSubmit(editContent.trim());
      setIsEditing(false);
    }
  };

  const handleTTS = async () => {
    // If already playing, stop
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
      return;
    }

    try {
      setTtsLoading(true);
      const res = await fetch('/api/chat/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content }),
      });

      if (!res.ok) {
        throw new Error('TTS server failed');
      }

      const data = await res.json();
      if (data.audio) {
        const audioSrc = `data:audio/wav;base64,${data.audio}`;
        const audio = new Audio(audioSrc);
        audioRef.current = audio;
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => {
          setIsPlayingAudio(false);
          // Fallback to browser Web Speech API
          speakWithBrowser(message.content);
        };
        await audio.play();
        setIsPlayingAudio(true);
      } else {
        speakWithBrowser(message.content);
      }
    } catch (err) {
      console.warn('Gemini TTS error, falling back to browser speech synthesis:', err);
      speakWithBrowser(message.content);
    } finally {
      setTtsLoading(false);
    }
  };

  const speakWithBrowser = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  // User Message
  if (isUser) {
    return (
      <div className="group flex justify-end mb-6 px-3 md:px-6">
        <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[70%]">
          {/* Attachments preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2 mb-2">
              {message.attachments.map((att: Attachment) => {
                const isImage = att.mimeType.startsWith('image/');
                return (
                  <div
                    key={att.id}
                    className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shadow-sm"
                  >
                    {isImage ? (
                      <img
                        src={att.data}
                        alt={att.name}
                        onClick={() => setSelectedImage(att.data)}
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        title="Click to view full image"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2.5 text-xs text-zinc-700 dark:text-zinc-200">
                        <FileCode className="w-4 h-4 text-emerald-500" />
                        <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Edit Box or Bubble */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-emerald-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none min-h-[100px]"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer transition-colors shadow-xs"
                >
                  Send & Update
                </button>
              </div>
            </form>
          ) : (
            <div className="relative">
              <div className="px-4 py-3 rounded-2xl sm:rounded-3xl bg-emerald-600 text-white shadow-sm text-[15px] leading-relaxed break-words">
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>

              {/* Action buttons below user message */}
              <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-xs"
                  title="Edit prompt"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-xs"
                  title="Copy prompt"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Image Zoom Modal */}
        {selectedImage && (
          <div
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={selectedImage}
                alt="Enlarged attachment"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="group flex gap-3 sm:gap-4 mb-6 px-3 md:px-6">
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        {/* Grounding Citations Header (if web search was used) */}
        {message.grounding && message.grounding.length > 0 && (
          <div className="mb-3 p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold mb-2">
              <Globe className="w-3.5 h-3.5" />
              <span>Grounded with Google Search Sources</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.grounding.map((g, idx) => {
                if (!g.web?.uri) return null;
                const domain = new URL(g.web.uri).hostname.replace('www.', '');
                return (
                  <a
                    key={idx}
                    href={g.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors shadow-2xs font-medium"
                    title={g.web.title || g.web.uri}
                  >
                    <span className="truncate max-w-[160px]">{g.web.title || domain}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Error alert if failed */}
        {message.isError ? (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1">
              <p className="font-semibold">Unable to complete response</p>
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{message.content}</p>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry generation</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <MarkdownRenderer content={message.content} />

            {/* Pulsating cursor while streaming */}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse rounded-xs align-middle" />
            )}
          </div>
        )}

        {/* Actions Bar (when not streaming and not error) */}
        {!isStreaming && !message.isError && (
          <div className="flex items-center gap-1 mt-3 text-zinc-400 dark:text-zinc-500 select-none">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* Read aloud (TTS) button */}
            <button
              onClick={handleTTS}
              disabled={ttsLoading}
              className={`p-1.5 rounded-lg hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                isPlayingAudio ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : ''
              }`}
              title={isPlayingAudio ? 'Stop speech' : 'Read aloud with AI voice'}
            >
              {isPlayingAudio ? (
                <VolumeX className="w-4 h-4 text-emerald-500 animate-pulse" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Regenerate button */}
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-lg hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Regenerate response"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Thumbs up / down feedback */}
            <button
              onClick={() => setLiked(liked === true ? null : true)}
              className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                liked === true ? 'text-emerald-500 dark:text-emerald-400' : 'hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              title="Good response"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLiked(liked === false ? null : false)}
              className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                liked === false ? 'text-rose-500 dark:text-rose-400' : 'hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              title="Bad response"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
