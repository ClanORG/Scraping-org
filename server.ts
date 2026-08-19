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
 * Manipulador de Listas M3U8: Limpieza de Ads y Rewriting de URLs
 */
app.get("/api/m3u8", async (req, res) => {
  const { url, referer } = req.query;
  if (!url) return res.status(400).send("URL is required");

  try {
    let targetUrl = url as string;
    
    // RESOLVER: Si no termina en .m3u8, intentamos buscarlo dentro del HTML
    if (!targetUrl.includes(".m3u8")) {
      console.log("Detectado Embed URL, resolviendo fuente...");
      const pageResponse = await axios.get(targetUrl, {
        headers: { ...DEFAULT_HEADERS, ...(referer ? { Referer: referer as string } : {}) },
      });
      
      const html = pageResponse.data;
      // Regex para buscar archivos m3u8 en scripts (común en JWPlayer y similares)
      const m3u8Match = html.match(/["'](http[^"']+\.m3u8[^"']*)["']/i) || 
                        html.match(/file\s*:\s*["']([^"']+)["']/i);
      
      if (m3u8Match) {
        targetUrl = m3u8Match[1];
        console.log("Fuente resuelta:", targetUrl);
      } else {
        return res.status(404).send("No se encontró un flujo M3U8 válido en esta página.");
      }
    }

    const response = await axios.get(targetUrl, {
      headers: { ...DEFAULT_HEADERS, ...(referer ? { Referer: referer as string } : {}) },
    });

    let content = response.data;
    const lines = content.split("\n");
    const newLines = [];
    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

    let isAdSegment = false;

    for (let line of lines) {
      line = line.trim();
      
      // 1. Filtrado de Publicidad por marcadores estándar
      if (line.includes("#EXT-X-DISCONTINUITY") || 
          line.includes("#EXT-X-DATERANGE") || 
          line.includes("AD-BREAK") || 
          line.includes("cue-out")) {
        isAdSegment = true;
        continue; 
      }
      
      if (line.includes("cue-in")) {
        isAdSegment = false;
        continue;
      }

      if (isAdSegment && line.startsWith("#EXTINF")) {
        // Omitir info de segmento de anuncio
        continue;
      }

      if (isAdSegment && !line.startsWith("#")) {
        // Omitir URL de chunk de anuncio
        continue;
      }

      // 2. Rewriting de URLs dinámico
      if (line && !line.startsWith("#")) {
        let absoluteUrl = line;
        if (!line.startsWith("http")) {
          absoluteUrl = new URL(line, baseUrl).href;
        }

        // Ruteamos a través de nuestro proxy para mayor limpieza
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(absoluteUrl)}${referer ? `&referer=${encodeURIComponent(referer as string)}` : ""}`;
        newLines.push(proxyUrl);
      } else {
        newLines.push(line);
      }
    }

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.send(newLines.join("\n"));
  } catch (error) {
    console.error("M3U8 Error:", (error as Error).message);
    res.status(500).send("Error processing M3U8");
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
