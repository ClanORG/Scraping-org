import React, { useState, useRef, useEffect } from "react";
import Hls from "hls.js";
import { MessageSquare, Youtube, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const COMPATIBLE_LINKS = [
  { domain: "dr0pstream", url: "https://dr0pstream.com/e/u80xu3klxu5u" },
  { domain: "vimeos", url: "https://vimeos.net/embed-1jat4owoqebm.html" },
  { domain: "minochinos", url: "https://minochinos.com/embed/3w5ro1g4bpt7" },
  { domain: "tiktokshopping", url: "https://tiktokshopping.xyz/v/043yjmlfupck" },
  { domain: "ok.ru", url: "https://ok.ru/video/13756336376367" },
  { domain: "morencius", url: "https://morencius.com/embed/o3xacvfks5kj" },
  { domain: "nupload", url: "https://nupload.top/watch/cTLbHeJIUSn3GtND3ElHQDV5LwgpU1s2tdK1Us2rrMI" },
  { domain: "fastream", url: "https://fastream.to/embed-hkg31ov0agtt.html" },
];

const Player: React.FC = () => {
  const [movieName, setMovieName] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [isCleaning, setIsCleaning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const handleClean = async () => {
    const url = urlInput.trim();
    if (!url) {
      setStatus({ msg: "Pega primero una URL.", type: "error" });
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setStatus({ msg: "La URL debe empezar con http:// o https://", type: "error" });
      return;
    }

    setIsCleaning(true);
    setResult(null);
    setShowPlayer(false);
    setStatus({ msg: "Limpiando URL, esto puede tardar unos segundos…", type: "" });

    try {
      const response = await fetch("/api/m3u8", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, name: movieName }),
      });
      
      const data = await response.json();
      if (!data.ok) {
        setStatus({ msg: data.error || "No se pudo limpiar la URL.", type: "error" });
        return;
      }

      let finalUrl = window.location.origin + data.url;
      if (movieName) {
        finalUrl += `&name=${encodeURIComponent(movieName)}`;
      }
      
      setResult(finalUrl);
      setStatus({ msg: "", type: "" });
    } catch (err) {
      setStatus({ msg: "Error de red. Intenta de nuevo.", type: "error" });
    } finally {
      setIsCleaning(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setStatus({ msg: "COPIADO", type: "success" });
      setTimeout(() => setStatus({ msg: "", type: "" }), 1600);
    });
  };

  useEffect(() => {
    if (showPlayer && videoRef.current && result) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(result);
        hls.attachMedia(videoRef.current);
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play();
        });
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = result;
      }
    }
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [showPlayer, result]);

  return (
    <div className="flex flex-col items-center w-full max-w-[720px] mx-auto space-y-6">
      <a href="/" className="logo text-3xl font-extrabold tracking-tight mb-2">
        Movie<span className="text-[#00d4a0]">Proxy</span>
      </a>
      <p className="subtitle text-[#9aa3b5] text-sm text-center mb-6">
        Pega la URL de tu película en streaming y obtén un enlace MP4 limpio, sin anuncios
      </p>

      {/* Ad Slot Top */}
      <div className="ad-slot w-full bg-white/5 border border-[#262b3a] border-dashed rounded-xl p-4 flex flex-col items-center min-h-[100px]">
        <span className="text-[10px] font-extrabold tracking-[1.5px] uppercase opacity-60 mb-2">Publicidad</span>
        <div className="w-full flex items-center justify-center text-xs text-[#9aa3b5]">
          Espacio publicitario optimizado
        </div>
      </div>

      {/* Warning Box */}
      <div className="warning w-full bg-[#ff5f6d]/10 border border-[#ff5f6d]/35 rounded-xl p-4 flex gap-3 text-sm leading-relaxed">
        <span className="text-lg leading-none shrink-0 text-[#ff5f6d]">⚠</span>
        <span>
          MovieProxy <b className="text-[#ff5f6d]">no descarga ni almacena</b> el contenido del enlace de streaming: solo lo reestructura y filtra los anuncios. Por eso, si el <b>enlace original (madre) cae o se elimina</b>, el enlace limpio de MovieProxy también dejará de funcionar.
        </span>
      </div>

      {/* Cleaner Window */}
      <div className="cleaner w-full bg-[#171a23] border border-[#262b3a] rounded-2xl overflow-hidden shadow-2xl">
        <div className="bar flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-[#262b3a]">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]"></span>
          <span className="w-3 h-3 rounded-full bg-[#febc2e]"></span>
          <span className="w-3 h-3 rounded-full bg-[#28c840]"></span>
          <span className="ml-2 text-xs text-[#9aa3b5] tracking-wider uppercase font-bold">
            movieproxy — limpiador de URL
          </span>
        </div>
        <div className="body p-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold tracking-[1.5px] text-[#9aa3b5] uppercase">
              Nombre de la película
            </label>
            <input
              type="text"
              placeholder="Ej: Oppenheimer (2023)"
              className="w-full bg-[#0d111f]/85 border border-[#262b3a] rounded-xl px-4 py-3 text-sm focus:border-[#6c5ce7] outline-none transition-colors"
              value={movieName}
              onChange={(e) => setMovieName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold tracking-[1.5px] text-[#9aa3b5] uppercase">
              URL del proveedor
            </label>
            <div className="flex gap-3 flex-col sm:flex-row">
              <input
                type="url"
                placeholder="https://ejemplo.com/pelicula"
                className="flex-1 bg-[#0d111f]/85 border border-[#262b3a] rounded-xl px-4 py-3 text-sm focus:border-[#6c5ce7] outline-none transition-colors"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <button
                onClick={handleClean}
                disabled={isCleaning}
                className="btn primary bg-[#00d4a0] text-[#062e26] px-6 py-3 rounded-xl font-extrabold text-sm tracking-wider uppercase hover:brightness-110 active:scale-95 transition-all shadow-[0_8px_22px_rgba(0,212,160,0.25)]"
              >
                LIMPIAR URL
              </button>
            </div>
          </div>

          {(status.msg || isCleaning) && (
            <div className={`status text-sm ${status.type === "error" ? "text-[#ff5f6d]" : status.type === "success" ? "text-[#00d4a0]" : "text-[#9aa3b5]"}`}>
              {status.msg}
            </div>
          )}

          {result && !isCleaning && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="result show space-y-4 p-4 bg-[#0d111f]/85 border border-[#262b3a] rounded-xl">
              <div className="clean-link font-mono text-xs text-[#9cdcfe] break-all leading-relaxed">
                {result}
              </div>
              <div className="actions flex flex-wrap gap-3">
                <button
                  onClick={() => setShowPlayer(true)}
                  className="btn primary bg-[#00d4a0] text-[#062e26] px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider"
                >
                  REPRODUCIR
                </button>
                <button
                  onClick={copyToClipboard}
                  className="btn ghost border border-[#262b3a] bg-white/5 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider"
                >
                  COPIAR
                </button>
                <a
                  href={result}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn ghost border border-[#262b3a] bg-white/5 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider text-center"
                >
                  ABRIR EN OTRA PESTAÑA
                </a>
              </div>
            </motion.div>
          )}

          {showPlayer && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="player show mt-4 aspect-video bg-black rounded-xl border border-[#262b3a] overflow-hidden">
              <video ref={videoRef} controls className="w-full h-full" autoPlay />
            </motion.div>
          )}
        </div>
      </div>

      {/* Social Links */}
      <div className="social-left w-full flex flex-wrap justify-center gap-3">
        <a href="https://discord.gg/6VzYrSVqaz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-3 bg-[#171a23] border border-[#262b3a] rounded-2xl text-[#9aa3b5] font-bold text-sm hover:text-[#00d4a0] hover:border-[#00d4a0] hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-emerald-500/20">
          <MessageSquare className="w-6 h-6 text-[#5865F2]" />
          <span>Reporta errores en Discord</span>
        </a>
        <a href="https://www.youtube.com/@codex-programer" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-3 bg-[#171a23] border border-[#262b3a] rounded-2xl text-[#9aa3b5] font-bold text-sm hover:text-[#00d4a0] hover:border-[#00d4a0] hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-emerald-500/20">
          <Youtube className="w-6 h-6 text-[#FF0000]" />
          <span>Sigueme en Youtube</span>
        </a>
      </div>

      {/* Compatible Links Grid */}
      <div className="compat w-full space-y-4">
        <h2 className="text-[12px] font-extrabold tracking-[1.5px] uppercase text-[#9aa3b5] text-center">
          Tipos de enlaces compatibles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COMPATIBLE_LINKS.map((link) => (
            <div key={link.domain} className="compat-card bg-[#171a23] border border-[#262b3a] p-4 rounded-xl space-y-1">
              <span className="compat-domain text-xs font-extrabold tracking-wider text-[#00d4a0] uppercase">
                {link.domain}
              </span>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#9aa3b5] hover:text-white truncate block font-mono">
                {link.url}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Ad Slot Bottom */}
      <div className="ad-slot w-full bg-white/5 border border-[#262b3a] border-dashed rounded-xl p-4 flex flex-col items-center min-h-[100px]">
        <span className="text-[10px] font-extrabold tracking-[1.5px] uppercase opacity-60 mb-2">Publicidad</span>
        <div className="w-full flex items-center justify-center text-xs text-[#9aa3b5]">
          Publicidad optimizada para tu región
        </div>
      </div>
    </div>
  );
};

export default Player;
