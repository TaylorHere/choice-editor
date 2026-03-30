import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// The built directory structure
//
// ├─┬ dist
// │ └── index.html
// ├── dist-electron
// │ ├── main.js
// │ └── preload.js
//
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let win: BrowserWindow | null
let previewProcess: ChildProcessWithoutNullStreams | null = null
let previewProcessPort: number | null = null

const createWindow = () => {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.mjs'),
      webSecurity: false // Disable webSecurity to allow file:// protocol
    },
  })

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; media-src 'self' file: data: blob:;"
        ]
      }
    })
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST as string, 'index.html'))
  }
}

// IPC Handlers
ipcMain.handle('save-project', async (_event, content) => {
  const { canceled: _canceled, filePath } = await dialog.showSaveDialog({
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });

  if (_canceled || !filePath) {
    return { success: false, message: 'Canceled' };
  }

  try {
    fs.writeFileSync(filePath, content);
    return { success: true, filePath };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
});

ipcMain.handle('load-project', async (_event) => {
  const { canceled: _canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  });

  if (filePaths && filePaths.length > 0) {
    try {
      const content = fs.readFileSync(filePaths[0], 'utf-8')
      return { success: true, content, filePath: filePaths[0] }
    } catch (e: any) {
      return { success: false, message: e.message }
    }
  }
  return { success: false, message: 'Canceled' }
})

interface DeployPreviewPayload {
  storyContent: string;
  manifestContent: string;
  port?: number;
}

function getNpmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}

function getLocalIPv4Addresses(): string[] {
  const interfaces = os.networkInterfaces()
  const hosts = new Set<string>()
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        hosts.add(entry.address)
      }
    }
  }
  return [...hosts]
}

function runBuildWeb(projectRoot: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const npm = getNpmCommand()
    const buildProcess = spawn(npm, ['run', 'build:web'], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: false,
    })

    let logs = ''
    buildProcess.stdout.on('data', (data) => {
      logs += data.toString()
    })
    buildProcess.stderr.on('data', (data) => {
      logs += data.toString()
    })

    buildProcess.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`build:web failed (${code})\n${logs.slice(-2000)}`))
      }
    })
    buildProcess.on('error', (error) => reject(error))
  })
}

function stopPreviewProcess() {
  if (previewProcess && !previewProcess.killed) {
    previewProcess.kill('SIGTERM')
  }
  previewProcess = null
  previewProcessPort = null
}

function startPreviewServer(projectRoot: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const npm = getNpmCommand()
    const proc = spawn(
      npm,
      ['run', 'preview', '--', '--host', '0.0.0.0', '--port', String(port)],
      {
        cwd: projectRoot,
        stdio: 'pipe',
        shell: false,
      }
    )

    let settled = false
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true
        proc.kill('SIGTERM')
        reject(new Error('Preview server start timeout'))
      }
    }, 30000)

    const onOutput = (data: Buffer) => {
      const text = data.toString()
      if (!settled && (text.includes('Local:') || text.includes('Network:'))) {
        settled = true
        clearTimeout(timeout)
        previewProcess = proc
        previewProcessPort = port
        resolve()
      }
    }

    proc.stdout.on('data', onOutput)
    proc.stderr.on('data', onOutput)

    proc.on('close', (code) => {
      if (!settled) {
        settled = true
        clearTimeout(timeout)
        reject(new Error(`Preview server exited early (${code ?? 'unknown'})`))
      }
    })

    proc.on('error', (error) => {
      if (!settled) {
        settled = true
        clearTimeout(timeout)
        reject(error)
      }
    })
  })
}

ipcMain.handle('deploy-preview', async (_event, payload: DeployPreviewPayload) => {
  try {
    if (!payload || typeof payload.storyContent !== 'string' || typeof payload.manifestContent !== 'string') {
      return { success: false, message: 'Invalid payload' }
    }

    const projectRoot = app.getAppPath()
    const requestedPort = Number.isInteger(payload.port) && payload.port ? payload.port : 4173

    await runBuildWeb(projectRoot)

    const distDir = path.join(projectRoot, 'dist')
    fs.writeFileSync(path.join(distDir, 'story.json'), payload.storyContent)
    fs.writeFileSync(path.join(distDir, 'choice.manifest.json'), payload.manifestContent)

    const shouldRestart =
      !previewProcess || previewProcess.killed || previewProcessPort !== requestedPort
    if (shouldRestart) {
      stopPreviewProcess()
      await startPreviewServer(projectRoot, requestedPort)
    }

    const hosts = getLocalIPv4Addresses()
    return {
      success: true,
      port: requestedPort,
      hosts,
      suggestedHost: hosts[0] || '127.0.0.1',
      playPath: '/?mode=play',
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to deploy preview',
    }
  }
})

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    const windows = BrowserWindow.getAllWindows()
    if (windows.length) {
      if (windows[0].isMinimized()) windows[0].restore()
      windows[0].focus()
    }
  })

  app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopPreviewProcess()
    app.quit()
    win = null
  }
})

app.on('before-quit', () => {
  stopPreviewProcess()
})
