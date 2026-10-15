import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Converts a file path, URL, or image name to a Base64 data URL.
 * If the input is already a Base64 data URL or raw base64 string, returns it intact.
 */
export function ensureBase64Image(imageVal) {
  if (!imageVal || typeof imageVal !== 'string') return '';
  const trimmed = imageVal.trim();
  if (!trimmed) return '';

  // Already a base64 data URI
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Already a raw base64 string (JPEG, PNG, WebP signature)
  if (
    trimmed.startsWith('/9j/') ||
    trimmed.startsWith('iVBORw0KGgo') ||
    trimmed.startsWith('UklGR') ||
    trimmed.startsWith('PHN2Zy')
  ) {
    return `data:image/jpeg;base64,${trimmed}`;
  }

  const filename = path.basename(trimmed);
  const candidates = [
    path.resolve(__dirname, '../../../public/images', filename),
    path.resolve(__dirname, '../../../dist/images', filename),
    path.resolve(__dirname, '../../uploads', filename),
    path.resolve(process.cwd(), 'public/images', filename),
    path.resolve(process.cwd(), 'dist/images', filename),
    path.resolve(process.cwd(), 'server/uploads', filename),
  ];

  for (const candidatePath of candidates) {
    if (fs.existsSync(candidatePath)) {
      try {
        const ext = path.extname(candidatePath).toLowerCase().replace('.', '');
        const mime =
          ext === 'png'
            ? 'image/png'
            : ext === 'webp'
            ? 'image/webp'
            : ext === 'svg'
            ? 'image/svg+xml'
            : 'image/jpeg';
        const buffer = fs.readFileSync(candidatePath);
        return `data:${mime};base64,${buffer.toString('base64')}`;
      } catch (err) {
        console.warn(`[imageHelper] Gagal mengonversi ${candidatePath} ke base64:`, err.message);
      }
    }
  }

  // Return trimmed as fallback
  return trimmed;
}
