import { Trash2, Plus } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { ConditionNodeData, LogicBranch, Mutation } from '../../types';
import { Node } from '@xyflow/react';

interface Props {
  node: Node<ConditionNodeData>;
}

export default function ConditionPanel({ node }: Props) {
  const updateNode = useProjectStore((state) => state.updateNode);
  const deleteNode = useProjectStore((state) => state.deleteNode);
  const variables = useProjectStore((state) => state.variables);

  const updateData = (updates: Partial<ConditionNodeData>) => {
    updateNode(node.id, { data: { ...node.data, ...updates } });
  };

  const addBranch = () => {
    const newBranch: LogicBranch = {
      id: crypto.randomUUID(),
      label: 'New Condition',
      condition: { variableId: '', operator: '==', value: '' }
    };
    updateData({ branches: [...(node.data.branches || []), newBranch] });
  };

  const removeBranch = (branchId: string) => {
    updateData({ branches: (node.data.branches || []).filter(b => b.id !== branchId) });
  };

  const updateBranch = (branchId: string, updates: Partial<LogicBranch>) => {
    updateData({
      branches: (node.data.branches || []).map(b => 
        b.id === branchId ? { ...b, ...updates } : b
      )
    });
  };

  const addMutation = () => {
    const newMutation: Mutation = {
      variableId: variables[0]?.id || '',
      operation: 'set',
      value: ''
    };
    updateData({ mutations: [...(node.data.mutations || []), newMutation] });
  };

  const removeMutation = (index: number) => {
    const newMutations = [...(node.data.mutations || [])];
    newMutations.splice(index, 1);
    updateData({ mutations: newMutations });
  };

  const updateMutation = (index: number, updates: Partial<Mutation>) => {
    const newMutations = [...(node.data.mutations || [])];
    newMutations[index] = { ...newMutations[index], ...updates };
    updateData({ mutations: newMutations });
  };

  return (
    <div className="flex flex-col h-full text-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-amber-500">Logic Node</h2>
        <button 
          onClick={() => {
            if (confirm('Delete this logic node?')) deleteNode(node.id);
          }}
          className="text-slate-500 hover:text-red-500 transition-colors"
          title="Delete Node"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {/* Basic Info */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Label</label>
          <input
            type="text"
            value={node.data.label}
            onChange={(e) => updateData({ label: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none transition-colors"
          />
        </div>

        {/* Mutations Section */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-emerald-400">Mutations (Execute First)</label>
            <button
              onClick={addMutation}
              className="p-1 rounded bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 transition-colors"
              title="Add Mutation"
            >
              <Plus size={14} />
            </button>
          </div>
          
          <div className="space-y-2">
            {(node.data.mutations || []).map((mutation, index) => (
              <div key={index} className="bg-slate-950/50 p-2 rounded border border-slate-800 space-y-2">
                <div className="flex gap-2">
                  <select
                    value={mutation.variableId}
                    onChange={(e) => updateMutation(index, { variableId: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                  >
                    <option value="">Select Variable</option>
                    {variables.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  <button onClick={() => removeMutation(index)} className="text-slate-500 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={mutation.operation}
                    onChange={(e) => updateMutation(index, { operation: e.target.value as any })}
                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                  >
                    <option value="set">=</option>
                    <option value="add">+</option>
                    <option value="subtract">-</option>
                  </select>
                  <input
                    type="text"
                    value={mutation.value}
                    onChange={(e) => updateMutation(index, { value: e.target.value })}
                    placeholder="Value"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                  />
                </div>
              </div>
            ))}
            {(!node.data.mutations?.length) && (
              <p className="text-[10px] text-slate-600 italic">No mutations configured</p>
            )}
          </div>
        </div>

        {/* Branches Section */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-amber-400">Branches (Evaluate sequentially)</label>
            <button
              onClick={addBranch}
              className="p-1 rounded bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 transition-colors"
              title="Add Branch"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {(node.data.branches || []).map((branch, index) => (
              <div key={branch.id} className="bg-slate-950/50 p-3 rounded border border-slate-800 space-y-2 relative group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-500">Branch #{index + 1}</span>
                  <button onClick={() => removeBranch(branch.id)} className="text-slate-500 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <input
                  type="text"
                  value={branch.label}
                  onChange={(e) => updateBranch(branch.id, { label: e.target.value })}
                  placeholder="Label (e.g. Success)"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs mb-2"
                />

                {/* Condition Config */}
                {branch.condition ? (
                  <div className="space-y-2 bg-slate-900 p-2 rounded border border-slate-800/50">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-500">Condition</label>
                      <button 
                        onClick={() => updateBranch(branch.id, { condition: undefined })}
                        className="text-[10px] text-amber-500 hover:underline"
                      >
                        Make Else
                      </button>
                    </div>
                    <select
                      value={branch.condition.variableId}
                      onChange={(e) => updateBranch(branch.id, { 
                        condition: { ...branch.condition!, variableId: e.target.value } 
                      })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
                    >
                      <option value="">Select Variable</option>
                      {variables.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <select
                        value={branch.condition.operator}
                        onChange={(e) => updateBranch(branch.id, { 
                          condition: { ...branch.condition!, operator: e.target.value as any } 
                        })}
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
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
                        value={branch.condition.value}
                        onChange={(e) => updateBranch(branch.id, { 
                          condition: { ...branch.condition!, value: e.target.value } 
                        })}
                        placeholder="Value"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800/50">
                    <span className="text-xs text-slate-400 italic">Else (Fallback)</span>
                    <button 
                      onClick={() => updateBranch(branch.id, { 
                        condition: { variableId: variables[0]?.id || '', operator: '==', value: '' } 
                      })}
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      Add Condition
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
