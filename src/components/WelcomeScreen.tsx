import React from 'react';
import {
  Sparkles,
  Code2,
  FileText,
  Brain,
  Layers,
  Database,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Image,
} from 'lucide-react';
import { STARTER_PROMPTS } from '../data/prompts';
import { PromptTemplate } from '../types';

interface WelcomeScreenProps {
  onSelectPrompt: (promptText: string) => void;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Code2':
      return <Code2 className="w-5 h-5 text-emerald-500" />;
    case 'Layers':
      return <Layers className="w-5 h-5 text-indigo-500" />;
    case 'FileText':
      return <FileText className="w-5 h-5 text-blue-500" />;
    case 'Brain':
      return <Brain className="w-5 h-5 text-purple-500" />;
    case 'Sparkles':
      return <Sparkles className="w-5 h-5 text-amber-500" />;
    case 'Database':
      return <Database className="w-5 h-5 text-teal-500" />;
    default:
      return <Sparkles className="w-5 h-5 text-emerald-500" />;
  }
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectPrompt }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-4xl mx-auto w-full select-none">
      {/* Hero Icon & Title */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-xl shadow-emerald-500/20">
            <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-[22px] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider">
            AI
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          What can I help with today?
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
          Ask complex questions, analyze code, brainstorm concepts, or drag and drop images to inspect them.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[12px] text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60">
            <Search className="w-3.5 h-3.5 text-blue-500" />
            <span>Web Search Grounding</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60">
            <Image className="w-3.5 h-3.5 text-purple-500" />
            <span>Multimodal Vision</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero-DB Local Storage</span>
          </span>
        </div>
      </div>

      {/* Starter Prompt Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {STARTER_PROMPTS.map((item: PromptTemplate) => (
          <button
            key={item.id}
            onClick={() => onSelectPrompt(item.prompt)}
            className="group text-left p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/90 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all cursor-pointer flex items-start gap-3.5"
          >
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 group-hover:scale-105 transition-transform shrink-0">
              {getIcon(item.iconName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 transition-colors">
                  {item.title}
                </span>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 opacity-0 group-hover:opacity-100" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
