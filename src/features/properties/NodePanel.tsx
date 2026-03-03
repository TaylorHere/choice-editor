import { StoryAction, StoryNodeData } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { Trash2, Plus, X, Clock, AlertCircle, Zap } from 'lucide-react';
import { useState } from 'react';
import { Node } from '@xyflow/react';

interface Props {
  node: Node<StoryNodeData>;
}

export default function NodePanel({ node }: Props) {
  const updateNode = useProjectStore((state) => state.updateNode);
  const deleteNode = useProjectStore((state) => state.deleteNode);
  const variables = useProjectStore((state) => state.variables);
  const nodes = useProjectStore((state) => state.nodes);
  
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    // Single Start Node Constraint
    if (field === 'isStartNode' && value === true) {
      const existingStartNode = nodes.find(n => n.type === 'storyNode' && (n.data as StoryNodeData).isStartNode && n.id !== node.id);
      if (existingStartNode) {
        // Unset previous start node
        updateNode(existingStartNode.id, { 
          data: { ...existingStartNode.data, isStartNode: false } 
        });
      }
    }

    updateNode(node.id, {
      data: {
        ...node.data,
        [field]: value,
      },
    });
  };

  const handleAddAction = () => {
    const newAction = {
      id: crypto.randomUUID(),
      label: 'New Action',
    };
    const currentActions = node.data.actions || [];
    updateNode(node.id, {
      data: {
        ...node.data,
        actions: [...currentActions, newAction],
      },
    });
    setExpandedActionId(newAction.id);
  };

  const updateAction = (actionId: string, updates: Partial<StoryAction>) => {
    const newActions = (node.data.actions || []).map(a => 
      a.id === actionId ? { ...a, ...updates } : a
    );
    handleChange('actions', newActions);
  };

  const handleDeleteAction = (actionId: string) => {
    const newActions = (node.data.actions || []).filter(a => a.id !== actionId);
    handleChange('actions', newActions);
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // In Electron environment, we can use webUtils (if exposed) or fallback to 'path' property which Electron adds to File object
      // But standard File object in browser doesn't have path. In Electron renderer it does.
      // @ts-ignore
      const filePath = file.path;
      
      if (filePath) {
        handleChange('videoSrc', filePath);
      } else {
        console.warn("Could not retrieve file path. Ensure you are running in Electron.");
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-100">Node Properties</h2>
        <button 
          onClick={() => deleteNode(node.id)}
          className="text-slate-400 hover:text-red-400 p-1 transition-colors rounded hover:bg-slate-800"
          title="Delete Node"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {/* ID */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">ID</label>
          <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-400 font-mono truncate" title={node.id}>
            {node.id}
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Label</label>
          <input 
            type="text" 
            value={node.data.label} 
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
            placeholder="Node Name"
          />
        </div>

        {/* Video Source */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Video Source</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={node.data.videoSrc || ''} 
              onChange={(e) => handleChange('videoSrc', e.target.value)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleVideoDrop}
              placeholder="/path/to/video.mp4 (Drag & Drop here)"
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Drag and drop file to get absolute path</p>
        </div>

        {/* Is Start Node */}
        <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded border border-slate-800 hover:border-slate-700 transition-colors">
          <input 
            type="checkbox" 
            id="isStartNode"
            checked={node.data.isStartNode || false}
            onChange={(e) => handleChange('isStartNode', e.target.checked)}
            className="w-4 h-4 rounded bg-slate-950 border-slate-600 text-indigo-500 focus:ring-offset-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="isStartNode" className="text-sm text-slate-300 cursor-pointer select-none">Set as Start Node</label>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-slate-300">Actions</h3>
            <button 
              onClick={handleAddAction}
              className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors shadow-sm"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          
          <div className="space-y-3">
            {node.data.actions && node.data.actions.length > 0 ? (
              node.data.actions.map((action) => (
                <div key={action.id} className="bg-slate-800 rounded border border-slate-700 overflow-hidden">
                  {/* Action Header */}
                  <div className="flex items-center gap-2 p-2">
                    <button 
                      onClick={() => setExpandedActionId(expandedActionId === action.id ? null : action.id)}
                      className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <div className={`transition-transform duration-200 ${expandedActionId === action.id ? 'rotate-90' : ''}`}>▶</div>
                    </button>
                    <input 
                      type="text" 
                      value={action.label}
                      onChange={(e) => updateAction(action.id, { label: e.target.value })}
                      className="flex-1 bg-transparent border-none p-0 text-xs text-slate-200 focus:ring-0 placeholder-slate-600"
                      placeholder="Action Label"
                    />
                    <div className="flex items-center gap-1">
                      {action.type === 'auto' && <Zap size={12} className="text-yellow-400" />}
                      {action.timeMode === 'custom' && <Clock size={12} className="text-blue-400" />}
                      {action.showCondition && <AlertCircle size={12} className="text-amber-400" />}
                      <button 
                        onClick={() => handleDeleteAction(action.id)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-opacity"
                        title="Delete Action"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Properties */}
                  {expandedActionId === action.id && (
                    <div className="p-3 border-t border-slate-700 bg-slate-900/30 space-y-3">
                      {/* Action Type */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                            <Zap size={10} /> Action Type
                          </label>
                        </div>
                        <select
                          value={action.type || 'default'}
                          onChange={(e) => updateAction(action.id, { 
                            type: e.target.value as 'default' | 'auto'
                          })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                        >
                          <option value="default">Button (Manual Click)</option>
                          <option value="auto">Auto Jump (On Video End)</option>
                        </select>
                      </div>

                      {/* Time Range - Only for default actions */}
                      {action.type !== 'auto' && (
                        <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                            <Clock size={10} /> Time Settings
                          </label>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <select
                            value={action.timeMode || 'onEnd'}
                            onChange={(e) => updateAction(action.id, { 
                              timeMode: e.target.value as 'onEnd' | 'custom'
                            })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                          >
                            <option value="onEnd">Show on End</option>
                            <option value="custom">Show during Time Range</option>
                          </select>

                          {action.timeMode === 'custom' && (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="block text-[10px] text-slate-500 mb-0.5">Start (ms)</label>
                                  <input 
                                    type="number" 
                                    value={action.startTime || 0}
                                    onChange={(e) => updateAction(action.id, { 
                                      startTime: Math.max(0, Number(e.target.value))
                                    })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                                    step="100"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-[10px] text-slate-500 mb-0.5">End (ms)</label>
                                  <input 
                                    type="number" 
                                    value={action.endTime || 0}
                                    onChange={(e) => updateAction(action.id, { 
                                      endTime: Math.max(0, Number(e.target.value))
                                    })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                                    step="100"
                                  />
                                </div>
                              </div>
                              
                              <div className="flex gap-2 border-t border-slate-800 pt-2">
                                <div className="flex-1">
                                  <label className="block text-[10px] text-slate-500 mb-0.5">Pos X (%)</label>
                                  <input 
                                    type="number" 
                                    value={action.position?.x || 50}
                                    onChange={(e) => updateAction(action.id, { 
                                      position: { ...(action.position || { y: 80 }), x: Number(e.target.value) } 
                                    })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                                    min="0" max="100"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-[10px] text-slate-500 mb-0.5">Pos Y (%)</label>
                                  <input 
                                    type="number" 
                                    value={action.position?.y || 80}
                                    onChange={(e) => updateAction(action.id, { 
                                      position: { ...(action.position || { x: 50 }), y: Number(e.target.value) } 
                                    })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                                    min="0" max="100"
                                  />
                                </div>
                              </div>

                              <div className="border-t border-slate-800 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={!!action.hasTimeout}
                                    onChange={(e) => updateAction(action.id, { 
                                      hasTimeout: e.target.checked
                                    })}
                                    className="w-3 h-3 rounded bg-slate-950 border-slate-600 text-indigo-500 focus:ring-offset-0 focus:ring-1 focus:ring-indigo-500"
                                  />
                                  <span className="text-[10px] text-slate-300">Enable Timeout Jump</span>
                                </label>
                                {action.hasTimeout && (
                                  <p className="text-[10px] text-slate-500 mt-1 italic">
                                    A gray output handle will appear on the node. Connect it to the target node.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Display Condition */}
                      <div className="space-y-2 pt-2 border-t border-slate-700/50">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                            <AlertCircle size={10} /> Condition
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={!!action.showCondition}
                              onChange={(e) => {
                                if (e.target.checked && variables.length > 0) {
                                  updateAction(action.id, { 
                                    showCondition: { variableId: variables[0].id, operator: '==', value: '' } 
                                  });
                                } else {
                                  updateAction(action.id, { showCondition: undefined });
                                }
                              }}
                              disabled={variables.length === 0}
                              className="w-3 h-3 rounded bg-slate-950 border-slate-600 text-indigo-500 disabled:opacity-50"
                            />
                            <span className="text-[10px] text-slate-400">Enable</span>
                          </label>
                        </div>

                        {action.showCondition && (
                          <div className="space-y-2">
                            <select
                              value={action.showCondition.variableId}
                              onChange={(e) => updateAction(action.id, { 
                                showCondition: { ...action.showCondition!, variableId: e.target.value } 
                              })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                            >
                              {variables.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <select
                                value={action.showCondition.operator}
                                onChange={(e) => updateAction(action.id, { 
                                  showCondition: { ...action.showCondition!, operator: e.target.value as any } 
                                })}
                                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                              >
                                <option value="==">==</option>
                                <option value="!=">!=</option>
                                <option value=">">&gt;</option>
                                <option value="<">&lt;</option>
                                <option value=">=">&gt;=</option>
                                <option value="<=">&lt;=</option>
                              </select>
                              <input
                                type="text"
                                value={action.showCondition.value}
                                onChange={(e) => updateAction(action.id, { 
                                  showCondition: { ...action.showCondition!, value: e.target.value } 
                                })}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                                placeholder="Value"
                              />
                            </div>
                          </div>
                        )}
                        {variables.length === 0 && !action.showCondition && (
                          <div className="text-[10px] text-amber-500 italic">Add variables to enable conditions</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 text-center py-6 bg-slate-900/50 rounded border border-dashed border-slate-800">
                No actions defined
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
