/**
 * Rock-solid universal binary & text encoding utilities for GitHub API.
 * Handles files of any size (50KB, 500KB, 10MB+) without call stack overflow,
 * Latin-1 exceptions, or unicode corruption.
 */

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000; // 32KB safe chunk size to prevent call stack overflow
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    // Convert typed array chunk to regular numbers for String.fromCharCode
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export function contentToBase64(content: string | Uint8Array): { base64: string; byteSize: number; uint8: Uint8Array } {
  let uint8: Uint8Array;
  if (typeof content === 'string') {
    uint8 = new TextEncoder().encode(content);
  } else {
    uint8 = content;
  }

  const base64 = uint8ArrayToBase64(uint8);
  return {
    base64,
    byteSize: uint8.length,
    uint8,
  };
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/\s/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function base64ToUtf8(base64: string): string {
  const bytes = base64ToUint8Array(base64);
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return decoder.decode(bytes);
}

/**
 * Computes exact Git Blob SHA-1 hash for any content.
 * Git calculates blob SHA as: SHA-1("blob <size_in_bytes>\0<content_bytes>")
 */
export async function computeGitBlobSha(content: string | Uint8Array): Promise<string> {
  let bytes: Uint8Array;
  if (typeof content === 'string') {
    bytes = new TextEncoder().encode(content);
  } else {
    bytes = content;
  }

  const header = `blob ${bytes.length}\0`;
  const headerBytes = new TextEncoder().encode(header);
  const combined = new Uint8Array(headerBytes.length + bytes.length);
  combined.set(headerBytes, 0);
  combined.set(bytes, headerBytes.length);

  const hashBuffer = await crypto.subtle.digest('SHA-1', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Format bytes to readable string (e.g. 52.4 KB, 1.2 MB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
