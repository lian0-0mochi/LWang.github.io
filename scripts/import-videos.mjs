import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { dirname, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { parseVideoSource } from '../src/video-utils.js';

const run = promisify(execFile);
export const categories = ['diving', 'snowboarding', 'companions', 'music', 'science'];
export const videoExtensions = new Set(['.mp4', '.mov', '.m4v', '.webm', '.avi', '.mkv']);

async function digest(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

/**
 * Check if a command exists in PATH
 */
async function commandExists(cmd) {
  try {
    await run('which', [cmd]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract a single representative frame from a video file.
 * Prefers FFmpeg if installed, falls back to macOS native AVFoundation extractor.
 */
export async function extractVideoFrame(root, videoPath, outputPath, timestampSeconds = 1.5) {
  const hasFfmpeg = await commandExists('ffmpeg');
  if (hasFfmpeg) {
    try {
      await run('ffmpeg', [
        '-y',
        '-ss',
        String(timestampSeconds),
        '-i',
        videoPath,
        '-vframes',
        '1',
        '-q:v',
        '2',
        outputPath,
      ]);
      return { duration: null };
    } catch (error) {
      console.warn(`ffmpeg extraction failed, trying native helper: ${error.message}`);
    }
  }

  if (process.platform === 'darwin') {
    const helperPath = join(root, 'scripts/extract-frame');
    const helperSwift = join(root, 'scripts/extract-frame.swift');

    // Compile helper if not present
    try {
      await access(helperPath);
    } catch {
      console.log('Compiling native macOS video thumbnail extractor...');
      await run('/usr/bin/swiftc', ['-O', helperSwift, '-o', helperPath]);
    }

    try {
      const { stdout } = await run(helperPath, [
        videoPath,
        outputPath,
        String(timestampSeconds),
      ]);
      const data = JSON.parse(stdout.trim());
      return {
        duration: data.duration,
        width: data.width,
        height: data.height,
      };
    } catch (error) {
      throw new Error(`Native video frame extraction failed: ${error.message}`);
    }
  }

  throw new Error(
    'Video thumbnail generation requires either FFmpeg installed in PATH or macOS with Swift command-line tools.'
  );
}

/**
 * Main video import routine.
 * Scans media-inbox/<category>/ for video files, extracts poster and thumb images,
 * archives originals safely into media-originals/videos/<category>/, and updates src/videos.json.
 */
export async function importVideos(root, selected = categories) {
  if (selected.some((cat) => !categories.includes(cat))) {
    throw new Error(`Choose from valid categories: ${categories.join(', ')}.`);
  }

  const manifestPath = join(root, 'src/videos.json');
  let videoData = { diving: [], snowboarding: [], companions: [], music: [], science: [] };

  try {
    const raw = await readFile(manifestPath, 'utf8');
    videoData = { ...videoData, ...JSON.parse(raw) };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  let importedCount = 0;

  for (const category of selected) {
    if (!videoData[category]) videoData[category] = [];
    const inboxDir = join(root, 'media-inbox', category);
    await mkdir(inboxDir, { recursive: true });

    const entries = (await readdir(inboxDir, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    for (const entry of entries) {
      if (!entry.isFile() || entry.name.startsWith('.')) continue;
      const ext = extname(entry.name).toLowerCase();
      if (!videoExtensions.has(ext)) continue;

      const sourcePath = join(inboxDir, entry.name);
      const sourceDigest = await digest(sourcePath);
      const previous = videoData[category].find((v) => v.sourceFile === entry.name);

      const stem = entry.name.slice(0, -ext.length);
      const slug =
        stem
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 60) || 'video';
      const suffix = createHash('sha256').update(entry.name).digest('hex').slice(0, 10);
      const fileBase = `${slug}-${suffix}`;

      const posterUrl = `/media/${category}/thumbs-video/${fileBase}-poster.jpg`;
      const thumbUrl = `/media/${category}/thumbs-video/${fileBase}-thumb.jpg`;

      const posterDest = join(root, 'public', posterUrl.slice(1));
      const thumbDest = join(root, 'public', thumbUrl.slice(1));

      let hasAssets = false;
      if (previous?.sourceDigest === sourceDigest) {
        const posterOk = await access(posterDest).then(() => true, () => false);
        const thumbOk = await access(thumbDest).then(() => true, () => false);
        if (posterOk && thumbOk) hasAssets = true;
      }

      let meta = { duration: previous?.duration || null };

      if (!hasAssets) {
        const temporary = await mkdtemp(join(tmpdir(), 'lian-video-frame-'));
        const rawFrame = join(temporary, 'raw-frame.jpg');

        try {
          console.log(`Extracting thumbnail for ${category}/${entry.name}...`);
          const extractedMeta = await extractVideoFrame(root, sourcePath, rawFrame, 1.5);
          if (extractedMeta.duration) meta.duration = extractedMeta.duration;

          await mkdir(dirname(posterDest), { recursive: true });

          // Generate high quality poster (1600px max)
          await run('/usr/bin/sips', [
            '-s',
            'format',
            'jpeg',
            '-s',
            'formatOptions',
            '85',
            '-Z',
            '1600',
            rawFrame,
            '--out',
            posterDest,
          ]);

          // Generate compact card thumbnail (480px max)
          await run('/usr/bin/sips', [
            '-s',
            'format',
            'jpeg',
            '-s',
            'formatOptions',
            '80',
            '-Z',
            '480',
            rawFrame,
            '--out',
            thumbDest,
          ]);
        } finally {
          await rm(temporary, { recursive: true, force: true });
        }
      }

      // Safely move original video to media-originals/videos/<category>/
      // This preserves 100% full quality, empties media-inbox, and ensures original is gitignored.
      const originalsDir = join(root, 'media-originals/videos', category);
      await mkdir(originalsDir, { recursive: true });
      const targetOriginal = join(originalsDir, entry.name);

      try {
        await rename(sourcePath, targetOriginal);
      } catch {
        // Fallback across filesystems
        await copyFile(sourcePath, targetOriginal);
        await rm(sourcePath);
      }

      const parsed = parseVideoSource(previous);
      const isPlayable = parsed.isPlayable;

      const videoEntry = {
        id: previous?.id || `${slug}-${suffix}`,
        title: previous?.title || stem.replace(/[_-]+/g, ' '),
        category,
        description: previous?.description || '',
        location: previous?.location || '',
        date: previous?.date || '',
        duration: meta.duration || previous?.duration || null,
        sourceFile: entry.name,
        sourceDigest,
        poster: posterUrl,
        thumb: thumbUrl,
        externalUrl: previous?.externalUrl || '',
        youtubeId: previous?.youtubeId || (parsed.provider === 'youtube' ? parsed.id : ''),
        vimeoId: previous?.vimeoId || (parsed.provider === 'vimeo' ? parsed.id : ''),
        status: isPlayable ? 'published' : 'pending',
      };

      const existingIndex = videoData[category].indexOf(previous);
      if (existingIndex >= 0) {
        videoData[category][existingIndex] = videoEntry;
      } else {
        videoData[category].push(videoEntry);
      }

      importedCount++;
      console.log(`✓ Processed video: ${category}/${entry.name} -> ${posterUrl}`);
    }
  }

  await writeFile(manifestPath, JSON.stringify(videoData, null, 2) + '\n');
  console.log(`${importedCount} video(s) imported. Video metadata file: src/videos.json`);
  return importedCount;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const selected = process.argv.slice(2);
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  importVideos(root, selected.length ? selected : categories).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
