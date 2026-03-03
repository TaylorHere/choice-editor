import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isWeb = mode === 'web'

  return {
    plugins: [
      react(),
      !isWeb && electron([
        {
          // Main-Process entry file of the Electron App.
          entry: 'electron/main.ts',
        },
        {
          entry: 'electron/preload.ts',
          onclean: ({ reload }) => reload(),
        },
      ]),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Ensure base path is correct for static hosting (e.g. GitHub Pages)
    base: './', 
  }
})
