import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Shield, Terminal, Activity } from "lucide-react";
import { motion } from "motion/react";

const Player: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamUrl, setStreamUrl] = useState("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
  const [referer, setReferer] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 10));

  const initPlayer = () => {
    if (!videoRef.current) return;

    // Ruteamos a través de nuestro backend rewriter
    const proxiedUrl = `/api/m3u8?url=${encodeURIComponent(streamUrl)}${referer ? `&referer=${encodeURIComponent(referer)}` : ""}`;
    
    addLog(`Iniciando flujo: ${streamUrl}`);

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          // Las cabeceras ya las maneja el servidor proxy, pero podemos añadir trackers aquí
        }
      });
      hls.loadSource(proxiedUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => addLog("Autoplay bloqueado - Presiona Play"));
        addLog("Manifiesto HLS procesado y ruteado correctamente.");
      });
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = proxiedUrl;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header Sección Técnica */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="text-emerald-500 w-6 h-6" />
          <h2 className="text-xl font-bold text-slate-800">Nexus Multimedia Core</h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> API Ready</span>
          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">SERVERLESS_ENABLED</span>
        </div>
      </div>

      {/* Inputs de Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stream URL (M3U8)</label>
          <input 
            type="text" 
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder="https://servidor.com/lista.m3u8"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custom Referer (Opcional)</label>
          <input 
            type="text" 
            value={referer}
            onChange={(e) => setReferer(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder="https://sitio-original.com"
          />
        </div>
        <button 
          onClick={initPlayer}
          className="md:col-span-2 flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-lg"
        >
          <Play className="w-4 h-4 fill-current" /> Cargar Transmisión
        </button>
      </div>

      {/* Reproductor & Consola */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl bg-black aspect-video border border-slate-800 shadow-2xl relative group">
          <video 
            ref={videoRef} 
            className="w-full h-full" 
            controls 
            poster="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1000"
          />
        </div>

        {/* Consola de Procesamiento */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 font-mono text-[11px] flex flex-col h-[300px] lg:h-auto">
          <div className="flex items-center gap-2 mb-3 text-emerald-400 border-b border-slate-800 pb-2">
            <Terminal className="w-4 h-4" />
            <span className="uppercase font-bold tracking-tighter">Live Traffic Analyzer</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 text-slate-400 custom-scrollbar">
            {logs.map((log, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                key={i} 
                className="flex gap-2"
              >
                <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                <span className={i === 0 ? "text-emerald-300" : ""}>{log}</span>
              </motion.div>
            ))}
            {logs.length === 0 && <div className="text-slate-600">Esperando comandos...</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
