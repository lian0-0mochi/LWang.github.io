import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as content from '../src/data.js';

const paths = new Set();
const localPaths = new Set();
const fields = new Set(['src', 'thumb', 'image', 'cvPath', 'pdfUrl', 'poster']);
function collect(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'localSrc') localPaths.add(entry);
    if (fields.has(key) && typeof entry === 'string' && entry.startsWith('/')) paths.add(entry);
    if (key === 'srcSet') entry.split(',').forEach(source => paths.add(source.trim().split(/\s+/)[0]));
    if (typeof entry === 'object') collect(entry);
  }
}
collect(content);
const missing = [];
for (const path of paths) {
  const relative = decodeURIComponent(path.slice(1));
  const local = join('public', relative);
  try { await access(local); } catch { missing.push(path); }
}
if (missing.length) throw new Error('Missing media or downloads:\n' + missing.join('\n'));
const cv = await readFile(join('public', content.profile.cvPath.slice(1)));
if (cv.subarray(0, 5).toString() !== '%PDF-') throw new Error('CV is not a PDF.');
console.log(`${paths.size} media/download references verified; the CV is a valid PDF.`);
let available = 0;
for (const path of localPaths) {
  try { await access(path.slice(1)); available++; } catch { /* Original videos are optional on a fresh GitHub clone. */ }
}
console.log(`${available}/${localPaths.size} local video originals present; originals are excluded from published builds.`);
