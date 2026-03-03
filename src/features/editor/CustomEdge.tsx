import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';
import { StoryEdge } from '../../types';
import { GitBranch, AlertCircle } from 'lucide-react';

export default function CustomEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps<StoryEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Use optional chaining for safety, although data should be defined
  const hasConditions = data?.conditions && data.conditions.length > 0;
  const hasMutations = data?.mutations && data.mutations.length > 0;

  return (
    <>
      {/* Invisible thicker path for easier clicking */}
      <BaseEdge
        path={edgePath}
        style={{
          strokeWidth: 20,
          stroke: 'transparent',
          cursor: 'pointer',
        }}
      />
      {/* Visible path */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? '#6366f1' : '#64748b',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {(hasConditions || hasMutations) && (
            <div className="flex gap-1 bg-slate-900 border border-slate-700 rounded-md p-1 shadow-lg hover:border-indigo-500 transition-colors cursor-pointer">
              {hasConditions && (
                <div className="text-amber-500" title="Has Conditions">
                  <AlertCircle size={12} />
                </div>
              )}
              {hasMutations && (
                <div className="text-emerald-500" title="Has Data Changes">
                  <GitBranch size={12} />
                </div>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
