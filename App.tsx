
import React, { useState, useEffect } from 'react';
import { getYoutubeVideoId, getYoutubeThumbnail, generatePlaceholderFrame } from './services/videoUtils';
import { analyzeVideoAndCreateRevivalPlan } from './services/geminiService';
import { AppState, RevivalStrategy } from './types';
import AnalysisDashboard from './components/AnalysisDashboard';
import ThinkingConsole from './components/ThinkingConsole';
import { Youtube, Sparkles, AlertCircle, ArrowRight, Key } from 'lucide-react';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [youtubeLink, setYoutubeLink] = useState('');
  const [frames, setFrames] = useState<{ mimeType: string; data: string }[]>([]);
  const [revivalStrategy, setRevivalStrategy] = useState<RevivalStrategy | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [thinkingLog, setThinkingLog] = useState<string>("");

  useEffect(() => {
    const checkApiKey = async () => {
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        // Fallback for local dev without the wrapper, or assume env key is present
        setHasApiKey(true);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        // Per guidelines: Assume success after triggering openSelectKey to mitigate race conditions
        setHasApiKey(true);
      } catch (error) {
        console.error("Key selection failed", error);
        // Reset state if explicitly failed, though usually the dialog handles this
        setHasApiKey(false);
      }
    }
  };

  const handleStartAnalysis = async () => {
    if (!youtubeLink) return;

    try {
      setAppState(AppState.PROCESSING_VIDEO);
      setErrorMsg(null);
      setThinkingLog("");

      // 1. "Extract" content (Get thumbnail as proxy for video content)
      console.log("Acquiring video context...");
      const videoId = getYoutubeVideoId(youtubeLink);
      let contextFrames: { mimeType: string; data: string }[] = [];

      if (videoId) {
          const thumbnail = await getYoutubeThumbnail(videoId);
          if (thumbnail) {
            contextFrames = [thumbnail];
          } else {
            // Fallback if we can't get thumbnail
            contextFrames = [generatePlaceholderFrame()];
          }
      } else {
        contextFrames = [generatePlaceholderFrame()];
      }
      
      setFrames(contextFrames);

      // 2. Analyze with Gemini (Show thinking UI)
      setAppState(AppState.ANALYZING_CONTENT);
      
      const strategy = await analyzeVideoAndCreateRevivalPlan(
        youtubeLink, 
        contextFrames,
        (text) => setThinkingLog(text) // Update log in real-time
      );
      
      setRevivalStrategy(strategy);
      setAppState(AppState.COMPLETE);

    } catch (err: any) {
      console.error(err);
      const msg = err.message || "An unexpected error occurred during analysis.";
      setErrorMsg(msg);
      setAppState(AppState.ERROR);
      
      // If we get a permission denied error, it might be due to a lost key session or invalid key.
      // Resetting key state allows user to re-select.
      if (msg.includes("403") || msg.includes("permission") || msg.includes("PERMISSION_DENIED")) {
        setHasApiKey(false);
      }
    }
  };

  const renderKeySelection = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center animate-in fade-in duration-700">
      <div className="mb-8 relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 blur opacity-30 animate-pulse"></div>
          <div className="relative bg-zinc-900 p-6 rounded-full border border-zinc-800">
              <Key className="w-12 h-12 text-emerald-400" />
          </div>
      </div>
      <h1 className="text-4xl font-bold text-white mb-6">
          Access Gemini 3 Pro
      </h1>
      <p className="text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed">
          To use the advanced <strong>Image Generation</strong> and <strong>Research</strong> capabilities of Content Revival AI, 
          you need to select a paid API key from your Google Cloud project.
      </p>

      <button 
          onClick={handleSelectKey}
          className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-3"
      >
          Select API Key
          <ArrowRight className="w-5 h-5" />
      </button>

      <div className="mt-8 text-sm text-zinc-500">
          Need help? View the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">Billing Documentation</a>.
      </div>
    </div>
  );

  const renderIdle = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="mb-8 relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 blur opacity-30 animate-pulse"></div>
            <div className="relative bg-zinc-900 p-6 rounded-full border border-zinc-800">
                <Sparkles className="w-12 h-12 text-indigo-400" />
            </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-zinc-400 mb-6">
            Content Revival AI
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mb-12">
            Revitalize your old YouTube content. Enter a video or playlist link, and Gemini 3 will research 
            modern updates, detect outdated code, and generate a visual revival strategy.
        </p>

        <div className="w-full max-w-md space-y-4 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm">
            <div className="space-y-2 text-left">
                <label className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">YouTube Video or Playlist</label>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                    <Youtube className="w-5 h-5 text-red-500 mr-2" />
                    <input 
                        type="text" 
                        placeholder="https://youtube.com/watch?v=..." 
                        className="bg-transparent border-none outline-none text-zinc-200 w-full py-3 text-sm placeholder:text-zinc-600"
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                    />
                </div>
            </div>

            <button 
                onClick={handleStartAnalysis}
                disabled={!youtubeLink}
                className={`w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center group ${
                    youtubeLink 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
            >
                Start Revival Analysis
                {youtubeLink && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
            </button>
        </div>
        
        {/* Footer info */}
        <div className="mt-12 flex gap-6 text-xs text-zinc-600">
            <span className="flex items-center gap-1">Powered by Gemini 3 Pro</span>
            <span className="w-px h-3 bg-zinc-800 my-auto"></span>
            <span className="flex items-center gap-1">Google Search Grounding</span>
        </div>
    </div>
  );

  const renderThinking = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4">
        <ThinkingConsole logs={thinkingLog} />
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="bg-red-500/10 p-4 rounded-full mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Analysis Failed</h2>
        <p className="text-zinc-400 max-w-md mb-8">{errorMsg}</p>
        <button 
            onClick={() => {
                if (errorMsg?.includes('permission')) {
                    handleSelectKey();
                } else {
                    setAppState(AppState.IDLE);
                }
            }}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
        >
            {errorMsg?.includes('permission') ? 'Select Valid API Key' : 'Try Again'}
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span className="font-bold text-white tracking-tight">Revival.ai</span>
            </div>
            {appState === AppState.COMPLETE && (
                <button 
                    onClick={() => setAppState(AppState.IDLE)} 
                    className="text-sm text-zinc-400 hover:text-white"
                >
                    New Analysis
                </button>
            )}
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4">
        {!hasApiKey ? renderKeySelection() : (
            <>
                {appState === AppState.IDLE && renderIdle()}
                {(appState === AppState.PROCESSING_VIDEO || appState === AppState.ANALYZING_CONTENT) && renderThinking()}
                {appState === AppState.ERROR && renderError()}
                {appState === AppState.COMPLETE && revivalStrategy && (
                    <AnalysisDashboard 
                        strategy={revivalStrategy} 
                        frames={frames} 
                        onReset={() => setAppState(AppState.IDLE)}
                        youtubeUrl={youtubeLink}
                        onAuthError={() => setHasApiKey(false)}
                    />
                )}
            </>
        )}
      </main>
    </div>
  );
};

export default App;
