import { execFileSync } from 'node:child_process';
import { stat } from 'node:fs/promises';

const candidates = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))];
const oversized = [];
let largest = { path: '', size: 0 };
for (const path of candidates) {
  let file;
  try { file = await stat(path); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  if (!file.isFile()) continue;
  if (file.size > largest.size) largest = { path, size: file.size };
  if (file.size > 100 * 1024 * 1024) oversized.push(path);
}
if (oversized.length) {
  console.error('Files exceed the GitHub 100 MiB limit:\n' + oversized.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${candidates.length} tracked/unignored files checked; no file exceeds 100 MiB.`);
  console.log(`Largest: ${largest.path} (${(largest.size / 1024 / 1024).toFixed(2)} MiB).`);
}
