import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVideoSource, formatDuration } from '../src/video-utils.js';

test('parseVideoSource detects YouTube URLs and timestamps', () => {
  // Standard watch URL
  const yt1 = parseVideoSource({
    externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  });
  assert.equal(yt1.provider, 'youtube');
  assert.equal(yt1.id, 'dQw4w9WgXcQ');
  assert.equal(yt1.isPlayable, true);
  assert.equal(yt1.embedUrl, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0');

  // Short URL with timestamp
  const yt2 = parseVideoSource({
    externalUrl: 'https://youtu.be/0mfICpEBwic?t=1168',
  });
  assert.equal(yt2.provider, 'youtube');
  assert.equal(yt2.id, '0mfICpEBwic');
  assert.equal(yt2.start, 1168);
  assert.equal(yt2.embedUrl, 'https://www.youtube-nocookie.com/embed/0mfICpEBwic?autoplay=1&rel=0&start=1168');

  // Livestream URL
  const yt3 = parseVideoSource({
    url: 'https://www.youtube.com/live/f-RyFVn-hxs?t=1921s',
  });
  assert.equal(yt3.provider, 'youtube');
  assert.equal(yt3.id, 'f-RyFVn-hxs');
  assert.equal(yt3.start, 1921);

  // Direct youtubeId with start property
  const yt4 = parseVideoSource({
    youtubeId: '0mfICpEBwic',
    start: 50,
  });
  assert.equal(yt4.provider, 'youtube');
  assert.equal(yt4.id, '0mfICpEBwic');
  assert.equal(yt4.start, 50);
});

test('parseVideoSource detects Vimeo URLs', () => {
  const vimeo = parseVideoSource({
    externalUrl: 'https://vimeo.com/76979871',
  });
  assert.equal(vimeo.provider, 'vimeo');
  assert.equal(vimeo.id, '76979871');
  assert.equal(vimeo.isPlayable, true);
  assert.equal(vimeo.embedUrl, 'https://player.vimeo.com/video/76979871?autoplay=1');
});

test('parseVideoSource detects Cloudflare R2 and direct video URLs', () => {
  const r2 = parseVideoSource({
    externalUrl: 'https://pub-abc123xyz.r2.dev/hobbies-video-01.mp4',
  });
  assert.equal(r2.provider, 'r2');
  assert.equal(r2.isPlayable, true);
  assert.equal(r2.embedUrl, 'https://pub-abc123xyz.r2.dev/hobbies-video-01.mp4');
  assert.equal(r2.providerLabel, 'Cloudflare R2');

  const direct = parseVideoSource({
    externalUrl: 'https://cdn.example.com/videos/diving-reef.mp4',
  });
  assert.equal(direct.provider, 'external');
  assert.equal(direct.isPlayable, true);
  assert.equal(direct.providerLabel, 'Direct Video');
});

test('parseVideoSource handles pending videos without URLs', () => {
  const pending = parseVideoSource({
    id: 'hobbies-video-01',
    externalUrl: '',
    youtubeId: '',
  });
  assert.equal(pending.isPlayable, false);
  assert.equal(pending.status, 'pending');
});

test('formatDuration formats seconds into readable strings', () => {
  assert.equal(formatDuration(41.01), '0:41');
  assert.equal(formatDuration(59.36), '0:59');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(3665), '1:01:05');
  assert.equal(formatDuration(0), null);
  assert.equal(formatDuration(null), null);
});
