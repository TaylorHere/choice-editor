import { useRef, useEffect, useState } from 'react';
import { useGameEngine } from '../../store/useRuntimeStore';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface Props {
  currentTime: number;
  isEnded: boolean;
  onTimeUpdate: (time: number) => void;
  onEnded: (ended: boolean) => void;
}

export default function VideoPlayer({ currentTime, isEnded, onTimeUpdate, onEnded }: Props) {
  const currentNode = useGameEngine((state) => state.currentNode);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // If no video source or video failed, simulate a timer for custom timed actions
    // Check if it's a story node before checking videoSrc
    if (currentNode && currentNode.type === 'storyNode' && !(currentNode.data as any).videoSrc) {
      let time = 0;
      const interval = setInterval(() => {
        time += 100;
        onTimeUpdate(time);
        // Stop after 5 seconds to prevent infinite counting
        if (time >= 5000) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [currentNode]);

  useEffect(() => {
    if (currentNode && currentNode.type === 'storyNode') {
      const storyData = currentNode.data as any; // Cast because NodeData is generic
      if (storyData.videoSrc && videoRef.current) {
        // Handle local file paths
        let src = storyData.videoSrc as string;
        // If it looks like an absolute path and doesn't start with http/file, prepend file://
        if (!src.startsWith('http') && !src.startsWith('file://')) {
          // In Web environment (no window.ipcRenderer), local paths are invalid unless they are relative to public
          if (!window.ipcRenderer) {
            // Just leave it as is if it might be a relative path or public URL
            // But warn if it looks like an absolute file path
            if (src.startsWith('/') || /^[a-zA-Z]:/.test(src)) {
              // Warning handled elsewhere or acceptable risk
            }
          } else {
            // Electron mode
            if (src.startsWith('/') || /^[a-zA-Z]:/.test(src)) {
              src = `file://${src}`;
            }
          }
        }
        
        videoRef.current.src = src;
        videoRef.current.load();
        onEnded(false);
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        // No video source: Treat as immediately ended (static image or placeholder)
        onEnded(true);
        setIsPlaying(false);
      }
    }
  }, [currentNode]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      if (isEnded) {
        videoRef.current.currentTime = 0;
        onEnded(false);
      }
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime * 1000); // Convert to ms immediately
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onEnded(true);
  };

  const handleError = (e: any) => {
    console.error("Video playback error:", e);
    // If video fails, treat as ended so user isn't stuck
    setIsPlaying(false);
    onEnded(true);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration * 1000); // Convert to ms
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      onEnded(false);
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const getCurrentVideoSrc = () => {
    if (currentNode && currentNode.type === 'storyNode') {
      return (currentNode.data as any).videoSrc;
    }
    return undefined;
  };

  return (
    <div className="relative w-full h-full bg-black group flex items-center justify-center">
      {getCurrentVideoSrc() ? (
        <video
          ref={videoRef}
          className="max-w-full max-h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={handleError}
          onClick={togglePlay}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-slate-500">
          No Video Source
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4">
          <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500" 
              style={{ width: `${(currentTime / duration) * 100}%` }} 
            />
          </div>

          <button onClick={handleRestart} className="text-white hover:text-indigo-400 transition-colors">
            <RotateCcw size={20} />
          </button>
          
          <span className="text-xs text-slate-300 font-mono">
            {(currentTime / 1000).toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
}
