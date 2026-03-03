import { Handle, Position, NodeProps } from '@xyflow/react';
import { ConditionNodeData } from '../../types';
import { GitBranch, ArrowRight } from 'lucide-react';

// We need to type cast because StoryNode type is a union now
interface Props extends NodeProps {
  data: ConditionNodeData;
}

export default function ConditionNode({ data, selected }: Props) {
  return (
    <div 
      className={`min-w-[150px] rounded-lg border bg-slate-900/90 shadow-xl transition-all ${
        selected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-amber-700 hover:border-amber-600'
      }`}
    >
      {/* Input Handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-amber-500 !w-3 !h-3 !border-0"
        style={{
          zIndex: 10,
        }}
      />

      {/* Header */}
      <div className="p-2 border-b border-amber-800/50 flex items-center gap-2 bg-amber-900/20 rounded-t-lg">
        <GitBranch size={14} className="text-amber-500" />
        <div className="font-semibold text-amber-100 text-xs truncate">{data.label || 'Logic Node'}</div>
      </div>

      {/* Content */}
      <div className="p-2 space-y-2">
        {data.mutations && data.mutations.length > 0 && (
          <div className="text-[10px] text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/50">
            {data.mutations.length} mutations
          </div>
        )}

        <div className="space-y-1">
          {data.branches && data.branches.map((branch) => {
            const isFallback = !branch.condition;
            return (
              <div 
                key={branch.id} 
                className={`relative group/branch flex items-center justify-between px-2 py-1.5 rounded text-xs border ${
                  isFallback 
                    ? 'bg-slate-800/50 border-slate-700/50 italic text-slate-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span className="truncate max-w-[100px]" title={branch.label}>
                  {branch.label}
                  {isFallback && <span className="ml-1 text-[9px] text-amber-500/80">(Else)</span>}
                </span>
                <ArrowRight size={10} className={isFallback ? "text-slate-600" : "text-slate-500"} />
                
                {/* Output Handle for Branch */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={branch.id}
                  className={`!w-2.5 !h-2.5 !border-2 !border-slate-800 !-right-3.5 ${
                    isFallback ? '!bg-slate-500' : '!bg-amber-500'
                  }`}
                  style={{
                    zIndex: 10,
                  }}
                />
              </div>
            );
          })}
          {(!data.branches || data.branches.length === 0) && (
            <div className="text-[10px] text-slate-500 text-center italic">No branches</div>
          )}
        </div>
      </div>
    </div>
  );
}
