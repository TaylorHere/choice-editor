import { X } from 'lucide-react';
import { useGameEngine } from '../../store/useRuntimeStore';
import VideoPlayer from './VideoPlayer';
import Overlay from './Overlay';
import { useState } from 'react';

export default function PlayerWindow() {
  const endGame = useGameEngine((state) => state.endGame);
  
  // Shared player state
  const [currentTime, setCurrentTime] = useState(0);
  const [isEnded, setIsEnded] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={endGame}
          className="bg-black/50 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 relative w-full h-full">
        <VideoPlayer 
          currentTime={currentTime}
          isEnded={isEnded}
          onTimeUpdate={setCurrentTime}
          onEnded={setIsEnded}
        />
        <Overlay 
          currentTime={currentTime}
          isEnded={isEnded}
          setIsEnded={setIsEnded}
        />
      </div>
    </div>
  );
}
