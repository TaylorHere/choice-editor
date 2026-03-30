/// <reference types="vite/client" />
/// <reference types="vite-plugin-electron/electron-env" />

interface Window {
  ipcRenderer?: {
    saveProject: (content: string) => Promise<{ success: boolean; filePath?: string; message?: string }>;
    loadProject: () => Promise<{ success: boolean; content?: string; filePath?: string; message?: string }>;
    deployPreview: (payload: {
      storyContent: string;
      manifestContent: string;
      port?: number;
    }) => Promise<{
      success: boolean;
      message?: string;
      port?: number;
      hosts?: string[];
      suggestedHost?: string;
      playPath?: string;
    }>;
    // ... other methods if any
  };
}
