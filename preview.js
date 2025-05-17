/**
 * Normalize a resource URL:
 * - If it’s on the same origin as `baseUrl`, returns just its filename (e.g. "styles.css")
 * - Otherwise returns the full resolved URL (e.g. the CDN URL)
 */
function normalizeResource(resourceUrl, baseUrl = document.baseURI) {
  let resolved;
  try {
    resolved = new URL(resourceUrl, baseUrl);
  } catch {
    return null; // invalid URL
  }

  const base = new URL(baseUrl);
  if (resolved.origin === base.origin) {
    return resolved.pathname.split('/').pop();  // e.g. "styles.css"
  }
  return resolved.href;                        // e.g. CDN URL
}

/**
 * Parses HTML and extracts dependencies, normalized.
 */
function getHtmlDependencies(htmlContent, baseUrl = document.baseURI) {
  const deps = {
    stylesheets: new Set(),
    scripts:     new Set(),
    images:      new Set(),
    fonts:       new Set(),
    media:       new Set(),
  };

  // unified add + normalize
  const add = (set, rawUrl) => {
    const norm = normalizeResource(rawUrl, baseUrl);
    if (norm) set.add(norm);
  };

  const doc = new DOMParser()
    .parseFromString(htmlContent, 'text/html');

  // 1) <link rel="stylesheet"> + @import
  doc.querySelectorAll('link[rel="stylesheet"]').forEach(link =>
    add(deps.stylesheets, link.getAttribute('href'))
  );
  doc.querySelectorAll('style').forEach(style => {
    for (const [, u] of style.textContent.matchAll(/@import\s+['"]([^'"]+)['"]/g)) {
      add(deps.stylesheets, u);
    }
  });

  // 2) <script src>
  doc.querySelectorAll('script[src]').forEach(s =>
    add(deps.scripts, s.getAttribute('src'))
  );

  // 3) images & <source src>
  doc.querySelectorAll('img[src], source[src]').forEach(el =>
    add(deps.images, el.getAttribute('src'))
  );

  // 4) media: audio, video, object[data]
  doc.querySelectorAll('audio[src], video[src], object[data]').forEach(el => {
    const url = el.getAttribute('src') || el.getAttribute('data');
    add(deps.media, url);
  });

  // 5) fonts via Google Fonts (or any font CSS)
  doc.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]').forEach(link =>
    add(deps.fonts, link.getAttribute('href'))
  );

  // 6) inline styles—background-image URLs
  doc.querySelectorAll('[style]').forEach(el => {
    for (const [, u] of el.getAttribute('style')
      .matchAll(/url\(\s*['"]?([^)'"]+)['"]?\s*\)/g)) {
      add(deps.images, u);
    }
  });

  // turn Sets → Arrays
  return {
    stylesheets: [...deps.stylesheets],
    scripts:     [...deps.scripts],
    images:      [...deps.images],
    fonts:       [...deps.fonts],
    media:       [...deps.media],
  };
}

const outputFrame = document.getElementById('outputFrame');

let isFirstPreviewRun = true;

function previewFirstHtmlFile() {
  getHtmlDependencies(files[firstHtmlFileId].getValue())
  if (firstHtmlFileId && files[firstHtmlFileId]) {
    let htmlContent = files[firstHtmlFileId].getValue();

    const injectedScriptContent = `
      (() => {
        // console.log('[iframe] console override running');
        const original = { ...console };
        ['log', 'info', 'warn', 'error', 'debug', 'table'].forEach(type => {
          console[type] = (...args) => {
            window.parent.postMessage({ type: 'iframe-console', logType: type, args }, '*');
            original[type](...args);
          };
        });
      })();
    `;

    // Define the core logic to be executed
    const updateIframe = () => {
  const scriptTag = `<script>${injectedScriptContent}<\/script>`;
  let finalHtml = scriptTag + htmlContent;

  const htmlDependencies = LocalFiles(files, getHtmlDependencies(finalHtml))

  // console.log(htmlDependencies);

  let modifiedHtml = finalHtml;

  htmlDependencies.forEach(dependency => {
    const { name, code } = dependency;
    if (name.endsWith('.css')) {
      const linkTagRegex = new RegExp(`<link rel="stylesheet" href="${name}">`, 'g');
      modifiedHtml = modifiedHtml.replace(linkTagRegex, `<style>\n${code}\n</style>`);
    } else if (name.endsWith('.js')) {
      const scriptTagRegex = new RegExp(`<script src="${name}"><\/script>`, 'g');
      modifiedHtml = modifiedHtml.replace(scriptTagRegex, `<script>\n${code}\n<\/script>`);
    }
  });

  const blob = new Blob([modifiedHtml], { type: 'text/html' });
  const blobURL = URL.createObjectURL(blob);
  outputFrame.src = blobURL;
};

    if (isFirstPreviewRun) {
      setTimeout(updateIframe, 1000); // Run with delay on the first time
      isFirstPreviewRun = false; // Set the flag to false after the first run
    } else {
      updateIframe(); // Run immediately on subsequent times
    }

  } else {
    outputFrame.src = '';
  }
}
