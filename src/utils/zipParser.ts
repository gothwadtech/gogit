import JSZip from 'jszip';
import { ZipExtractedFile } from '../types/github';
import { computeGitBlobSha, contentToBase64 } from './encoding';

// Known binary extensions
const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svgz', 'bmp', 'tiff',
  'pdf', 'zip', 'tar', 'gz', '7z', 'rar',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  'mp3', 'wav', 'ogg', 'mp4', 'webm', 'mov',
  'exe', 'dll', 'so', 'dylib', 'bin', 'wasm',
]);

function isBinaryExtension(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? BINARY_EXTENSIONS.has(ext) : false;
}

export async function parseZipArchive(file: File): Promise<ZipExtractedFile[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const extractedFiles: ZipExtractedFile[] = [];

  // Check if all files are inside a common root folder (e.g. repo-main/)
  const allPaths = Object.keys(loadedZip.files).filter((p) => !loadedZip.files[p].dir);
  let commonPrefix = '';
  if (allPaths.length > 1) {
    const firstSlash = allPaths[0].indexOf('/');
    if (firstSlash > 0) {
      const candidate = allPaths[0].substring(0, firstSlash + 1);
      const allShare = allPaths.every((p) => p.startsWith(candidate));
      if (allShare) {
        commonPrefix = candidate;
      }
    }
  }

  for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
    if (zipEntry.dir) continue; // Skip directory entries

    // Ignore system / metadata files
    if (
      relativePath.includes('__MACOSX/') ||
      relativePath.endsWith('.DS_Store') ||
      relativePath.endsWith('Thumbs.db')
    ) {
      continue;
    }

    // Strip common prefix if detected
    const cleanPath = commonPrefix && relativePath.startsWith(commonPrefix)
      ? relativePath.substring(commonPrefix.length)
      : relativePath;

    if (!cleanPath) continue;

    const fileName = cleanPath.split('/').pop() || cleanPath;
    const isBin = isBinaryExtension(fileName);

    let content: string | Uint8Array;
    let isBinaryFile = isBin;

    if (isBin) {
      content = await zipEntry.async('uint8array');
    } else {
      try {
        content = await zipEntry.async('text');
        isBinaryFile = false;
      } catch {
        // Fallback to binary if text decoding fails
        content = await zipEntry.async('uint8array');
        isBinaryFile = true;
      }
    }

    const { byteSize } = contentToBase64(content);
    const calculatedSha = await computeGitBlobSha(content);

    extractedFiles.push({
      path: cleanPath,
      name: fileName,
      size: byteSize,
      isDirectory: false,
      isBinary: isBinaryFile,
      content,
      calculatedSha,
      selected: true,
    });
  }

  return extractedFiles;
}
