/// <reference types="vite/client" />
/// <reference types="vite-plugin-electron/electron-env" />

interface Window {
  ipcRenderer?: {
    saveProject: (content: string) => Promise<{ success: boolean; filePath?: string; message?: string }>;
    loadProject: () => Promise<{ success: boolean; content?: string; filePath?: string; message?: string }>;
    // ... other methods if any
  };
}
