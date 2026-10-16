import { access, readdir, readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import * as content from '../src/data.js';

const videoExtensions = new Set(['.mp4', '.mov', '.m4v', '.webm', '.avi', '.mkv']);
const paths = new Set();
const localPaths = new Set();
const fields = new Set(['src', 'thumb', 'image', 'cvPath', 'pdfUrl', 'poster']);

function collect(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'localSrc') localPaths.add(entry);
    if (fields.has(key) && typeof entry === 'string' && entry.startsWith('/')) paths.add(entry);
    if (key === 'srcSet' && typeof entry === 'string') {
      entry.split(',').forEach((source) => paths.add(source.trim().split(/\s+/)[0]));
    }
    if (typeof entry === 'object') collect(entry);
  }
}

collect(content);

// 1. Verify all referenced media files exist in public/
const missing = [];
for (const path of paths) {
  const relative = decodeURIComponent(path.slice(1));
  const local = join('public', relative);
  try {
    await access(local);
  } catch {
    missing.push(path);
  }
}
if (missing.length) {
  throw new Error('Missing media or downloads in public/:\n' + missing.join('\n'));
}

// 2. Verify CV is a valid PDF
const cv = await readFile(join('public', content.profile.cvPath.slice(1)));
if (cv.subarray(0, 5).toString() !== '%PDF-') throw new Error('CV is not a valid PDF.');

// 3. Verify public/ contains NO video files (they must not bloat the deployment bundle)
const forbiddenVideos = [];
async function scanForVideos(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanForVideos(full);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (videoExtensions.has(ext)) {
          forbiddenVideos.push(full);
        }
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
await scanForVideos('public');

if (forbiddenVideos.length > 0) {
  throw new Error(
    `Video files found in public/ directory:\n${forbiddenVideos.join('\n')}\n` +
      'Original videos must be stored in media-originals/, never in public/ or dist/.'
  );
}

console.log(`✓ ${paths.size} media/download references verified; CV is a valid PDF.`);

let available = 0;
for (const path of localPaths) {
  try {
    await access(path.slice(1));
    available++;
  } catch {
    /* Original videos are optional on fresh clone */
  }
}
if (localPaths.size > 0) {
  console.log(
    `✓ ${available}/${localPaths.size} local video originals present in media-originals/; originals are excluded from published builds.`
  );
}
