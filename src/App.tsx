import Canvas from './features/editor/Canvas';
import RightPanel from './features/properties/RightPanel';
import PlayerWindow from './features/player/PlayerWindow';
import { useGameEngine } from './store/useRuntimeStore';
import { useProjectStore } from './store/useProjectStore';
import { Play, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  buildExportManifest,
  buildStoryExport,
  CHOICE_EXPORT_MANIFEST_FILE,
  CHOICE_EXPORT_STORY_FILE,
  parseProjectData,
} from './lib/project-format';

function App() {
  const isPlaying = useGameEngine((state) => state.isPlaying);
  const startGame = useGameEngine((state) => state.startGame);
  const setProject = useProjectStore((state) => state.setProject);
  const nodes = useProjectStore((state) => state.nodes);
  const variables = useProjectStore((state) => state.variables);

  const [isStandalone, setIsStandalone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for standalone mode (e.g. ?mode=play)
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'play') {
      setIsStandalone(true);
      setIsLoading(true);

      const loadStandaloneProject = async () => {
        try {
          let storyEntry = CHOICE_EXPORT_STORY_FILE;
          try {
            const manifestResponse = await fetch(CHOICE_EXPORT_MANIFEST_FILE);
            if (manifestResponse.ok) {
              const exportManifest = await manifestResponse.json();
              if (
                exportManifest &&
                typeof exportManifest === 'object' &&
                typeof (exportManifest as Record<string, unknown>).entry === 'string'
              ) {
                storyEntry = (exportManifest as { entry: string }).entry;
              }
            }
          } catch {
            // Backward compatibility: missing manifest falls back to story.json.
          }

          const storyResponse = await fetch(storyEntry);
          if (!storyResponse.ok) {
            throw new Error(`Failed to fetch ${storyEntry}`);
          }
          const rawStory = await storyResponse.json();
          const parsed = parseProjectData(rawStory);

          setProject(parsed.nodes, parsed.edges);
          const currentVars = useProjectStore.getState().variables;
          currentVars.forEach((v) => useProjectStore.getState().removeVariable(v.id));
          parsed.variables.forEach((v) => useProjectStore.getState().addVariable(v));

          setTimeout(() => {
            const startNode = parsed.nodes.find((n) => n.data.isStartNode);
            if (startNode) {
              const initialVars: Record<string, unknown> = {};
              parsed.variables.forEach((v) => {
                initialVars[v.id] = v.defaultValue;
              });
              startGame(startNode, initialVars);
            } else {
              alert('No Start Node found in exported project.');
            }
            setIsLoading(false);
          }, 100);
        } catch (error) {
          console.error('Failed to load standalone project', error);
          setIsLoading(false);
          alert(
            `Failed to load exported files. Please make sure '${CHOICE_EXPORT_STORY_FILE}' exists.`
          );
        }
      };

      loadStandaloneProject();
    }
  }, [setProject, startGame]);

  const handlePlay = () => {
    const startNode = nodes.find(n => n.data.isStartNode);
    if (startNode) {
      const initialVars: Record<string, any> = {};
      variables.forEach(v => initialVars[v.id] = v.defaultValue);
      startGame(startNode, initialVars);
    } else {
      alert("No Start Node found! Please mark a node as [START].");
    }
  };

  const downloadJsonFile = (filename: string, payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const storyExport = buildStoryExport(nodes, useProjectStore.getState().edges, variables);
    const exportManifest = buildExportManifest();
    downloadJsonFile(CHOICE_EXPORT_STORY_FILE, storyExport);
    downloadJsonFile(CHOICE_EXPORT_MANIFEST_FILE, exportManifest);
    alert(
      `Export completed.\n\n` +
      `- ${CHOICE_EXPORT_STORY_FILE}\n` +
      `- ${CHOICE_EXPORT_MANIFEST_FILE}\n\n` +
      `Place both files next to index.html in your web build output, then open index.html?mode=play.`
    );
  };

  if (isStandalone) {
    if (isLoading) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading Game...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen w-screen bg-black overflow-hidden relative">
        <PlayerWindow />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-white overflow-hidden flex-col">
      {/* Header */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20">
        <h1 className="font-bold text-indigo-500 flex items-center gap-2">
          <span className="bg-indigo-500/20 p-1 rounded">🎬</span> Choice Editor
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
          >
            <Share2 size={14} /> Export
          </button>
          <button 
            onClick={handlePlay}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
          >
            <Play size={14} fill="currentColor" /> Play
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative">
          <Canvas />
          {isPlaying && <PlayerWindow />}
        </div>
        <RightPanel />
      </div>
    </div>
  )
}

export default App
