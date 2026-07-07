/**
 * Video embedding and parsing utilities for MCQKash
 * Zero-storage policy: only URLs are persisted, never raw files.
 */

export function parseVideoUrl(url) {
  if (!url) return null;
  const trimmed = url.trim();

  // ── YouTube Shorts ──────────────────────────────────────────────────────────
  const ytShortsMatch = trimmed.match(/youtube\.com\/shorts\/([^"&?/ ]{11})/i);
  if (ytShortsMatch) {
    const id = ytShortsMatch[1];
    return {
      platform: 'youtube',
      id,
      isShort: true,
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`,
      // Shorts never have maxresdefault.jpg — YouTube only generates it for landscape videos.
      // hqdefault.jpg (480×360) is always available for all YouTube content.
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      aspect: '9/16',
      maxWidth: '340px',
    };
  }

  // ── YouTube Standard (watch / share / embed) ────────────────────────────────
  const ytRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
  const ytMatch = trimmed.match(ytRegex);
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      platform: 'youtube',
      id,
      isShort: false,
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`,
      thumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      aspect: '16/9',
      maxWidth: '700px',
    };
  }

  // ── Instagram Reel / Post / TV ──────────────────────────────────────────────
  const igRegex = /instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i;
  const igMatch = trimmed.match(igRegex);
  if (igMatch) {
    const id = igMatch[1];
    const isReel = /\/reel\//i.test(trimmed);
    return {
      platform: 'instagram',
      id,
      isShort: isReel,
      embedUrl: `https://www.instagram.com/p/${id}/embed/captioned/`,
      thumbnail: null,
      aspect: isReel ? '9/16' : '1/1',
      maxWidth: isReel ? '340px' : '480px',
    };
  }

  // ── X / Twitter — Twitter's own official embed (no 3rd-party relay) ─────────
  const xRegex = /(?:x\.com|twitter\.com)\/([^/]+)\/status\/([0-9]+)/i;
  const xMatch = trimmed.match(xRegex);
  if (xMatch) {
    const tweetId = xMatch[2];
    return {
      platform: 'x',
      id: tweetId,
      isShort: false,
      // Twitter's own iframe embed endpoint — policy-safe, no 3rd party
      embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=dark&dnt=true`,
      thumbnail: null,
      aspect: '9/7',
      maxWidth: '100%',
    };
  }

  // ── Direct video files (mp4, webm, ogg, mov) ───────────────────────────────
  if (/\.(mp4|webm|ogg|mov)(?:$|\?)/i.test(trimmed)) {
    return {
      platform: 'native',
      id: trimmed,
      isShort: false,
      embedUrl: trimmed,
      thumbnail: null,
      aspect: '16/9',
      maxWidth: '700px',
    };
  }

  return null;
}

// ── SVG noise pattern (inline, no external asset) ──────────────────────────────
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

export function videoHtmlTemplate(url, align = 'center') {
  const parsed = parseVideoUrl(url);
  if (!parsed) return '';

  const { platform, thumbnail, aspect, embedUrl, maxWidth } = parsed;

  // Width based on alignment
  const width = (align === 'left' || align === 'right') ? '45%' : '100%';

  // ── Background poster layer ────────────────────────────────────────────────
  // YouTube: real thumbnail; others: rich brand-appropriate gradient
  let bgLayer = '';
  if (thumbnail) {
    bgLayer = `background-image: url(${thumbnail}); background-size: cover; background-position: center;`;
  } else if (platform === 'instagram') {
    bgLayer = 'background: linear-gradient(160deg, #2d1b3d 0%, #6b1a35 40%, #c62a47 75%, #f47c3c 100%);';
  } else if (platform === 'x') {
    bgLayer = 'background: radial-gradient(ellipse at 30% 40%, #0d2137 0%, #091522 45%, #050e18 100%);';
  } else {
    bgLayer = 'background: linear-gradient(160deg, #0d1117 0%, #161b22 50%, #0d1117 100%);';
  }

  // ── Cinematic overlay gradient ─────────────────────────────────────────────
  // Vignette: dark corners, slight lightening at center for depth
  const cinemaOverlay = thumbnail
    ? 'background: linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.45) 100%);'
    : 'background: radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.0) 60%), linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.0) 70%);';

  // ── Play button design ─────────────────────────────────────────────────────
  // Outer glow ring + frosted glass circle + triangle icon
  const playBtn = `
    <div style="position:relative; z-index:10; display:flex; flex-direction:column; align-items:center;">
      <!-- glow ring -->
      <div style="position:absolute; width:88px; height:88px; border-radius:50%;
                  background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%);
                  filter: blur(8px); transform: scale(1.1);">
      </div>
      <!-- outer ring border -->
      <div style="position:absolute; width:72px; height:72px; border-radius:50%;
                  border: 1.5px solid rgba(255,255,255,0.22); pointer-events:none;">
      </div>
      <!-- glass button -->
      <button class="nk-video-play-btn"
              style="position:relative; z-index:10; width:64px; height:64px; border-radius:50%;
                     background: rgba(255,255,255,0.11);
                     backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
                     border: 1.5px solid rgba(255,255,255,0.28);
                     box-shadow: 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.2);
                     display:flex; align-items:center; justify-content:center;
                     cursor:pointer; outline:none; transition: all 0.3s ease;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style="margin-left:3px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
    </div>`;

  return `<div class="nk-video-wrapper"
     data-video-url="${url.trim()}"
     data-video-platform="${platform}"
     data-video-aspect="${aspect}"
     data-align="${align}"
     style="width:${width}; max-width:${maxWidth}; aspect-ratio:${aspect};
            position:relative; display:block; overflow:hidden; border-radius:14px;
            background:#050a10;
            border: 1px solid rgba(255,255,255,0.09);
            box-shadow: 0 12px 40px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.06);
            cursor:pointer;"
     contenteditable="false">

  <!-- Poster / background layer -->
  <div class="nk-video-poster"
       style="position:absolute; inset:0; width:100%; height:100%;
              display:flex; align-items:center; justify-content:center;
              ${bgLayer}">

    <!-- Film-grain noise overlay (subtle texture) -->
    <div style="position:absolute; inset:0; ${NOISE_SVG}; background-repeat:repeat; pointer-events:none; mix-blend-mode:overlay; opacity:0.4;"></div>

    <!-- Cinematic vignette -->
    <div style="position:absolute; inset:0; ${cinemaOverlay}"></div>

    <!-- Play button -->
    ${playBtn}
  </div>
</div>`;
}

export function convertVideoCodesToTags(htmlString) {
  if (!htmlString) return '';
  return htmlString.replace(
    /(?:^|\s|\b)(vid[lrc]?)\s+(https?:\/\/[^\s<"'\u00a0]+)/gi,
    (match, cmd, url) => {
      let align = 'center';
      const lc = cmd.toLowerCase();
      if (lc === 'vidl') align = 'left';
      else if (lc === 'vidr') align = 'right';
      return ' ' + videoHtmlTemplate(url.trim(), align);
    }
  );
}
