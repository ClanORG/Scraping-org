import express from "express";
import path from "path";
import axios from "axios";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Configuración de Headers por defecto para simular navegador
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Referer": "https://google.com",
  "Origin": "https://google.com",
};

/**
 * Lógica de Desofuscación (Unpacker de Dean Edwards)
 * Implementación en Node.js para revelar lógica oculta en scripts de reproductores.
 */
function unpack(code: string): string {
  try {
    const packerRegex = /eval\(function\(p,a,c,k,e,d\)\{.*?\}\((.*?)\)\)/s;
    const match = code.match(packerRegex);
    if (!match) return code;

    const args = match[1].split(',').map(s => s.trim());
    // Aquí se implementaría la lógica de reconstrucción si fuera necesario procesar dinámicamente
    // Para este MVP, exponemos la interfaz de limpieza.
    return code; 
  } catch (e) {
    return code;
  }
}

/**
 * Proxy Multimedia: Intercepta y limpia fragmentos de video
 */
app.get("/api/proxy", async (req, res) => {
  const { url, referer } = req.query;
  if (!url) return res.status(400).send("URL is required");

  try {
    const response = await axios.get(url as string, {
      headers: {
        ...DEFAULT_HEADERS,
        ...(referer ? { Referer: referer as string } : {}),
      },
      responseType: "stream",
      timeout: 10000,
    });

    // Reenviar cabeceras críticas de contenido
    res.setHeader("Content-Type", response.headers["content-type"] || "video/MP2T");
    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }

    response.data.pipe(res);
  } catch (error) {
    console.error("Proxy error:", (error as Error).message);
    res.status(500).send("Error proxying resource");
  }
});

/**
 * DESOFUSCADOR: Unpacker de Dean Edwards (P.A.C.K.E.R)
 * Reconstruye el código original para extraer variables ocultas (file: "...", etc)
 */
function deobfuscate(p: string, a: number, c: number, k: string[], e: any, d: any): string {
  while (c--) {
    if (k[c]) {
      p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
    }
  }
  return p;
}

function resolvePacked(html: string): string {
  const match = html.match(/eval\(function\(p,a,c,k,e,d\)\{.*?\}\((.*)\)\)/);
  if (!match) return html;

  try {
    const args = match[1].split(",");
    const p = args[0].replace(/^["']|["']$/g, "");
    const a = parseInt(args[1]);
    const c = parseInt(args[2]);
    const k = args[3].split("|");
    // Ejecutamos la lógica de reconstrucción
    return deobfuscate(p, a, c, k, 0, {});
  } catch (err) {
    return html;
  }
}

/**
 * ELECCIÓN DE CALIDAD: Selecciona el mejor stream <= 6 Mbps (6000000 bps)
 */
function selectBestQuality(m3u8: string, baseUrl: string): string {
  if (!m3u8.includes("#EXT-X-STREAM-INF")) return m3u8;

  const lines = m3u8.split("\n");
  let bestBandwidth = 0;
  let bestUrl = "";
  const LIMIT = 6000000;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXT-X-STREAM-INF")) {
      const bwMatch = lines[i].match(/BANDWIDTH=(\d+)/);
      if (bwMatch) {
        const bw = parseInt(bwMatch[1]);
        if (bw <= LIMIT && bw > bestBandwidth) {
          bestBandwidth = bw;
          bestUrl = lines[i + 1].trim();
        }
      }
    }
  }

  if (bestUrl) {
    if (!bestUrl.startsWith("http")) {
      bestUrl = new URL(bestUrl, baseUrl).href;
    }
    return bestUrl;
  }
  return "";
}

/**
 * FILTRADO DE ANUNCIOS: Limpieza profunda de segmentos
 */
function filterAds(content: string): string {
  const lines = content.split("\n");
  const cleaned = [];
  let skipping = false;

  for (const line of lines) {
    const l = line.trim();
    // Detección por marcadores y palabras clave en URLs
    if (l.includes("CUE-OUT") || l.includes("DISCONTINUITY") || l.includes("-ad-") || l.includes("/ads/")) {
      skipping = true;
      continue;
    }
    if (l.includes("CUE-IN")) {
      skipping = false;
      continue;
    }
    if (!skipping) cleaned.push(line);
  }
  return cleaned.join("\n");
}

/**
 * API ENDPOINT: Lógica MovieProxy 5-Pasos
 */
app.get("/api/m3u8", async (req, res) => {
  const { url, referer } = req.query;
  if (!url) return res.status(400).send("URL required");

  try {
    let currentUrl = url as string;
    let html = "";

    // PASO 1 & 2: Descarga y Desofuscación
    if (!currentUrl.includes(".m3u8")) {
      const page = await axios.get(currentUrl, { headers: DEFAULT_HEADERS });
      html = resolvePacked(page.data);
      
      // Búsqueda agresiva de m3u8
      const m3u8Match = html.match(/["'](http[^"']+\.m3u8[^"']*)["']/i) || 
                        page.data.match(/["'](http[^"']+\.m3u8[^"']*)["']/i);
      
      if (!m3u8Match) {
        throw new Error("No se pudo extraer la fuente m3u8 del embed.");
      }
      currentUrl = m3u8Match[1].replace(/\\/g, ""); // Limpiar escapes de JS
    }

    // Obtener Master Playlist
    const masterResponse = await axios.get(currentUrl, { headers: DEFAULT_HEADERS });
    const masterData = masterResponse.data;

    // PASO 3: Selección de Calidad
    let qualityUrl = selectBestQuality(masterData, currentUrl);
    if (!qualityUrl || qualityUrl === masterData) {
      qualityUrl = currentUrl;
    }

    // Obtener Playlist Final
    const qualityResponse = await axios.get(qualityUrl, { headers: DEFAULT_HEADERS });
    let qualityData = qualityResponse.data;

    if (typeof qualityData !== "string") {
      throw new Error("La fuente resuelta no es un manifiesto válido.");
    }

    // PASO 4: Filtrado de Anuncios
    const cleanPlaylist = filterAds(qualityData);

    // PASO 5: Proxy de fragmentos
    const baseUrl = qualityUrl.substring(0, qualityUrl.lastIndexOf("/") + 1);
    const rewritten = cleanPlaylist.split("\n").map(line => {
      if (line && !line.startsWith("#")) {
        const abs = line.startsWith("http") ? line : new URL(line, baseUrl).href;
        return `/api/proxy?url=${encodeURIComponent(abs)}${referer ? `&referer=${encodeURIComponent(referer as string)}` : ""}`;
      }
      return line;
    }).join("\n");

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(rewritten);
  } catch (err) {
    console.error("Error en MovieProxy:", (err as Error).message);
    res.status(500).json({ error: (err as Error).message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nexus Engine running at http://localhost:${PORT}`);
  });
}

startServer();
