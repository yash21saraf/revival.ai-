import React, { useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { Sparkles, BrainCircuit, Terminal } from 'lucide-react';

interface Props {
  logs: string;
}

const ThinkingConsole: React.FC<Props> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in zoom-in duration-500">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl shadow-indigo-500/10 flex flex-col h-[650px]">
        
        {/* Header */}
        <div className="bg-zinc-900/50 border-b border-zinc-800 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 animate-pulse"></div>
              <BrainCircuit className="w-5 h-5 text-indigo-400 relative z-10" />
            </div>
            <span className="font-mono text-sm text-zinc-300">Gemini 3 Pro • Live Reasoning Chain</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Console Output */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 font-mono text-sm bg-black/95 text-zinc-300 leading-relaxed"
        >
          {logs ? (
            <div className="max-w-none">
              <div className="text-indigo-400 mb-6 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Terminal className="w-4 h-4" />
                <span>Initiating Chain of Thought Analysis...</span>
              </div>
              
              <Markdown
                components={{
                  // Headers
                  h1: ({node, ...props}) => <h1 className="text-xl font-bold text-indigo-400 mt-8 mb-4 border-b border-zinc-800 pb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-bold text-indigo-200 mt-6 mb-3" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base font-semibold text-zinc-200 mt-4 mb-2 underline decoration-zinc-700" {...props} />,
                  
                  // Lists
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 my-3 text-zinc-400 marker:text-indigo-500" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2 my-3 text-zinc-400 marker:text-indigo-500" {...props} />,
                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
                  
                  // Text formatting
                  p: ({node, ...props}) => <p className="mb-4 leading-7 text-zinc-300" {...props} />,
                  strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                  em: ({node, ...props}) => <em className="text-indigo-300 not-italic" {...props} />,
                  
                  // Code
                  code: ({node, ...props}) => {
                    // @ts-ignore - inline is not always present in types depending on version, but safe to ignore for this usage
                    const isInline = props.inline || !String(props.children).includes('\n');
                    return isInline 
                      ? <code className="bg-zinc-900 text-emerald-400 px-1.5 py-0.5 rounded text-xs border border-zinc-800" {...props} />
                      : <code className="block bg-zinc-900 text-zinc-300 p-4 rounded-lg my-4 overflow-x-auto text-xs border border-zinc-800" {...props} />
                  },
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500/50 pl-4 py-1 my-4 text-zinc-500 italic bg-zinc-900/30 pr-2" {...props} />,
                  a: ({node, ...props}) => <a className="text-indigo-400 hover:underline cursor-pointer" {...props} />,
                }}
              >
                {logs}
              </Markdown>
              
              <div className="flex items-center gap-2 mt-4 text-indigo-500 animate-pulse">
                <span className="w-2 h-4 bg-indigo-500 block"></span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                  <Sparkles className="w-10 h-10 animate-spin-slow relative z-10 text-zinc-400" />
                </div>
                <p className="font-mono text-xs uppercase tracking-widest opacity-70">Establishing Uplink to Gemini 3...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-900/30 border-t border-zinc-800 p-2 px-4 flex justify-between items-center text-[10px] text-zinc-500 font-mono shrink-0">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>STREAM_ACTIVE</span>
            </div>
            <span>MODE: CHAIN_OF_THOUGHT // MARKDOWN_RENDERER_V1</span>
        </div>
      </div>
    </div>
  );
};

export default ThinkingConsole;
