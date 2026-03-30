import Canvas from './features/editor/Canvas';
import RightPanel from './features/properties/RightPanel';
import PlayerWindow from './features/player/PlayerWindow';
import { useGameEngine } from './store/useRuntimeStore';
import { useProjectStore } from './store/useProjectStore';
import { Play, Share2, X, QrCode, Download, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import {
  buildExportManifest,
  buildStoryExport,
  CHOICE_EXPORT_MANIFEST_FILE,
  CHOICE_EXPORT_STORY_FILE,
  parseProjectData,
  ParsedProjectData,
} from './lib/project-format';

function App() {
  const isPlaying = useGameEngine((state) => state.isPlaying);
  const startGame = useGameEngine((state) => state.startGame);
  const setProject = useProjectStore((state) => state.setProject);
  const nodes = useProjectStore((state) => state.nodes);
  const edges = useProjectStore((state) => state.edges);
  const variables = useProjectStore((state) => state.variables);

  const [isStandalone, setIsStandalone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrPlayUrl, setQrPlayUrl] = useState('');
  const [qrError, setQrError] = useState('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  useEffect(() => {
    // Check for standalone mode (e.g. ?mode=play)
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'play') {
      setIsStandalone(true);
      setIsLoading(true);

      const startParsedProject = (parsed: ParsedProjectData) => {
        setProject(parsed.nodes, parsed.edges);
        const currentVars = useProjectStore.getState().variables;
        currentVars.forEach((v) => useProjectStore.getState().removeVariable(v.id));
        parsed.variables.forEach((v) => useProjectStore.getState().addVariable(v));

        setTimeout(() => {
          const startNode = parsed.nodes.find((n) => n.data.isStartNode);
          if (startNode) {
            const initialVars: Record<string, unknown> = {};
            parsed.variables.forEach((v) => {
              initialVars[v.id] = v.defaultValue;
            });
            startGame(startNode, initialVars);
          } else {
            alert('No Start Node found in exported project.');
          }
          setIsLoading(false);
        }, 100);
      };

      const loadStandaloneProject = async () => {
        try {
          const encodedData = params.get('data');
          if (encodedData) {
            const jsonString = decompressFromEncodedURIComponent(encodedData);
            if (!jsonString) {
              throw new Error('Invalid QR payload');
            }
            const rawStory = JSON.parse(jsonString);
            const parsed = parseProjectData(rawStory);
            startParsedProject(parsed);
            return;
          }

          let storyEntry = CHOICE_EXPORT_STORY_FILE;
          try {
            const manifestResponse = await fetch(CHOICE_EXPORT_MANIFEST_FILE);
            if (manifestResponse.ok) {
              const exportManifest = await manifestResponse.json();
              if (
                exportManifest &&
                typeof exportManifest === 'object' &&
                typeof (exportManifest as Record<string, unknown>).entry === 'string'
              ) {
                storyEntry = (exportManifest as { entry: string }).entry;
              }
            }
          } catch {
            // Backward compatibility: missing manifest falls back to story.json.
          }

          const storyResponse = await fetch(storyEntry);
          if (!storyResponse.ok) {
            throw new Error(`Failed to fetch ${storyEntry}`);
          }
          const rawStory = await storyResponse.json();
          const parsed = parseProjectData(rawStory);
          startParsedProject(parsed);
        } catch (error) {
          console.error('Failed to load standalone project', error);
          setIsLoading(false);
          alert(
            `Failed to load exported files. Please make sure '${CHOICE_EXPORT_STORY_FILE}' exists.`
          );
        }
      };

      loadStandaloneProject();
    }
  }, [setProject, startGame]);

  const handlePlay = () => {
    const startNode = nodes.find(n => n.data.isStartNode);
    if (startNode) {
      const initialVars: Record<string, any> = {};
      variables.forEach(v => initialVars[v.id] = v.defaultValue);
      startGame(startNode, initialVars);
    } else {
      alert("No Start Node found! Please mark a node as [START].");
    }
  };

  const downloadJsonFile = (filename: string, payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFiles = () => {
    const storyExport = buildStoryExport(nodes, edges, variables);
    const exportManifest = buildExportManifest();
    downloadJsonFile(CHOICE_EXPORT_STORY_FILE, storyExport);
    downloadJsonFile(CHOICE_EXPORT_MANIFEST_FILE, exportManifest);
    setShowExportModal(false);
    alert(
      `Export completed.\n\n` +
      `- ${CHOICE_EXPORT_STORY_FILE}\n` +
      `- ${CHOICE_EXPORT_MANIFEST_FILE}\n\n` +
      `Place both files next to index.html in your web build output, then open index.html?mode=play.`
    );
  };

  const handleExportQr = async () => {
    setIsGeneratingQr(true);
    setQrError('');
    try {
      const storyExport = buildStoryExport(nodes, edges, variables);
      const compressed = compressToEncodedURIComponent(JSON.stringify(storyExport));
      const playUrl = new URL(window.location.href);
      playUrl.search = '';
      playUrl.hash = '';
      playUrl.searchParams.set('mode', 'play');
      playUrl.searchParams.set('data', compressed);

      if (playUrl.toString().length > 3500) {
        throw new Error('剧情数据较大，二维码可能无法稳定识别，请改用文件导出。');
      }

      const qr = await QRCode.toDataURL(playUrl.toString(), {
        errorCorrectionLevel: 'L',
        margin: 1,
        width: 300,
      });
      setQrPlayUrl(playUrl.toString());
      setQrDataUrl(qr);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '生成二维码失败，请重试。';
      setQrError(message);
      setQrDataUrl('');
      setQrPlayUrl('');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleCopyQrLink = async () => {
    if (!qrPlayUrl) return;
    try {
      await navigator.clipboard.writeText(qrPlayUrl);
      alert('播放链接已复制。');
    } catch {
      alert('复制失败，请手动复制二维码下方链接。');
    }
  };

  if (isStandalone) {
    if (isLoading) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading Game...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen w-screen bg-black overflow-hidden relative">
        <PlayerWindow />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-white overflow-hidden flex-col">
      {/* Header */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20">
        <h1 className="font-bold text-indigo-500 flex items-center gap-2">
          <span className="bg-indigo-500/20 p-1 rounded">🎬</span> Choice Editor
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setQrDataUrl('');
              setQrPlayUrl('');
              setQrError('');
              setShowExportModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
          >
            <Share2 size={14} /> Export
          </button>
          <button 
            onClick={handlePlay}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
          >
            <Play size={14} fill="currentColor" /> Play
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative">
          <Canvas />
          {isPlaying && <PlayerWindow />}
        </div>
        <RightPanel />
      </div>

      {showExportModal && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">选择导出方式</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <button
                onClick={handleExportFiles}
                className="w-full flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-3 py-3 hover:bg-slate-700 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-100">文件导出</p>
                  <p className="text-xs text-slate-400">
                    下载 {CHOICE_EXPORT_STORY_FILE} 和 {CHOICE_EXPORT_MANIFEST_FILE}
                  </p>
                </div>
                <Download size={16} className="text-indigo-300" />
              </button>

              <button
                onClick={handleExportQr}
                disabled={isGeneratingQr}
                className="w-full flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-3 py-3 hover:bg-slate-700 transition-colors disabled:opacity-60"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-100">二维码导出</p>
                  <p className="text-xs text-slate-400">
                    手机扫码后直接进入播放
                  </p>
                </div>
                <QrCode size={16} className="text-emerald-300" />
              </button>

              {isGeneratingQr && (
                <p className="text-xs text-slate-400">正在生成二维码...</p>
              )}

              {qrError && (
                <p className="text-xs text-rose-400">{qrError}</p>
              )}

              {qrDataUrl && (
                <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 space-y-2">
                  <img src={qrDataUrl} alt="播放二维码" className="w-56 h-56 mx-auto rounded bg-white p-2" />
                  <p className="text-[11px] text-slate-400 break-all">{qrPlayUrl}</p>
                  <button
                    onClick={handleCopyQrLink}
                    className="w-full flex items-center justify-center gap-2 rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-medium"
                  >
                    <Copy size={14} /> 复制播放链接
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
