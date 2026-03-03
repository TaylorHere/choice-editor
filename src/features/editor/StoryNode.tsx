import { Handle, Position, NodeProps, useUpdateNodeInternals, Node } from '@xyflow/react';
import { StoryNodeData } from '../../types';
import { useRef, useEffect, useState } from 'react';
import { Play } from 'lucide-react';

export default function StoryNode({ id, data, selected }: NodeProps<Node<StoryNodeData>>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const updateNodeInternals = useUpdateNodeInternals();

  // Force update handles when actions structure changes (specifically timeout)
  useEffect(() => {
    updateNodeInternals(id);
  }, [data.actions, id, updateNodeInternals]);

  // Handle video preview logic
  useEffect(() => {
    if (videoRef.current && data.videoSrc) {
      // Handle local file paths
      let src = data.videoSrc;
      if (!src.startsWith('http') && !src.startsWith('file://')) {
        // In Web environment (no window.ipcRenderer), local paths are invalid unless they are relative to public
        if (!window.ipcRenderer) {
          // Just leave it as is if it might be a relative path or public URL
          // But warn if it looks like an absolute file path
          if (src.startsWith('/') || /^[a-zA-Z]:/.test(src)) {
            console.warn('Local file paths are not supported in Web mode. Please use a URL.', src);
            // Optionally set a placeholder or error state
          }
        } else {
          // Electron mode
          if (src.startsWith('/') || /^[a-zA-Z]:/.test(src)) {
            src = `file://${src}`;
          }
        }
      }
      videoRef.current.src = src;
      // Seek to 3s for thumbnail
      videoRef.current.currentTime = 3;
    }
  }, [data.videoSrc]);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isHovering) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 3; // Reset to thumbnail
    }
  }, [isHovering]);

  return (
    <div 
      className={`min-w-[200px] rounded-lg border bg-slate-900 shadow-xl transition-all ${
        selected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-700 hover:border-slate-600'
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-slate-500 !w-3 !h-3 !border-0" 
        style={{
          width: '12px',
          height: '12px',
          background: '#64748b',
          zIndex: 10,
        }}
        isConnectableStart={false}
      >
        {/* Invisible larger hit area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent cursor-crosshair" />
      </Handle>
      
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-800/50 rounded-t-lg">
        <div className="font-semibold text-slate-200 text-sm truncate pr-2">{data.label}</div>
        {data.isStartNode && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">
            START
          </span>
        )}
      </div>
      
      <div className="p-3 space-y-3">
        {/* Video Preview */}
        <div className="w-[200px] h-[112px] bg-slate-950 rounded border border-slate-800 overflow-hidden relative group">
          {data.videoSrc ? (
            <>
              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
              />

              {!isHovering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play size={20} className="text-white/70" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs italic">
              No Video
            </div>
          )}
        </div>

        {/* Actions List */}
        <div className="space-y-2">
          {data.actions && data.actions.length > 0 ? (
            data.actions.map((action) => (
              <div key={action.id} className="relative group/action">
                <div className="bg-slate-700 px-3 py-1.5 rounded text-xs text-slate-300 border border-slate-600 flex justify-between items-center hover:border-indigo-500/50 transition-colors cursor-pointer">
                  <span>{action.label}</span>
                  {action.showCondition && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Has Condition"></span>
                  )}
                </div>
                {/* Output Handle for this specific action */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={action.id}
                  className={`!w-3 !h-3 !border-2 !border-slate-800 !-right-4 ${
                    action.type === 'auto' 
                      ? '!bg-yellow-400' 
                      : action.timeMode === 'custom' 
                        ? '!bg-cyan-400' 
                        : '!bg-indigo-500'
                  }`}
                  style={{ 
                    top: action.hasTimeout ? '30%' : '50%',
                    zIndex: 10,
                  }}
                >
                  {/* Invisible larger hit area */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent cursor-crosshair" />
                </Handle>

                {/* Timeout Handle (Gray) */}
                {action.hasTimeout && (
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`${action.id}-timeout`}
                    className="!w-3 !h-3 !border-2 !border-slate-800 !bg-slate-400 !-right-4"
                    style={{ 
                      top: '70%',
                      zIndex: 10,
                    }}
                  >
                    {/* Invisible larger hit area */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent cursor-crosshair" />
                  </Handle>
                )}
              </div>
            ))
          ) : (
            <div className="text-[10px] text-slate-600 text-center py-1 italic">No Actions Configured</div>
          )}
        </div>
      </div>
    </div>
  );
}
