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
  "Accept": "*/*",
  "Connection": "keep-alive"
};

const axiosInstance = axios.create({
  timeout: 15000,
  headers: DEFAULT_HEADERS
});

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
 * Proxy Multimedia: Optimizado para streaming de fragmentos
 */
app.get("/api/proxy", async (req, res) => {
  const { url, referer } = req.query;
  if (!url) return res.status(400).send("URL required");

  try {
    const response = await axiosInstance.get(url as string, {
      headers: {
        ...DEFAULT_HEADERS,
        ...(referer ? { Referer: referer as string } : {}),
      },
      responseType: "stream",
    });

    res.setHeader("Content-Type", response.headers["content-type"] || "video/MP2T");
    res.setHeader("Cache-Control", "public, max-age=3600");
    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }

    response.data.pipe(res);
  } catch (error) {
    res.status(500).send("Proxy error");
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
 * Soporta GET y POST para compatibilidad con el script original
 */
async function processMovieProxy(req: express.Request, res: express.Response) {
  const url = req.method === "POST" ? req.body.url : req.query.url;
  const referer = req.method === "POST" ? req.body.referer : req.query.referer;
  const name = req.method === "POST" ? req.body.name : req.query.name;

  if (!url) return res.status(400).json({ ok: false, error: "URL required" });

  try {
    let currentUrl = url as string;
    let html = "";

    // PASO 1 & 2: Descarga y Desofuscación
    if (!currentUrl.includes(".m3u8")) {
      const page = await axiosInstance.get(currentUrl, { headers: DEFAULT_HEADERS });
      html = resolvePacked(page.data);
      
      const m3u8Match = html.match(/["'](http[^"']+\.m3u8[^"']*)["']/i) || 
                        page.data.match(/["'](http[^"']+\.m3u8[^"']*)["']/i);
      
      if (!m3u8Match) throw new Error("No se pudo extraer la fuente m3u8.");
      currentUrl = m3u8Match[1].replace(/\\/g, "");
    }

    const masterResponse = await axiosInstance.get(currentUrl, { headers: DEFAULT_HEADERS });
    let qualityUrl = selectBestQuality(masterResponse.data, currentUrl);
    if (!qualityUrl || qualityUrl === masterResponse.data) qualityUrl = currentUrl;

    const qualityResponse = await axiosInstance.get(qualityUrl, { headers: DEFAULT_HEADERS });
    const cleanPlaylist = filterAds(qualityResponse.data);

    const baseUrl = qualityUrl.substring(0, qualityUrl.lastIndexOf("/") + 1);
    const rewritten = cleanPlaylist.split("\n").map(line => {
      if (line && !line.startsWith("#")) {
        const abs = line.startsWith("http") ? line : new URL(line, baseUrl).href;
        return `/api/proxy?url=${encodeURIComponent(abs)}${referer ? `&referer=${encodeURIComponent(referer as string)}` : ""}`;
      }
      return line;
    }).join("\n");

    const resultPath = `/api/playlist.m3u8?data=${Buffer.from(rewritten).toString("base64")}`;
    
    if (req.method === "POST") {
      res.json({ ok: true, url: resultPath });
    } else {
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.send(rewritten);
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
}

app.use(express.json());
app.get("/api/m3u8", processMovieProxy);
app.post("/api/m3u8", processMovieProxy);

// Endpoint para servir la playlist generada desde base64 (evita problemas de estado)
app.get("/api/playlist.m3u8", (req, res) => {
  const { data } = req.query;
  if (!data) return res.status(400).send("No data");
  const decoded = Buffer.from(data as string, "base64").toString("utf-8");
  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(decoded);
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
