import { StoryEdge, Condition, Mutation } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { Trash2, Plus, X } from 'lucide-react';

interface Props {
  edge: StoryEdge;
}

export default function ConnectionPanel({ edge }: Props) {
  const updateEdge = useProjectStore((state) => state.updateEdge);
  const deleteEdge = useProjectStore((state) => state.deleteEdge);
  const variables = useProjectStore((state) => state.variables);
  const nodes = useProjectStore((state) => state.nodes);

  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  
  let sourceLabel = '';
  if (sourceNode) {
    if (sourceNode.type === 'storyNode') {
      const action = (sourceNode.data as any).actions?.find((a: any) => a.id === edge.sourceHandle);
      sourceLabel = action?.label || '';
    } else if (sourceNode.type === 'conditionNode') {
      const branch = (sourceNode.data as any).branches?.find((b: any) => b.id === edge.sourceHandle);
      sourceLabel = branch?.label || (edge.sourceHandle?.endsWith('-timeout') ? 'Timeout' : 'Else');
    }
  }

  const handleChange = (field: string, value: any) => {
    updateEdge(edge.id, {
      data: {
        targetTime: 0, // Default value to satisfy type requirement
        ...edge.data,
        [field]: value,
      },
    });
  };

  const handleAddCondition = () => {
    if (variables.length === 0) return;
    const newCondition: Condition = {
      variableId: variables[0].id,
      operator: '==',
      value: '',
    };
    const currentConditions = edge.data?.conditions || [];
    handleChange('conditions', [...currentConditions, newCondition]);
  };

  const handleUpdateCondition = (index: number, field: keyof Condition, value: any) => {
    const conditions = [...(edge.data?.conditions || [])];
    conditions[index] = { ...conditions[index], [field]: value };
    handleChange('conditions', conditions);
  };

  const handleDeleteCondition = (index: number) => {
    const conditions = (edge.data?.conditions || []).filter((_, i) => i !== index);
    handleChange('conditions', conditions);
  };

  const handleAddMutation = () => {
    if (variables.length === 0) return;
    const newMutation: Mutation = {
      variableId: variables[0].id,
      operation: 'set',
      value: '',
    };
    const currentMutations = edge.data?.mutations || [];
    handleChange('mutations', [...currentMutations, newMutation]);
  };

  const handleUpdateMutation = (index: number, field: keyof Mutation, value: any) => {
    const mutations = [...(edge.data?.mutations || [])];
    mutations[index] = { ...mutations[index], [field]: value };
    handleChange('mutations', mutations);
  };

  const handleDeleteMutation = (index: number) => {
    const mutations = (edge.data?.mutations || []).filter((_, i) => i !== index);
    handleChange('mutations', mutations);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-100">Connection</h2>
        <button 
          onClick={() => deleteEdge(edge.id)}
          className="text-slate-400 hover:text-red-400 p-1 transition-colors rounded hover:bg-slate-800"
          title="Delete Connection"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        <div className="bg-slate-900 p-3 rounded border border-slate-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">Source</div>
              <div className="text-sm text-slate-200 font-medium">{sourceNode?.data.label}</div>
              <div className="text-xs text-slate-400">{sourceLabel}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Target</div>
              <div className="text-sm text-slate-200 font-medium">{targetNode?.data.label}</div>
            </div>
          </div>
        </div>
        {/* Target Time */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Target Time (s)</label>
          <input 
            type="number" 
            value={edge.data?.targetTime || 0} 
            onChange={(e) => handleChange('targetTime', Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
            min="0"
            step="0.1"
          />
        </div>

        {/* Conditions */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-slate-300">Conditions</h3>
            <button 
              onClick={handleAddCondition}
              disabled={variables.length === 0}
              className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-400"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          
          <div className="space-y-2">
            {(edge.data?.conditions || []).map((condition, index) => (
              <div key={index} className="bg-slate-800 p-2 rounded border border-slate-700 group hover:border-slate-600 transition-colors">
                <div className="flex gap-2 mb-2 items-center">
                  <select
                    value={condition.variableId}
                    onChange={(e) => handleUpdateCondition(index, 'variableId', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    {variables.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => handleDeleteCondition(index)}
                    className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Condition"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={condition.operator}
                    onChange={(e) => handleUpdateCondition(index, 'operator', e.target.value)}
                    className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none font-mono"
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
                    value={condition.value}
                    onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="Value"
                  />
                </div>
              </div>
            ))}
            {(!edge.data?.conditions || edge.data.conditions.length === 0) && (
              <div className="text-xs text-slate-500 text-center py-4 bg-slate-900/50 rounded border border-dashed border-slate-800">
                No conditions set
              </div>
            )}
          </div>
        </div>

        {/* Mutations */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-slate-300">Data Changes</h3>
            <button 
              onClick={handleAddMutation}
              disabled={variables.length === 0}
              className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-400"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          
          <div className="space-y-2">
            {(edge.data?.mutations || []).map((mutation, index) => (
              <div key={index} className="bg-slate-800 p-2 rounded border border-slate-700 group hover:border-slate-600 transition-colors">
                <div className="flex gap-2 mb-2 items-center">
                  <select
                    value={mutation.variableId}
                    onChange={(e) => handleUpdateMutation(index, 'variableId', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    {variables.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => handleDeleteMutation(index)}
                    className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Change"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={mutation.operation}
                    onChange={(e) => handleUpdateMutation(index, 'operation', e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="set">Set =</option>
                    <option value="add">Add +</option>
                    <option value="subtract">Sub -</option>
                  </select>
                  <input
                    type="text"
                    value={mutation.value}
                    onChange={(e) => handleUpdateMutation(index, 'value', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="Value"
                  />
                </div>
              </div>
            ))}
            {(!edge.data?.mutations || edge.data.mutations.length === 0) && (
              <div className="text-xs text-slate-500 text-center py-4 bg-slate-900/50 rounded border border-dashed border-slate-800">
                No data changes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
