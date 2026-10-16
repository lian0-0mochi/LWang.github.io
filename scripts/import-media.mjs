import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, copyFile, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { dirname, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const categories = ['diving', 'snowboarding', 'companions', 'music', 'science'];
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif', '.tif', '.tiff', '.webp']);

async function digest(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export async function importMedia(root, selected = categories) {
  if (selected.some(category => !categories.includes(category))) throw new Error(`Choose one of: ${categories.join(', ')}.`);
  const manifestPath = join(root, 'src/media.generated.json');
  const galleries = JSON.parse(await readFile(manifestPath, 'utf8'));
  let imported = 0;
  for (const category of selected) {
    const inbox = join(root, 'media-inbox', category);
    await mkdir(inbox, { recursive: true });
    const entries = (await readdir(inbox, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (!entry.isFile() || entry.name.startsWith('.')) continue;
      if (!imageExtensions.has(extname(entry.name).toLowerCase())) {
        console.log(`Skipped ${category}/${entry.name}: this importer handles photographs; videos stay local.`);
        continue;
      }
      if (process.platform !== 'darwin') throw new Error('Photo import requires macOS sips. Already imported photos work on every platform.');
      const source = join(inbox, entry.name);
      const sourceDigest = await digest(source);
      const previous = galleries[category].find(photo => photo.sourceFile === entry.name);
      if (previous?.sourceDigest === sourceDigest) {
        const paths = [previous.src, previous.thumb, ...(previous.srcSet?.split(',').map(s => s.trim().split(/\s+/)[0]) ?? [])];
        const existing = await Promise.all(paths.map(path => access(join(root, 'public', path.slice(1))).then(() => true, () => false)));
        if (existing.every(Boolean)) continue;
      }
      const stem = entry.name.slice(0, -extname(entry.name).length);
      const slug = stem.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'photo';
      const suffix = createHash('sha256').update(entry.name).digest('hex').slice(0, 10);
      const filename = `${slug}-${suffix}.jpg`;
      const temporary = await mkdtemp(join(tmpdir(), 'lian-photo-import-'));
      const variants = [];
      try {
        for (const maxSize of [480, 960, 1600]) {
          const url = `/media/${category}/${maxSize === 1600 ? '' : `thumbs-${maxSize}/`}${filename}`;
          const output = join(temporary, `${maxSize}.jpg`);
          await run('/usr/bin/sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '80', '-Z', String(maxSize), source, '--out', output]);
          const { stdout } = await run('/usr/bin/sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', output]);
          const width = Number(stdout.match(/pixelWidth:\s*(\d+)/)?.[1]);
          const height = Number(stdout.match(/pixelHeight:\s*(\d+)/)?.[1]);
          if (!width || !height || (await stat(output)).size > 100 * 1024 * 1024) throw new Error(`Invalid or oversized optimized image: ${entry.name}`);
          variants.push({ url, output, width, height });
        }
        for (const variant of variants) {
          const output = join(root, 'public', variant.url.slice(1));
          await mkdir(dirname(output), { recursive: true });
          await copyFile(variant.output, output);
        }
      } finally {
        await rm(temporary, { recursive: true, force: true });
      }
      const main = variants[2];
      // Retain edited captions and alt text when the source photo is reimported.
      const photo = {
        title: stem.replace(/[_-]+/g, ' '),
        alt: stem.replace(/[_-]+/g, ' '),
        caption: '',
        replaceable: false,
        ...previous,
        sourceFile: entry.name,
        sourceDigest,
        src: main.url,
        thumb: variants[0].url,
        srcSet: [...new Map(variants.map(v => [v.width, `${v.url} ${v.width}w`])).values()].join(', '),
        sizes: '(max-width: 640px) 92vw, (max-width: 1100px) 45vw, 30vw',
        width: main.width,
        height: main.height,
      };
      const index = galleries[category].indexOf(previous);
      if (index >= 0) galleries[category][index] = photo;
      else galleries[category].push(photo);
      imported++;
      console.log(`Imported ${category}/${entry.name}`);
    }
  }
  await writeFile(manifestPath, JSON.stringify(galleries, null, 2) + '\n');
  console.log(`${imported} photo(s) imported. Captions and alt text: src/media.generated.json`);
  return imported;
}

import { importVideos } from './import-videos.mjs';

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const selected = process.argv.slice(2);
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const cats = selected.length ? selected : categories;
  try {
    await importMedia(root, cats);
    await importVideos(root, cats);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
