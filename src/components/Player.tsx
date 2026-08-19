import React, { useState, useRef, useEffect } from "react";
import Hls from "hls.js";
import { Play, Copy, ExternalLink, MessageSquare, Youtube, Globe, Monitor, ShoppingBag, Video, PlayCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const COMPATIBLE_LINKS = [
  { name: "dr0pstream", url: "https://dr0pstream.com/e/u80xu3klxu5u", icon: <Globe className="w-4 h-4 text-emerald-400" /> },
  { name: "vimeos", url: "https://vimeos.net/embed-1jat4owoqebm.html", icon: <Video className="w-4 h-4 text-emerald-400" /> },
  { name: "minochinos", url: "https://minochinos.com/embed/3w5ro1g4bpt7", icon: <Monitor className="w-4 h-4 text-emerald-400" /> },
  { name: "tiktokshopping", url: "https://tiktokshopping.xyz/v/043yjmlfupck", icon: <ShoppingBag className="w-4 h-4 text-emerald-400" /> },
  { name: "ok.ru", url: "https://ok.ru/video/13756336376367", icon: <PlayCircle className="w-4 h-4 text-emerald-400" /> },
  { name: "morencius", url: "https://morencius.com/embed/o3xacvfks5kj", icon: <Play className="w-4 h-4 text-emerald-400" /> },
];

const Player: React.FC = () => {
  const [movieName, setMovieName] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [isCleaning, setIsCleaning] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [showPlayer, setShowPlayer] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const handleClean = () => {
    if (!streamUrl) return;
    setIsCleaning(true);
    setResultUrl("");
    setTimeout(() => {
      const proxied = `${window.location.origin}/api/m3u8?url=${encodeURIComponent(streamUrl)}`;
      setResultUrl(proxied);
      setIsCleaning(false);
    }, 1500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resultUrl);
  };

  const startPlayback = () => {
    setShowPlayer(true);
  };

  useEffect(() => {
    if (showPlayer && videoRef.current && resultUrl) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(resultUrl);
        hls.attachMedia(videoRef.current);
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play();
        });
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = resultUrl;
      }
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [showPlayer, resultUrl]);

  return (
    <div className="flex flex-col gap-8 max-w-xl mx-auto py-4">
      {/* Reproductor Modal */}
      <AnimatePresence>
        {showPlayer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 lg:p-12"
          >
            <button 
              onClick={() => setShowPlayer(false)}
              className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5">
              <video ref={videoRef} controls className="w-full h-full" autoPlay />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="bg-[#13171f] rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Barra Superior macOS Style */}
        <div className="bg-[#1a1f29] px-4 py-3 flex items-center gap-2 border-b border-slate-800">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-[11px] font-medium text-slate-400 ml-2 tracking-wide">
            movieproxy — limpiador de URL
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Nombre de la película
              </label>
              <input
                type="text"
                placeholder="Ej: Oppenheimer (2023)"
                value={movieName}
                onChange={(e) => setMovieName(e.target.value)}
                className="w-full bg-[#0b0e14] border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                URL del proveedor
              </label>
              <input
                type="text"
                placeholder="https://minochinos.com/embed/..."
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                className="w-full bg-[#0b0e14] border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Botón Acción */}
          <button
            onClick={handleClean}
            disabled={isCleaning}
            className="w-full bg-[#00f2a9] hover:bg-[#00d998] disabled:opacity-50 text-[#0b0e14] font-bold py-3.5 rounded-lg transition-all shadow-[0_0_20px_rgba(0,242,169,0.2)] uppercase text-xs tracking-widest"
          >
            {isCleaning ? "Limpiando..." : "Limpiar URL"}
          </button>

          {/* Resultado */}
          <AnimatePresence>
            {(isCleaning || resultUrl) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {isCleaning && (
                  <p className="text-xs text-slate-400 animate-pulse">
                    Limpiando URL, esto puede tardar unos segundos...
                  </p>
                )}

                {resultUrl && !isCleaning && (
                  <div className="bg-[#0b0e14] border border-slate-800 rounded-lg p-4 space-y-4">
                    <div className="text-[11px] font-mono text-emerald-400 break-all leading-relaxed bg-[#13171f] p-3 rounded border border-emerald-500/10">
                      {resultUrl}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={startPlayback}
                        className="flex-1 bg-[#00f2a9] text-[#0b0e14] text-[10px] font-bold py-2.5 rounded uppercase tracking-wider hover:bg-[#00d998] transition-colors"
                      >
                        Reproducir
                      </button>
                      <button 
                        onClick={copyToClipboard}
                        className="flex-1 bg-[#1a1f29] text-slate-200 text-[10px] font-bold py-2.5 rounded uppercase tracking-wider hover:bg-[#252b38] border border-slate-800 transition-colors"
                      >
                        Copiar
                      </button>
                      <a 
                        href={resultUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full bg-transparent text-slate-300 text-[10px] font-bold py-2.5 rounded uppercase tracking-wider hover:text-white border border-slate-800 text-center transition-colors"
                      >
                        Abrir en otra pestaña
                      </a>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Social Buttons */}
      <div className="flex gap-4">
        <button className="flex-1 bg-[#1a1f29] border border-slate-800 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors">
          <MessageSquare className="w-4 h-4 text-[#5865F2]" /> Reporta errores en Discord
        </button>
        <button className="flex-1 bg-[#1a1f29] border border-slate-800 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors">
          <Youtube className="w-4 h-4 text-[#FF0000]" /> Sigueme en Youtube
        </button>
      </div>

      {/* Enlaces Compatibles */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">
          Tipos de enlaces compatibles
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {COMPATIBLE_LINKS.map((link) => (
            <div 
              key={link.name}
              className="bg-[#13171f] border border-slate-800 p-4 rounded-xl space-y-1 hover:border-emerald-500/30 transition-colors cursor-default group"
            >
              <div className="flex items-center gap-2">
                {link.icon}
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  {link.name}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                {link.url}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Player;
