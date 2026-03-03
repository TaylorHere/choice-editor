import { useState } from 'react';
import { generateScriptFromAI } from './ai-service';
import { useProjectStore } from '../../store/useProjectStore';
import { X, Sparkles, Loader2, Key, Server, Cpu } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIImportModal({ isOpen, onClose }: Props) {
  const [prompt, setPrompt] = useState('');
  
  // Initialize with env vars or localStorage (localStorage takes precedence if user edited it previously, 
  // OR we can make env vars default if localStorage is empty. 
  // Let's prefer localStorage to allow user override, but use env as fallback default)
  const [apiKey, setApiKey] = useState(localStorage.getItem('ai_api_key') || import.meta.env.VITE_AI_API_KEY || '');
  const [baseUrl, setBaseUrl] = useState(localStorage.getItem('ai_base_url') || import.meta.env.VITE_AI_BASE_URL || 'https://api.openai.com/v1');
  const [model, setModel] = useState(localStorage.getItem('ai_model') || import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setProject = useProjectStore((state) => state.setProject);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!apiKey) {
      setError("API Key is required");
      return;
    }
    if (!prompt.trim()) {
      setError("Please describe your story");
      return;
    }

    setLoading(true);
    setError('');

    // Save config for convenience
    localStorage.setItem('ai_api_key', apiKey);
    localStorage.setItem('ai_base_url', baseUrl);
    localStorage.setItem('ai_model', model);

    try {
      const result = await generateScriptFromAI(prompt, {
        apiKey,
        baseUrl: baseUrl || undefined,
        model
      });

      // Transform nodes/edges slightly if needed (e.g. ensure defaults)
      const nodes = result.nodes.map(n => ({
        ...n,
        type: 'storyNode', // Ensure type
        data: { ...n.data, actions: n.data.actions || [] }
      }));
      
      const edges = result.edges.map(e => ({
        ...e,
        type: 'default' // Ensure type
      }));

      setProject(nodes as any, edges as any);
      onClose();
      alert("Story generated successfully!");
      
    } catch (err: any) {
      setError(err.message || "Failed to generate story");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 rounded-t-xl">
          <div className="flex items-center gap-2 text-indigo-400">
            <Sparkles size={20} />
            <h2 className="text-lg font-bold text-white">AI Story Generator</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Config Section */}
          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Key size={12} /> API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Server size={12} /> Base URL (Optional)
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Cpu size={12} /> Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o-mini, gpt-3.5-turbo, etc."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              Compatible with OpenAI, DeepSeek, Moonshot, or any OpenAI-compatible API.
            </p>
          </div>

          {/* Prompt Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Describe your story
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm text-slate-200 resize-none focus:border-indigo-500 outline-none"
              placeholder="Example: Create a detective story where the player is investigating a murder in a mansion. The start scene is the entrance. The player can choose to go to the kitchen or the library. In the library, they find a clue..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate Story
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
