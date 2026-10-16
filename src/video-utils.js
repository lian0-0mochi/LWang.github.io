/**
 * Video source parsing and formatting utilities.
 * Supports YouTube (unlisted/public), Vimeo, custom external URLs,
 * and local developer fallbacks.
 */

export function parseVideoSource(video) {
  if (!video) return { isPlayable: false, status: 'pending' };

  const url = (video.externalUrl || video.url || '').trim();
  const rawYoutubeId = (video.youtubeId || '').trim();
  const rawVimeoId = (video.vimeoId || '').trim();

  // 1. YouTube detection
  let youtubeId = rawYoutubeId;
  let startTime = video.start || 0;

  if (url) {
    const ytMatch = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([\w-]{11})/
    );
    if (ytMatch) {
      youtubeId = ytMatch[1];
    }
    const timeMatch = url.match(/[?&](?:t|start)=([0-9]+)s?/);
    if (timeMatch && !startTime) {
      startTime = parseInt(timeMatch[1], 10);
    }
  }

  if (youtubeId && /^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
    const startParam = startTime ? `&start=${startTime}` : '';
    return {
      provider: 'youtube',
      id: youtubeId,
      start: startTime,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0${startParam}`,
      watchUrl: `https://www.youtube.com/watch?v=${youtubeId}${startTime ? `&t=${startTime}s` : ''}`,
      providerLabel: 'YouTube',
      isPlayable: true,
      status: 'published',
    };
  }

  // 2. Vimeo detection
  let vimeoId = rawVimeoId;
  if (url) {
    const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
    if (vimeoMatch) {
      vimeoId = vimeoMatch[1];
    }
  }

  if (vimeoId && /^\d+$/.test(vimeoId)) {
    return {
      provider: 'vimeo',
      id: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
      watchUrl: `https://vimeo.com/${vimeoId}`,
      providerLabel: 'Vimeo',
      isPlayable: true,
      status: 'published',
    };
  }

  // 3. Generic external MP4 or hosted link (including Cloudflare R2 / S3 / CDNs)
  if (url && /^https?:\/\//i.test(url)) {
    const isR2 = /r2\.dev|r2\.cloudflarestorage\.com|cloudflare/i.test(url);
    const isDirectVideo = /\.(mp4|mov|m4v|webm|mkv|ogg)($|\?)/i.test(url);
    return {
      provider: isR2 ? 'r2' : (isDirectVideo ? 'external' : 'custom'),
      embedUrl: url,
      watchUrl: url,
      providerLabel: isR2 ? 'Cloudflare R2' : 'Direct Video',
      isPlayable: true,
      status: 'published',
    };
  }

  // 4. Local dev preview (only if local source exists in development)
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
  if (isDev && video.localSrc) {
    return {
      provider: 'local',
      embedUrl: video.localSrc,
      watchUrl: video.localSrc,
      providerLabel: 'Local Preview',
      isPlayable: true,
      status: 'dev-local',
    };
  }

  return {
    provider: 'none',
    embedUrl: '',
    watchUrl: '',
    providerLabel: '',
    isPlayable: false,
    status: 'pending',
  };
}

export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
