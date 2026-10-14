import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { importMedia } from './import-media.mjs';
import { assetSrcSet, assetUrl } from '../src/asset-url.js';

test('project-site URLs keep local assets under the base and preserve external URLs', () => {
  assert.equal(assetUrl('/files/CV.pdf', '/LWang.github.io/'), '/LWang.github.io/files/CV.pdf');
  assert.equal(assetUrl('/media/photo.jpg', '/'), '/media/photo.jpg');
  assert.equal(assetUrl('https://example.com/video.mp4', '/LWang.github.io/'), 'https://example.com/video.mp4');
  assert.equal(assetSrcSet('/media/a.jpg 480w, /media/b.jpg 960w', '/LWang.github.io/'), '/LWang.github.io/media/a.jpg 480w, /LWang.github.io/media/b.jpg 960w');
});

test('photo import optimizes, skips videos, and retains metadata on reruns', { skip: process.platform !== 'darwin' }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'lian-media-test-'));
  try {
    await mkdir(join(root, 'src'), { recursive: true });
    await mkdir(join(root, 'media-inbox/diving'), { recursive: true });
    const manifest = join(root, 'src/media.generated.json');
    await writeFile(manifest, JSON.stringify({ diving: [], snowboarding: [], companions: [], music: [], science: [] }));
    await copyFile(fileURLToPath(new URL('../public/media/music/pipa-portrait-01.jpeg', import.meta.url)), join(root, 'media-inbox/diving/photo.jpeg'));
    await writeFile(join(root, 'media-inbox/diving/recording.mp4'), 'local video');
    assert.equal(await importMedia(root, ['diving']), 1);
    const galleries = JSON.parse(await readFile(manifest, 'utf8'));
    const photo = galleries.diving[0];
    assert.ok(photo.width <= 1600 && photo.height <= 1600);
    assert.equal((await readFile(join(root, 'public', photo.src.slice(1)))).subarray(0, 2).toString('hex'), 'ffd8');
    assert.equal(galleries.diving.length, 1);
    photo.caption = 'A caption I edited';
    photo.alt = 'A description I edited';
    await writeFile(manifest, JSON.stringify(galleries));
    assert.equal(await importMedia(root, ['diving']), 0);
    const rerun = JSON.parse(await readFile(manifest, 'utf8'));
    assert.equal(rerun.diving.length, 1);
    assert.equal(rerun.diving[0].caption, photo.caption);
    assert.equal(rerun.diving[0].alt, photo.alt);
    await assert.rejects(importMedia(root, ['unknown']), /Choose one/);
    const before = await readFile(manifest, 'utf8');
    await writeFile(join(root, 'media-inbox/diving/invalid.jpeg'), 'not an image');
    await assert.rejects(importMedia(root, ['diving']));
    assert.equal(await readFile(manifest, 'utf8'), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
