import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { importVideos } from './import-videos.mjs';

test('video import processes video, generates poster/thumb, moves original, and preserves metadata', { skip: process.platform !== 'darwin' }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'lian-video-test-'));
  try {
    await mkdir(join(root, 'src'), { recursive: true });
    await mkdir(join(root, 'scripts'), { recursive: true });
    await mkdir(join(root, 'media-inbox/diving'), { recursive: true });

    // Copy helper scripts needed on darwin
    const actualHelper = fileURLToPath(new URL('extract-frame', import.meta.url));
    const actualHelperSwift = fileURLToPath(new URL('extract-frame.swift', import.meta.url));
    try {
      await copyFile(actualHelper, join(root, 'scripts/extract-frame'));
    } catch {
      await copyFile(actualHelperSwift, join(root, 'scripts/extract-frame.swift'));
    }

    const manifest = join(root, 'src/videos.json');
    await writeFile(manifest, JSON.stringify({ diving: [], snowboarding: [], companions: [], music: [], science: [] }));

    // Use existing archive video to test real frame extraction
    const sampleVideo = fileURLToPath(new URL('../media-originals/archive/hobbies-videos/hobbies-video-01.mp4', import.meta.url));
    await copyFile(sampleVideo, join(root, 'media-inbox/diving/sample-dive.mp4'));

    const imported = await importVideos(root, ['diving']);
    assert.equal(imported, 1);

    // Verify metadata saved
    const manifestContent = JSON.parse(await readFile(manifest, 'utf8'));
    assert.equal(manifestContent.diving.length, 1);
    const video = manifestContent.diving[0];
    assert.equal(video.category, 'diving');
    assert.ok(video.poster.endsWith('-poster.jpg'));
    assert.ok(video.thumb.endsWith('-thumb.jpg'));
    assert.equal(video.status, 'pending');

    // Verify generated poster and thumb exist on disk
    await access(join(root, 'public', video.poster.slice(1)));
    await access(join(root, 'public', video.thumb.slice(1)));

    // Verify original video was moved to media-originals/videos/diving/ and removed from inbox
    await access(join(root, 'media-originals/videos/diving/sample-dive.mp4'));
    let inboxExists = true;
    try {
      await access(join(root, 'media-inbox/diving/sample-dive.mp4'));
    } catch {
      inboxExists = false;
    }
    assert.equal(inboxExists, false, 'Original video should be cleared from media-inbox');

    // Simulate user editing title, description, and adding YouTube URL
    video.title = 'Custom Title Edited by User';
    video.description = 'Custom Description';
    video.externalUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await writeFile(manifest, JSON.stringify(manifestContent));

    // Place another identical video or rerun
    await copyFile(sampleVideo, join(root, 'media-inbox/diving/sample-dive.mp4'));
    const rerun = await importVideos(root, ['diving']);
    assert.equal(rerun, 1);

    const rerunContent = JSON.parse(await readFile(manifest, 'utf8'));
    assert.equal(rerunContent.diving.length, 1, 'Should not create duplicate entry');
    assert.equal(rerunContent.diving[0].title, 'Custom Title Edited by User');
    assert.equal(rerunContent.diving[0].description, 'Custom Description');
    assert.equal(rerunContent.diving[0].externalUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    // Check invalid category throws
    await assert.rejects(importVideos(root, ['invalid-category']), /Choose from valid/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
