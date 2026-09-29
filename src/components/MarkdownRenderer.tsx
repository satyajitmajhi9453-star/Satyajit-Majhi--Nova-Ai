import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, ExternalLink } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export function CodeBlock({ language = 'text', value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy code:', e);
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-zinc-700/60 bg-zinc-950 dark:bg-zinc-950/90 shadow-lg text-zinc-100 font-mono text-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-zinc-800 text-xs text-zinc-400 select-none">
        <span className="font-semibold text-zinc-300 uppercase tracking-wider">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed">
        <pre className="m-0 p-0 font-mono">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-content prose prose-zinc dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 leading-relaxed text-[15px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            const codeString = String(children).replace(/\n$/, '');

            if (!isInline) {
              return <CodeBlock language={match ? match[1] : ''} value={codeString} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-medium"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-3.5 last:mb-0 leading-7">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-6 mb-3.5 space-y-1.5">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-6 mb-3.5 space-y-1.5">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-7">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-2xl font-bold mt-5 mb-3 text-zinc-900 dark:text-zinc-50">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold mt-4 mb-2.5 text-zinc-900 dark:text-zinc-50">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-semibold mt-3.5 mb-2 text-zinc-900 dark:text-zinc-50">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-emerald-500 pl-4 py-1 my-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-r-lg italic text-zinc-700 dark:text-zinc-300">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <table className="w-full text-left text-sm border-collapse">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 font-semibold">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-4 py-3">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2.5 border-b border-zinc-200/60 dark:border-zinc-800/60">{children}</td>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                <span>{children}</span>
                <ExternalLink className="w-3 h-3 inline-block" />
              </a>
            );
          },
          hr() {
            return <hr className="my-6 border-zinc-200 dark:border-zinc-800" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
