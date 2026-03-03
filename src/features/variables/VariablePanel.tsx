import { useProjectStore } from '../../store/useProjectStore';
import { Plus, Trash2, Save } from 'lucide-react';
import { useState } from 'react';
import { Variable } from '../../types';

export default function VariablePanel() {
  const variables = useProjectStore((state) => state.variables);
  const addVariable = useProjectStore((state) => state.addVariable);
  const updateVariable = useProjectStore((state) => state.updateVariable);
  const removeVariable = useProjectStore((state) => state.removeVariable);
  
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<Variable['type']>('string');
  const [newIsPersistent, setNewIsPersistent] = useState(false);

  const handleAdd = () => {
    if (!newVarName.trim()) return;
    
    addVariable({
      id: crypto.randomUUID(),
      name: newVarName,
      type: newVarType,
      defaultValue: newVarType === 'number' ? 0 : newVarType === 'boolean' ? false : '',
      isPersistent: newIsPersistent,
    });
    
    setNewVarName('');
    setNewIsPersistent(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100">Global Variables</h2>
      </div>

      {/* Add New Variable Form */}
      <div className="bg-slate-800/50 p-3 rounded border border-slate-800 mb-6 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
          <input 
            type="text" 
            value={newVarName}
            onChange={(e) => setNewVarName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:border-indigo-500 outline-none placeholder-slate-600"
            placeholder="e.g. score"
          />
        </div>
        
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
            <select 
              value={newVarType}
              onChange={(e) => setNewVarType(e.target.value as Variable['type'])}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:border-indigo-500 outline-none"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
            </select>
          </div>
          
          <div className="pb-2">
             <label className="flex items-center gap-2 cursor-pointer select-none" title="Save across sessions">
               <input 
                 type="checkbox" 
                 checked={newIsPersistent}
                 onChange={(e) => setNewIsPersistent(e.target.checked)}
                 className="w-4 h-4 rounded bg-slate-950 border-slate-600 text-indigo-500 focus:ring-offset-0 focus:ring-1 focus:ring-indigo-500"
               />
               <Save size={14} className={newIsPersistent ? "text-indigo-400" : "text-slate-500"} />
             </label>
          </div>
        </div>

        <button 
          onClick={handleAdd}
          disabled={!newVarName.trim()}
          className="w-full flex items-center justify-center gap-1.5 rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Variable List */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {variables.length > 0 ? (
          variables.map((v) => (
            <div key={v.id} className="bg-slate-800 p-2.5 rounded border border-slate-700 group hover:border-slate-600 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 mr-2 flex items-center gap-1">
                  <input 
                    type="text" 
                    value={v.name}
                    onChange={(e) => updateVariable(v.id, { name: e.target.value })}
                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-200 focus:ring-0 placeholder-slate-500"
                    placeholder="Variable Name"
                  />
                  {v.isPersistent && (
                    <div title="Persistent">
                      <Save size={10} className="text-amber-500" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => removeVariable(v.id)}
                  className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Variable"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="flex gap-2 text-xs">
                <div className="bg-slate-950 px-2 py-1 rounded text-slate-400 font-mono border border-slate-800">
                  {v.type}
                </div>
                <div className="flex-1 flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  <span className="text-slate-500">Default:</span>
                  {v.type === 'boolean' ? (
                    <select
                      value={String(v.defaultValue)}
                      onChange={(e) => updateVariable(v.id, { defaultValue: e.target.value === 'true' })}
                      className="flex-1 bg-transparent border-none p-0 text-slate-300 focus:ring-0"
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input 
                      type="text"
                      value={String(v.defaultValue)}
                      onChange={(e) => {
                        let val: any = e.target.value;
                        if (v.type === 'number') val = Number(val);
                        updateVariable(v.id, { defaultValue: val });
                      }}
                      className="flex-1 bg-transparent border-none p-0 text-slate-300 focus:ring-0"
                    />
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            No variables yet
          </div>
        )}
      </div>
    </div>
  );
}
