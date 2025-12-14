import React, { useState, useEffect } from 'react';
import { RevivalStrategy, OutdatedItem } from '../types';
import { Play, ArrowRight, CheckCircle2, BarChart3, Layers, Info, ExternalLink, Video, FileText, Copy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateVisualOverlay } from '../services/geminiService';
import Markdown from 'react-markdown';

interface Props {
  strategy: RevivalStrategy;
  frames: { mimeType: string; data: string }[];
  onReset: () => void;
  youtubeUrl: string;
  onAuthError: () => void;
}

const AnalysisDashboard: React.FC<Props> = ({ strategy, frames, onReset, youtubeUrl, onAuthError }) => {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'plan'>('analysis');

  // Debug logging to verify data reception
  useEffect(() => {
    console.log("Dashboard received strategy:", strategy);
  }, [strategy]);

  const handleGenerateOverlay = async (item: OutdatedItem) => {
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    try {
        const frameToUse = frames && frames.length > 0 ? frames[Math.min(frames.length - 1, Math.floor(frames.length / 2))] : null;
        
        if (!frameToUse) {
            alert("No video frames available to generate overlay.");
            return;
        }

        const result = await generateVisualOverlay(
            frameToUse, 
            `Replace ${item.oldTool} with ${item.newTool}. Context: ${item.reason}`
        );
        setGeneratedImage(result);
    } catch (e: any) {
        console.error("Visual generation failed:", e);
        const errMsg = e.message || JSON.stringify(e);
        if (errMsg.includes("403") || errMsg.includes("permission") || errMsg.includes("PERMISSION_DENIED")) {
             // Trigger parent to reset key state and show selection screen
             onAuthError();
        } else {
             alert("Failed to generate overlay. Please try again.");
        }
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const getTimestampLink = (timeStr: string) => {
    if (!timeStr) return youtubeUrl;
    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
    }
    const cleanUrl = youtubeUrl.split('&')[0];
    return `${cleanUrl}&t=${seconds}s`;
  };

  // Safe access to metadata with defaults
  const meta = strategy.originalVideoMetadata || {
    title: 'Untitled Video',
    publishDate: 'Unknown Date',
    currentViews: 0
  };
  
  const currentViews = meta.currentViews ?? 0;
  const predictedViews = strategy.predictedViews ?? 0;
  
  const revivalPlan = strategy.revivalPlan || {
    title: '',
    description: '',
    scriptOutline: '*No plan generated*'
  };
  
  const outdatedItems = strategy.outdatedItems || [];
  const segments = strategy.segments || [];

  const chartData = [
    { name: 'Current', value: currentViews, color: '#52525b', label: 'Actual Views' },
    { name: 'Predicted', value: predictedViews, color: '#4ade80', label: 'Revival Potential' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Top Metadata Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
            <h1 className="text-2xl font-bold text-white mb-2">{meta.title}</h1>
            <div className="flex gap-4 text-sm text-zinc-500">
                <span>Published: {meta.publishDate}</span>
                <span>•</span>
                <span>Current Views: {currentViews.toLocaleString()}</span>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'analysis' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
            >
                Deep Analysis
            </button>
            <button 
                onClick={() => setActiveTab('plan')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'plan' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
            >
                Production Plan
            </button>
        </div>
      </div>

      {activeTab === 'analysis' && (
        <>
            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BarChart3 className="w-24 h-24 text-indigo-500" />
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-zinc-400 font-medium">Predictive Performance</h3>
                        <div className="group/tooltip relative">
                            <Info className="w-4 h-4 text-zinc-600 cursor-help" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-black border border-zinc-800 rounded text-xs text-zinc-300 hidden group-hover/tooltip:block z-10 shadow-xl">
                                Estimated views for a 2025 version based on topic trending data, search volume, and engagement decay of the original topic.
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                    <div className="flex items-center space-x-3 mb-4">
                        <Layers className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-zinc-400 font-medium">Update Scope</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500 text-sm">Outdated Tools</span>
                            <span className="text-white font-bold">{outdatedItems.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500 text-sm">Segments Impacted</span>
                            <span className="text-white font-bold">
                                {new Set(outdatedItems.flatMap(i => i.affectedSegmentIndices || [])).size}
                                <span className="text-zinc-600 font-normal"> / {Math.max(1, segments.length)}</span>
                            </span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-emerald-500 h-full rounded-full" 
                                style={{ width: `${(outdatedItems.length / Math.max(1, segments.length)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-400" />
                            <h3 className="text-zinc-400 font-medium">Engagement Score</h3>
                        </div>
                        <p className="text-4xl font-bold text-white mt-2">{strategy.predictedEngagement || 0}<span className="text-xl text-zinc-600">/100</span></p>
                    </div>
                    <p className="text-sm text-zinc-500 mt-4">
                        Based on the modernization of high-impact topics like <span className="text-indigo-400">{outdatedItems[0]?.newTool || 'New Tools'}</span>.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Content: Outdated Items Map */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold text-white">Legacy vs Modern Map</h2>
                                <p className="text-zinc-400 text-sm mt-1">
                                    Specific segments requiring updates with direct timestamps.
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="p-4">Topic / Old Tool</th>
                                        <th className="p-4 text-emerald-400">2025 Standard</th>
                                        <th className="p-4">Impacted Segments</th>
                                        <th className="p-4 text-right">Preview</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {outdatedItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-white">{item.subject}</div>
                                                <div className="text-red-400 line-through decoration-red-400/50 text-xs mt-1">{item.oldTool}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-emerald-400 font-semibold">{item.newTool}</div>
                                                <div className="text-zinc-500 text-xs mt-1">{item.reason}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {(item.affectedSegmentIndices || []).map(segIdx => {
                                                        const segment = segments[segIdx];
                                                        return segment ? (
                                                            <a 
                                                                key={segIdx}
                                                                href={getTimestampLink(segment.startTime)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded text-xs transition-colors border border-zinc-700"
                                                                title={segment.summary}
                                                            >
                                                                <Play className="w-3 h-3" />
                                                                {segment.startTime}
                                                            </a>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right align-middle">
                                                <button 
                                                    onClick={() => handleGenerateOverlay(item)}
                                                    className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg text-xs font-medium transition-all"
                                                >
                                                    Visualize
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {outdatedItems.length === 0 && (
                                      <tr>
                                        <td colSpan={4} className="p-8 text-center text-zinc-500">
                                          No outdated items detected.
                                        </td>
                                      </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Visual Preview */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-full">
                        <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-indigo-900/20 to-purple-900/20">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Gemini Visual Reviver
                            </h2>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[300px] bg-zinc-950/50">
                            {isGeneratingImage ? (
                                <div className="text-center space-y-4">
                                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-zinc-400 animate-pulse">Re-imagining content frame...</p>
                                </div>
                            ) : generatedImage ? (
                                <div className="space-y-4 w-full">
                                    <img src={generatedImage} alt="Revived Content" className="w-full rounded-lg shadow-2xl shadow-indigo-500/20 border border-zinc-800" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-emerald-400 font-mono">ASSET_GENERATED</span>
                                        <button className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> Open
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-zinc-500 p-8 border-2 border-dashed border-zinc-800 rounded-xl">
                                    <Layers className="w-8 h-8 opacity-50 mx-auto mb-4" />
                                    <p className="text-sm">Select "Visualize" on an item to see how Gemini 3 would update the on-screen visuals.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
      )}

      {activeTab === 'plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="lg:col-span-2 space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <FileText className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Script Outline & Production Notes</h2>
                    </div>
                    
                    <div className="prose prose-invert prose-zinc max-w-none">
                        <Markdown
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-lg font-bold text-white mt-6 mb-3 border-b border-zinc-800 pb-2" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-md font-semibold text-indigo-300 mt-5 mb-2" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 text-zinc-300" {...props} />,
                                li: ({node, ...props}) => <li className="marker:text-indigo-500" {...props} />,
                                strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />
                            }}
                        >
                            {revivalPlan.scriptOutline}
                        </Markdown>
                    </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-24">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Video className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Metadata Optimization</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs uppercase font-semibold text-zinc-500 mb-2 block">New Title</label>
                            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-white text-sm font-medium flex gap-2">
                                {revivalPlan.title || "No Title Generated"}
                                <button className="ml-auto text-zinc-500 hover:text-white" title="Copy"><Copy className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs uppercase font-semibold text-zinc-500 mb-2 block">Description</label>
                            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-zinc-400 text-sm h-64 overflow-y-auto whitespace-pre-wrap">
                                {revivalPlan.description || "No Description Generated"}
                            </div>
                        </div>

                        <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors">
                            Copy All Metadata
                        </button>
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* Global Footer Actions */}
      <div className="flex justify-center pt-8 border-t border-zinc-800">
        <button onClick={onReset} className="px-6 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all text-sm">
            Analyze Different Video
        </button>
      </div>
    </div>
  );
};

export default AnalysisDashboard;