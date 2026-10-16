import { execFileSync } from 'node:child_process';
import { stat, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const videoExtensions = new Set(['.mp4', '.mov', '.m4v', '.webm', '.avi', '.mkv']);
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MiB GitHub hard limit

const candidates = [
  ...new Set(
    execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
      encoding: 'utf8',
    })
      .split('\0')
      .filter(Boolean)
  ),
];

const oversized = [];
const trackedVideos = [];
let largest = { path: '', size: 0 };

for (const path of candidates) {
  let file;
  try {
    file = await stat(path);
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  if (!file.isFile()) continue;

  const ext = extname(path).toLowerCase();
  if (videoExtensions.has(ext)) {
    trackedVideos.push({ path, size: file.size });
  }

  if (file.size > largest.size) {
    largest = { path, size: file.size };
  }

  if (file.size > MAX_FILE_SIZE) {
    oversized.push({ path, size: file.size });
  }
}

// Also check dist/ if it exists (ensures no build output contains oversized or raw video assets)
async function checkDistDir(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await checkDistDir(full);
      } else if (entry.isFile()) {
        const file = await stat(full);
        const ext = extname(entry.name).toLowerCase();
        if (videoExtensions.has(ext)) {
          trackedVideos.push({ path: full, size: file.size });
        }
        if (file.size > MAX_FILE_SIZE) {
          oversized.push({ path: full, size: file.size });
        }
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

await checkDistDir('dist');

let hasError = false;

if (trackedVideos.length > 0) {
  hasError = true;
  console.error('\n❌ ERROR: Video file(s) detected in Git tracking or build output:');
  for (const item of trackedVideos) {
    console.error(`  - ${item.path} (${(item.size / 1024 / 1024).toFixed(2)} MiB)`);
  }
  console.error(
    '\nHow to resolve:\n' +
      '  1. Keep full-quality video originals strictly in "media-originals/" (which is git-ignored).\n' +
      '  2. If staged in git, untrack the file: git rm --cached <path>\n' +
      '  3. Upload the video to YouTube (Unlisted) or Vimeo.\n' +
      '  4. Add the hosted URL to "src/videos.json" and commit only the metadata/poster images.\n'
  );
}

if (oversized.length > 0) {
  hasError = true;
  console.error('\n❌ ERROR: File(s) exceed the 100 MiB GitHub Pages limit:');
  for (const item of oversized) {
    console.error(`  - ${item.path} (${(item.size / 1024 / 1024).toFixed(2)} MiB)`);
  }
  console.error(
    '\nHow to resolve:\n' +
      '  1. Optimize, compress, or split large assets before committing.\n' +
      '  2. Videos must be stored in "media-originals/" and hosted externally on YouTube or Vimeo.\n'
  );
}

if (hasError) {
  process.exitCode = 1;
} else {
  console.log(
    `✓ ${candidates.length} tracked/unignored files checked: zero video files tracked; no file exceeds 100 MiB.`
  );
  if (largest.path) {
    console.log(`  Largest file: ${largest.path} (${(largest.size / 1024 / 1024).toFixed(2)} MiB).`);
  }
}
