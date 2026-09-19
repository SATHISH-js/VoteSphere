import { getDeviceFingerprint } from './fingerprint';

const STORAGE_KEY = 'votesphere_voter_token';
const LEGACY_STORAGE_KEY = 'pulsepoll_voter_token';
const COOKIE_KEY = 'vs_vid';

function getCookie(name) {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}

function setCookie(name, value, days = 365) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {}
}

/**
 * Generates or retrieves a persistent, privacy-preserving client identifier for duplicate vote prevention.
 * Combines deterministic hardware & browser entropy (resists Incognito clearing)
 * with dual persistence (LocalStorage + Cookie).
 */
export function getOrCreateVoterId() {
  const hardwareFp = getDeviceFingerprint();

  // Try retrieving from localStorage or persistent cookie
  let voterId =
    localStorage.getItem(STORAGE_KEY) ||
    getCookie(COOKIE_KEY) ||
    localStorage.getItem(LEGACY_STORAGE_KEY);

  // If no saved token, or token lacks the hardware fingerprint, construct a bound token
  if (!voterId || !voterId.startsWith(`fp_${hardwareFp}_`)) {
    const randomPart =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().substring(0, 8)
        : Math.random().toString(36).substring(2, 10);

    voterId = `fp_${hardwareFp}_${randomPart}`;
    
    // Store in both LocalStorage and Cookie for resilience
    try {
      localStorage.setItem(STORAGE_KEY, voterId);
    } catch {}
    setCookie(COOKIE_KEY, voterId, 365);
  }

  return voterId;
}

/**
 * Returns just the deterministic hardware fingerprint component.
 * Useful for secondary duplicate matching on backend.
 */
export function getRawHardwareFingerprint() {
  return getDeviceFingerprint();
}
