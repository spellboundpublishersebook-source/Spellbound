/**
 * Lightweight, zero-dependency browser-native EPUB parser & extractor.
 * Uses native Web APIs (DataView, TextDecoder, DecompressionStream, Blob, URL.createObjectURL)
 * to parse and extract EPUB 2/3 archives with clean typography and custom color palettes.
 */

export async function parseEpubArchive(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const totalLength = arrayBuffer.byteLength;

  // 1. Locate End of Central Directory (EOCD) signature 0x06054b50
  let eocdOffset = -1;
  const maxSearch = Math.min(totalLength, 65557);
  for (let i = totalLength - 22; i >= totalLength - maxSearch; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error("Invalid archive: End of Central Directory signature not found.");
  }

  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);

  const files = {};
  let pos = cdOffset;

  // 2. Parse Central Directory headers
  for (let i = 0; i < totalEntries; i++) {
    if (pos + 46 > totalLength) break;
    if (view.getUint32(pos, true) !== 0x02014b50) break;

    const method = view.getUint16(pos + 10, true);
    const compSize = view.getUint32(pos + 20, true);
    const uncompSize = view.getUint32(pos + 24, true);
    const nameLen = view.getUint16(pos + 28, true);
    const extraLen = view.getUint16(pos + 30, true);
    const commentLen = view.getUint16(pos + 32, true);
    const localOffset = view.getUint32(pos + 42, true);

    const nameBytes = new Uint8Array(arrayBuffer, pos + 46, nameLen);
    const name = new TextDecoder().decode(nameBytes);

    // Read local header to get precise data offset
    if (localOffset + 30 <= totalLength) {
      const localNameLen = view.getUint16(localOffset + 26, true);
      const localExtraLen = view.getUint16(localOffset + 28, true);
      const dataOffset = localOffset + 30 + localNameLen + localExtraLen;

      if (dataOffset + compSize <= totalLength) {
        const compData = new Uint8Array(arrayBuffer, dataOffset, compSize);
        files[name] = { method, compSize, uncompSize, compData };
      }
    }

    pos += 46 + nameLen + extraLen + commentLen;
  }

  // Helper to decompress a file entry
  async function getFileBytes(filename) {
    const f = files[filename];
    if (!f) return null;

    if (f.method === 0) {
      return f.compData;
    }

    if (f.method === 8) {
      if (typeof DecompressionStream !== "undefined") {
        const ds = new DecompressionStream("deflate-raw");
        const writer = ds.writable.getWriter();
        writer.write(f.compData);
        writer.close();
        const res = new Response(ds.readable);
        return new Uint8Array(await res.arrayBuffer());
      }
      throw new Error("DecompressionStream is not supported in this environment.");
    }

    throw new Error(`Unsupported compression method: ${f.method}`);
  }

  async function getFileText(filename) {
    const bytes = await getFileBytes(filename);
    return bytes ? new TextDecoder().decode(bytes) : null;
  }

  return {
    fileNames: Object.keys(files),
    getFileBytes,
    getFileText
  };
}

/**
 * Builds scoped CSS overrides for EPUB color palettes to guarantee high contrast
 * without applying destructive global invert() filters.
 */
function getEpubPaletteCss(colorMode, theme) {
  if (colorMode === "publisher") {
    // Keep author & publisher styling intact (Image 2 style)
    return `
      html, body {
        background-color: #FFFFFF !important;
      }
    `;
  }

  if (colorMode === "cleanLight" || (colorMode === "auto" && theme?.id === "cleanLight")) {
    return `
      html, body {
        background-color: #FFFFFF !important;
        color: #111827 !important;
      }
      p, span, li, td, th {
        color: #111827 !important;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #0284C7 !important;
      }
    `;
  }

  if (colorMode === "cream" || (colorMode === "auto" && theme?.id === "cream")) {
    return `
      html, body {
        background-color: #FAF6EB !important;
        color: #1A222A !important;
      }
      p, span, li, td, th {
        color: #1A222A !important;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #92400E !important;
      }
    `;
  }

  if (colorMode === "sepia" || (colorMode === "auto" && theme?.id === "sepia")) {
    return `
      html, body {
        background-color: #F5ECD7 !important;
        color: #2C1E14 !important;
      }
      p, span, li, td, th {
        color: #2C1E14 !important;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #78350F !important;
      }
    `;
  }

  if (colorMode === "mint" || (colorMode === "auto" && theme?.id === "forest")) {
    return `
      html, body {
        background-color: #EDF6EE !important;
        color: #143224 !important;
      }
      p, span, li, td, th {
        color: #143224 !important;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #065F46 !important;
      }
    `;
  }

  if (colorMode === "dark" || (colorMode === "auto" && (theme?.id === "midnight" || theme?.id === "slate"))) {
    return `
      html, body {
        background-color: #12151A !important;
        color: #E2E8F0 !important;
      }
      p, span, li, td, th, div.Basic-Text-Frame {
        color: #E2E8F0 !important;
      }
      h1, h2, h3, h4, h5, h6, strong, b {
        color: #38BDF8 !important;
      }
      a {
        color: #7DD3FC !important;
      }
    `;
  }

  // Fallback: apply theme page background and text color cleanly
  const bg = theme?.pageBg || "#FFFFFF";
  const text = theme?.textColor || "#111827";
  return `
    html, body {
      background-color: ${bg} !important;
      color: ${text} !important;
    }
  `;
}

/**
 * Loads an EPUB file from a URL, extracts manifest, spine, CSS, fonts, and images,
 * and returns helper methods for rendering individual pages.
 */
export async function loadEpubDocument(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch e-Book: ${resp.status} ${resp.statusText}`);
  }
  const arrayBuffer = await resp.arrayBuffer();

  const archive = await parseEpubArchive(arrayBuffer);

  // 1. Locate root OPF file from META-INF/container.xml
  const containerText = await archive.getFileText("META-INF/container.xml");
  let rootPath = "OEBPS/content.opf";
  if (containerText) {
    const rootMatch = /full-path=[\"']([^\"']+)[\"']/i.exec(containerText);
    if (rootMatch && rootMatch[1]) {
      rootPath = rootMatch[1];
    }
  }

  // If rootPath not found in archive, search for any .opf file
  if (!archive.fileNames.includes(rootPath)) {
    const opfFound = archive.fileNames.find(f => f.endsWith(".opf"));
    if (opfFound) rootPath = opfFound;
  }

  const rootDir = rootPath.includes("/") ? rootPath.substring(0, rootPath.lastIndexOf("/") + 1) : "";
  const opfText = await archive.getFileText(rootPath);
  if (!opfText) {
    throw new Error("Package manifest (content.opf) not found in e-Book.");
  }

  // 2. Parse Manifest items
  const manifestItems = {};
  const itemRegex = /<item\s+[^>]*id=[\"']([^\"']+)[\"'][^>]*href=[\"']([^\"']+)[\"'][^>]*\/?>/gi;
  let m;
  while ((m = itemRegex.exec(opfText)) !== null) {
    manifestItems[m[1]] = decodeURIComponent(m[2]);
  }

  // Reverse manifest lookup (href to id)
  const itemHrefRegex = /<item\s+[^>]*href=[\"']([^\"']+)[\"'][^>]*id=[\"']([^\"']+)[\"'][^>]*\/?>/gi;
  while ((m = itemHrefRegex.exec(opfText)) !== null) {
    manifestItems[m[2]] = decodeURIComponent(m[1]);
  }

  // 3. Parse Spine items
  const spine = [];
  const spineRegex = /<itemref\s+[^>]*idref=[\"']([^\"']+)[\"'][^>]*\/?>/gi;
  while ((m = spineRegex.exec(opfText)) !== null) {
    const href = manifestItems[m[1]];
    if (href) {
      spine.push(rootDir + href);
    }
  }

  // Fallback: if spine is empty, take all xhtml / html files sorted
  if (spine.length === 0) {
    const htmlFiles = archive.fileNames.filter(f => f.endsWith(".xhtml") || f.endsWith(".html"));
    htmlFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    spine.push(...htmlFiles);
  }

  // 4. Extract CSS files
  let combinedCss = "";
  for (const fName of archive.fileNames) {
    if (fName.endsWith(".css")) {
      const css = await archive.getFileText(fName);
      if (css) combinedCss += css + "\n";
    }
  }

  // 5. Extract Images and Fonts, and create Object URLs
  const createdObjectUrls = [];
  const assetUrlMap = {}; // mapping relative paths to blob URLs

  for (const fName of archive.fileNames) {
    const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(fName);
    const isFont = /\.(otf|ttf|woff|woff2)$/i.test(fName);

    if (isImage || isFont) {
      const bytes = await archive.getFileBytes(fName);
      if (bytes) {
        let mime = "application/octet-stream";
        if (fName.endsWith(".png")) mime = "image/png";
        else if (fName.endsWith(".jpg") || fName.endsWith(".jpeg")) mime = "image/jpeg";
        else if (fName.endsWith(".gif")) mime = "image/gif";
        else if (fName.endsWith(".webp")) mime = "image/webp";
        else if (fName.endsWith(".svg")) mime = "image/svg+xml";
        else if (fName.endsWith(".otf")) mime = "font/otf";
        else if (fName.endsWith(".ttf")) mime = "font/ttf";
        else if (fName.endsWith(".woff")) mime = "font/woff";
        else if (fName.endsWith(".woff2")) mime = "font/woff2";

        const blob = new Blob([bytes], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        createdObjectUrls.push(blobUrl);

        // Store with both full zip path and relative path
        assetUrlMap[fName] = blobUrl;
        const baseName = fName.split("/").pop();
        assetUrlMap[baseName] = blobUrl;
        if (rootDir && fName.startsWith(rootDir)) {
          assetUrlMap[fName.substring(rootDir.length)] = blobUrl;
        }
      }
    }
  }

  // Replace font URLs inside CSS with blob URLs
  if (combinedCss) {
    for (const [key, url] of Object.entries(assetUrlMap)) {
      if (/\.(otf|ttf|woff|woff2)$/i.test(key)) {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        combinedCss = combinedCss.replace(new RegExp(`url\\([\"']?[^\"']*${escaped}[\"']?\\)`, "g"), `url("${url}")`);
      }
    }
  }

  // 6. Page HTML generator with dynamic color mode and line-focus event forwarding
  async function getPageHtml(pageNumber, options = {}) {
    const { colorMode = "auto", theme = null } = options;
    const pageIdx = Math.max(0, Math.min(pageNumber - 1, spine.length - 1));
    const targetFile = spine[pageIdx];
    if (!targetFile) return "<p>Page not found</p>";

    let html = await archive.getFileText(targetFile);
    if (!html) return "<p>Empty page</p>";

    // Remove existing link stylesheet tags
    html = html.replace(/<link\s+[^>]*rel=[\"']stylesheet[\"'][^>]*\/?>/gi, "");

    // Get color overrides for this mode/theme
    const paletteOverrides = getEpubPaletteCss(colorMode, theme);

    // Injected styles + interactive line focus bridge
    const injectedStyles = `
      <style>
        ${combinedCss}
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          overflow: auto !important;
        }
        ${paletteOverrides}
      </style>
      <script>
        // Prevent link navigations inside preview iframe
        document.addEventListener('click', (e) => {
          const a = e.target.closest('a');
          if (a) e.preventDefault();
        });

        // Forward pointer moves to parent reader for seamless Line Focus tracking
        const forwardMove = (e) => {
          try {
            window.parent.postMessage({
              type: 'EPUB_POINTER_MOVE',
              clientY: e.clientY,
              clientX: e.clientX
            }, '*');
          } catch (_) {}
        };
        window.addEventListener('mousemove', forwardMove, { passive: true });
        window.addEventListener('pointermove', forwardMove, { passive: true });
        window.addEventListener('touchmove', (e) => {
          if (e.touches && e.touches[0]) {
            forwardMove({ clientY: e.touches[0].clientY, clientX: e.touches[0].clientX });
          }
        }, { passive: true });
      </script>
    `;

    if (html.includes("</head>")) {
      html = html.replace("</head>", `${injectedStyles}</head>`);
    } else {
      html = `<head>${injectedStyles}</head>` + html;
    }

    // Replace image and asset src/href attributes with Blob URLs
    for (const [assetPath, blobUrl] of Object.entries(assetUrlMap)) {
      if (!/\.(otf|ttf|woff|woff2)$/i.test(assetPath)) {
        const escaped = assetPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Matches src="...assetPath" or xlink:href="...assetPath"
        const regex = new RegExp(`(src|href|xlink:href)=[\"'][^\"']*${escaped}[\"']`, "g");
        html = html.replace(regex, `$1="${blobUrl}"`);
      }
    }

    // Extract width and height if defined in viewport or body
    let width = 510;
    let height = 680;
    const vpMatch = /content=[\"'][^\"']*width=(\d+)[^\"']*height=(\d+)/i.exec(html);
    if (vpMatch) {
      width = parseInt(vpMatch[1], 10);
      height = parseInt(vpMatch[2], 10);
    } else {
      const styleW = /width:\s*(\d+)px/i.exec(html);
      const styleH = /height:\s*(\d+)px/i.exec(html);
      if (styleW) width = parseInt(styleW[1], 10);
      if (styleH) height = parseInt(styleH[1], 10);
    }

    return {
      html,
      width,
      height
    };
  }

  function cleanup() {
    createdObjectUrls.forEach(u => URL.revokeObjectURL(u));
  }

  return {
    spine,
    totalPages: spine.length,
    getPageHtml,
    cleanup
  };
}
