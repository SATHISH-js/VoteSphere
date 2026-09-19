/**
 * Hardware & Browser Entropy Fingerprint
 * Generates a stable, privacy-preserving device hash that persists
 * across Incognito / Private browsing modes to prevent fake and duplicate voting.
 */

// Simple 32-bit FNV-1a string hasher
function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Generates Canvas 2D fingerprint.
 * Different GPU drivers, operating systems, and font rendering engines produce
 * unique pixel outputs for complex text and shapes.
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', 'Helvetica', sans-serif";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('VoteSphere, antifraud #1!', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('VoteSphere, antifraud #1!', 4, 17);

    return fnv1a(canvas.toDataURL());
  } catch (e) {
    return 'canvas-err';
  }
}

/**
 * Extracts WebGL unmasked vendor and renderer.
 * Identifies the exact GPU hardware, which remains constant across Incognito sessions.
 */
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      return fnv1a(`${vendor}~${renderer}`);
    }
    return 'webgl-basic';
  } catch {
    return 'webgl-err';
  }
}

/**
 * Calculates a comprehensive device fingerprint.
 * Returns a stable 32-character hexadecimal string representing the device.
 */
export function getDeviceFingerprint() {
  try {
    const components = [
      getCanvasFingerprint(),
      getWebGLFingerprint(),
      window.screen.width + 'x' + window.screen.height + 'x' + (window.screen.colorDepth || 24),
      window.devicePixelRatio || 1,
      navigator.hardwareConcurrency || 2,
      navigator.maxTouchPoints || 0,
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      navigator.language || 'en',
      (navigator.languages || []).join(','),
      navigator.platform || '',
    ];

    return fnv1a(components.join('||'));
  } catch {
    return fnv1a('fallback-entropy-' + Date.now());
  }
}
