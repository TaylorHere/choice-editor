import { useProjectStore } from '../../store/useProjectStore';
import ConditionPanel from './ConditionPanel';
import NodePanel from './NodePanel';
import ConnectionPanel from './ConnectionPanel';
import VariablePanel from '../variables/VariablePanel';
import { Plus, Layout, Database, FileInput, Download, Beaker, Save, FolderOpen, GitBranch, Share2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { parseScript } from '../../lib/script-parser';
import { StoryNode, StoryEdge, ConditionNodeData, StoryNodeData } from '../../types';
import AIImportModal from '../ai/AIImportModal';
import { Node } from '@xyflow/react';

export default function RightPanel() {
  const nodes = useProjectStore((state) => state.nodes);
  const edges = useProjectStore((state) => state.edges);
  const variables = useProjectStore((state) => state.variables);

  const selectedNode = useProjectStore((state) => state.nodes.find((n) => n.selected));
  const selectedEdge = useProjectStore((state) => state.edges.find((e) => e.selected));
  const addNode = useProjectStore((state) => state.addNode);
  
  const [activeTab, setActiveTab] = useState<'project' | 'variables'>('project');
  const [showImport, setShowImport] = useState(false);
  const [showAIImport, setShowAIImport] = useState(false);
  const [scriptContent, setScriptContent] = useState('');

  const handleAddNode = () => {
    const id = crypto.randomUUID();
    addNode({
      id,
      type: 'storyNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { label: `Node ${id.slice(0, 4)}`, actions: [] },
    });
  };

  const handleAddConditionNode = () => {
    const id = crypto.randomUUID();
    addNode({
      id,
      type: 'conditionNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { 
        label: `Logic ${id.slice(0, 4)}`, 
        branches: [
          { id: crypto.randomUUID(), label: 'True', condition: { variableId: '', operator: '==', value: 'true' } },
          { id: crypto.randomUUID(), label: 'Else' }
        ] 
      },
    });
  };

  const handleImport = () => {
    try {
      const { nodes: newNodes, edges: newEdges } = parseScript(scriptContent);
      useProjectStore.getState().setProject(newNodes, newEdges);
      setShowImport(false);
      setScriptContent('');
    } catch (e) {
      alert('Failed to parse script');
      console.error(e);
    }
  };

  const handleTestMode = () => {
    // Check if we have a saved test template
    const savedTemplate = localStorage.getItem('choice_test_template');
    
    if (savedTemplate) {
      if (confirm('Load saved test template? Click Cancel to use default template.')) {
        try {
          const { nodes, edges } = JSON.parse(savedTemplate);
          useProjectStore.getState().setProject(nodes, edges);
          return;
        } catch (e) {
          console.error('Failed to load template', e);
        }
      }
    }

    if (!confirm('This will replace your current project with the default test project. Continue?')) return;

    const startNodeId = 'start';
    const attackNodeId = 'attack';
    const defenseNodeId = 'defense';
    const attackActionId = 'act-attack';
    const defenseActionId = 'act-defense';

    const testNodes: StoryNode[] = [
      {
        id: startNodeId,
        type: 'storyNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Start',
          isStartNode: true,
          videoSrc: '', // Placeholder
          actions: [
            { id: attackActionId, label: 'Attack', type: 'default' },
            { id: defenseActionId, label: 'Defense', type: 'default' },
          ],
        },
      },
      {
        id: attackNodeId,
        type: 'storyNode',
        position: { x: 500, y: 100 },
        data: {
          label: 'Attack',
          actions: [],
        },
      },
      {
        id: defenseNodeId,
        type: 'storyNode',
        position: { x: 500, y: 300 },
        data: {
          label: 'Defense',
          actions: [],
        },
      },
    ];

    const testEdges: StoryEdge[] = [
      {
        id: `e-${startNodeId}-${attackNodeId}`,
        source: startNodeId,
        target: attackNodeId,
        sourceHandle: attackActionId,
        type: 'default',
        data: { targetTime: 0 },
      },
      {
        id: `e-${startNodeId}-${defenseNodeId}`,
        source: startNodeId,
        target: defenseNodeId,
        sourceHandle: defenseActionId,
        type: 'default',
        data: { targetTime: 0 },
      },
    ];

    useProjectStore.getState().setProject(testNodes, testEdges);
  };

  const handleSaveTemplate = () => {
    if (confirm('Save current project as the Test Template?')) {
      const currentNodes = useProjectStore.getState().nodes;
      const currentEdges = useProjectStore.getState().edges;
      localStorage.setItem('choice_test_template', JSON.stringify({ nodes: currentNodes, edges: currentEdges }));
      alert('Template saved!');
    }
  };

  const handleSaveProject = async () => {
    const projectData = {
      version: '1.0.0',
      project: {
        nodes,
        edges,
        variables,
      },
    };
    
    if (window.ipcRenderer) {
      const result = await window.ipcRenderer.saveProject(JSON.stringify(projectData, null, 2));
      if (result.success) {
        alert(`Project saved to ${result.filePath}`);
      } else if (result.message !== 'Canceled') {
        alert(`Failed to save: ${result.message}`);
      }
    } else {
      // Fallback for browser environment (download file)
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'story.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleExportWeb = () => {
    // 1. Download story.json
    const projectData = {
      version: '1.0.0',
      project: {
        nodes,
        edges,
        variables,
      },
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story.json';
    a.click();
    URL.revokeObjectURL(url);

    // 2. Show instructions
    alert(
      "Export Started!\n\n" +
      "1. 'story.json' has been downloaded.\n" +
      "2. Run 'npm run build:web' to generate the Web Player (dist folder).\n" +
      "3. Place 'story.json' inside the 'dist' folder (next to index.html).\n" +
      "4. Open 'index.html?mode=play' in your browser to play the game."
    );
  };

  const handleLoadProject = async () => {
    if (window.ipcRenderer) {
      const result = await window.ipcRenderer.loadProject();
      if (result.success && result.content) {
        try {
          const data = JSON.parse(result.content);
          if (data.project) {
            useProjectStore.getState().setProject(data.project.nodes || [], data.project.edges || []);
            
            const currentVars = useProjectStore.getState().variables;
            currentVars.forEach(v => useProjectStore.getState().removeVariable(v.id));
            (data.project.variables || []).forEach((v: any) => useProjectStore.getState().addVariable(v));
            
            alert(`Project loaded from ${result.filePath}`);
          } else {
            alert('Invalid project file format');
          }
        } catch (e) {
          console.error(e);
          alert('Failed to parse project file');
        }
      }
    } else {
      // Fallback for browser environment (file input)
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            try {
              const data = JSON.parse(content);
              if (data.project) {
                useProjectStore.getState().setProject(data.project.nodes || [], data.project.edges || []);
                const currentVars = useProjectStore.getState().variables;
                currentVars.forEach(v => useProjectStore.getState().removeVariable(v.id));
                (data.project.variables || []).forEach((v: any) => useProjectStore.getState().addVariable(v));
                alert('Project loaded successfully');
              } else {
                alert('Invalid project file format');
              }
            } catch (err) {
              console.error(err);
              alert('Failed to parse project file');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    }
  };

  if (selectedNode) {
    if (selectedNode.type === 'conditionNode') {
      return (
        <div className="w-80 border-l border-slate-800 bg-slate-900 p-4 h-full flex flex-col shadow-2xl z-10">
          <ConditionPanel node={selectedNode as Node<ConditionNodeData>} />
        </div>
      );
    }
    
    return (
      <div className="w-80 border-l border-slate-800 bg-slate-900 p-4 h-full flex flex-col shadow-2xl z-10">
        <NodePanel node={selectedNode as Node<StoryNodeData>} />
      </div>
    );
  }

  if (selectedEdge) {
    return (
      <div className="w-80 border-l border-slate-800 bg-slate-900 p-4 h-full flex flex-col shadow-2xl z-10">
        <ConnectionPanel edge={selectedEdge} />
      </div>
    );
  }

  // AI Import Modal
  if (showAIImport) {
    return <AIImportModal isOpen={true} onClose={() => setShowAIImport(false)} />;
  }

  if (showImport) {
    return (
      <div className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col shadow-2xl z-10">
        <div className="flex items-center gap-2 p-4 border-b border-slate-800">
          <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-slate-200">
            &larr;
          </button>
          <h2 className="text-lg font-semibold text-slate-100">Import Script</h2>
        </div>
        <div className="p-4 flex-1 flex flex-col gap-4">
          <p className="text-xs text-slate-400">
            Paste your script in the format below. It will replace the current project.
          </p>
          <textarea
            value={scriptContent}
            onChange={(e) => setScriptContent(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-xs font-mono text-slate-200 resize-none focus:border-indigo-500 outline-none"
            placeholder={`## Scene Title {#id} [START]
Description...

- [Option 1] -> (target_id)`}
          />
          <button
            onClick={handleImport}
            className="w-full flex items-center justify-center gap-2 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition-colors"
          >
            <Download size={16} /> Import & Layout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col shadow-2xl z-10">
      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('project')}
          className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'project' 
              ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/30' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          <Layout size={14} /> Project
        </button>
        <button
          onClick={() => setActiveTab('variables')}
          className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'variables' 
              ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/30' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          <Database size={14} /> Variables
        </button>
      </div>

      <div className="p-4 flex-1 overflow-hidden flex flex-col">
        {activeTab === 'project' ? (
          <div className="flex flex-col h-full gap-4">
            {/* Creation Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleAddNode}
                className="flex-1 flex items-center justify-center gap-2 rounded bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20 active:scale-95 text-xs font-medium"
              >
                <Plus size={16} /> Add Scene
              </button>
              <button
                onClick={handleAddConditionNode}
                className="flex-1 flex items-center justify-center gap-2 rounded bg-amber-600 px-4 py-2.5 text-white hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20 active:scale-95 text-xs font-medium"
              >
                <GitBranch size={16} /> Add Logic
              </button>
            </div>
            
            <button
              onClick={() => setShowAIImport(true)}
              className="w-full flex items-center justify-center gap-2 rounded bg-purple-600/20 border border-purple-500/50 px-4 py-2 text-purple-200 hover:bg-purple-600/30 hover:text-white transition-all active:scale-95 text-xs font-medium"
            >
              <Sparkles size={16} /> Generate with AI
            </button>

            {/* Project IO */}
            <div className="bg-slate-950/50 p-3 rounded border border-slate-800 space-y-2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Project</p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={handleSaveProject}
                  className="flex flex-col items-center justify-center gap-1 rounded bg-slate-800 border border-slate-700 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  title="Save Project (JSON)"
                >
                  <Save size={16} />
                  <span className="text-[10px]">Save</span>
                </button>
                <button
                  onClick={handleLoadProject}
                  className="flex flex-col items-center justify-center gap-1 rounded bg-slate-800 border border-slate-700 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  title="Load Project (JSON)"
                >
                  <FolderOpen size={16} />
                  <span className="text-[10px]">Load</span>
                </button>
                <button
                  onClick={() => setShowImport(true)}
                  className="flex flex-col items-center justify-center gap-1 rounded bg-slate-800 border border-slate-700 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  title="Import Script"
                >
                  <FileInput size={16} />
                  <span className="text-[10px]">Import</span>
                </button>
                <button
                  onClick={handleExportWeb}
                  className="flex flex-col items-center justify-center gap-1 rounded bg-indigo-900/50 border border-indigo-700/50 p-2 text-indigo-300 hover:bg-indigo-800 hover:text-white transition-colors"
                  title="Export for Web Player"
                >
                  <Share2 size={16} />
                  <span className="text-[10px]">Web</span>
                </button>
              </div>
            </div>

            {/* Test & Template */}
            <div className="bg-slate-950/50 p-3 rounded border border-slate-800 space-y-2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Test & Template</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleTestMode}
                  className="flex items-center justify-center gap-2 rounded bg-slate-800 border border-slate-700 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-xs"
                >
                  <Beaker size={14} /> Load Test
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="flex items-center justify-center gap-2 rounded bg-slate-800 border border-slate-700 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-xs"
                >
                  <Layout size={14} /> Save Template
                </button>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-800">
               <div className="flex justify-between text-xs text-slate-500 font-mono">
                 <span>Nodes: {nodes.length}</span>
                 <span>Edges: {edges.length}</span>
               </div>
            </div>
          </div>
        ) : (
          <VariablePanel />
        )}
      </div>
    </div>
  );
}
