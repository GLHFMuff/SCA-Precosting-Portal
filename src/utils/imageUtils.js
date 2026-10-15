/**
 * Image Base64 Decoder & Formatter Utility for Precosting Portal
 * Handles pure base64 strings, Data URIs, and fallback paths cleanly.
 */

// Default SVG placeholder for garment styles when image is absent or corrupt
export const DEFAULT_GARMENT_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>`;

/**
 * Decodes / formats a base64 or URL image into a valid browser image src.
 * @param {string} imageVal - Base64 string, Data URI, or path
 * @param {string} fallback - Optional fallback URL/Data URI
 * @returns {string} Safe src for <img> tag
 */
export function decodeBase64Image(imageVal, fallback = DEFAULT_GARMENT_SVG) {
  if (!imageVal || typeof imageVal !== 'string') {
    return fallback;
  }

  const trimmed = imageVal.trim();
  if (!trimmed) return fallback;

  // 1. Already a complete Data URI (data:image/jpeg;base64,... etc.)
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // 2. Raw base64 string without data:image prefix
  // JPEG raw base64 header (/9j/)
  if (trimmed.startsWith('/9j/')) {
    return `data:image/jpeg;base64,${trimmed}`;
  }

  // PNG raw base64 header (iVBORw0KGgo)
  if (trimmed.startsWith('iVBORw0KGgo')) {
    return `data:image/png;base64,${trimmed}`;
  }

  // WebP raw base64 header (UklGR)
  if (trimmed.startsWith('UklGR')) {
    return `data:image/webp;base64,${trimmed}`;
  }

  // SVG raw base64 header (PHN2Zy or PD94bW)
  if (trimmed.startsWith('PHN2Zy') || trimmed.startsWith('PD94bW')) {
    return `data:image/svg+xml;base64,${trimmed}`;
  }

  // Generic base64 detection: alphanumeric + '/' + '+' + '=' of length >= 60 without spaces or query params
  if (/^[A-Za-z0-9+/=]{60,}$/.test(trimmed)) {
    return `data:image/jpeg;base64,${trimmed}`;
  }

  // 3. Fallback for relative/absolute HTTP paths (/images/shirt.jpg, http://...)
  return trimmed;
}

/**
 * Converts a browser File object to a Base64 Data URL string.
 * @param {File} file - File from <input type="file" />
 * @returns {Promise<string>} Base64 Data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
