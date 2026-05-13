import { randomBytes } from 'node:crypto';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const customSlugPattern = /^[a-zA-Z0-9_-]{3,48}$/;

export function createSlug(length = 7) {
  return Array.from(randomBytes(length), (byte) => alphabet[byte % alphabet.length]).join('');
}

export function normalizeCustomSlug(value) {
  return String(value || '').trim();
}

export function isValidCustomSlug(value) {
  return customSlugPattern.test(value);
}
