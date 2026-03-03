import { create } from 'zustand';
import { StoryNode } from '../types';

interface RuntimeStore {
  isPlaying: boolean;
  currentNode: StoryNode | null;
  variables: Record<string, any>; // id -> value
  
  // Actions
  startGame: (startNode: StoryNode, initialVariables: Record<string, any>) => void;
  endGame: () => void;
  setCurrentNode: (node: StoryNode) => void;
  setVariable: (id: string, value: any) => void;
}

export const useGameEngine = create<RuntimeStore>((set) => ({
  isPlaying: false,
  currentNode: null,
  variables: {},

  startGame: (startNode, initialVariables) => {
    set({
      isPlaying: true,
      currentNode: startNode,
      variables: initialVariables,
    });
  },

  endGame: () => {
    set({
      isPlaying: false,
      currentNode: null,
      variables: {},
    });
  },

  setCurrentNode: (node) => {
    set({ currentNode: node });
  },

  setVariable: (id, value) => {
    set((state) => ({
      variables: {
        ...state.variables,
        [id]: value,
      },
    }));
  },
}));
