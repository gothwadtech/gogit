import JSZip from 'jszip';
import { ZipExtractedFile, ZipDiffResult, GitHubTreeItem, DiffStatus } from '../types/github';

// Known binary extensions
const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg', 'bmp', 'tiff',
  'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg',
  'zip', 'tar', 'gz', '7z', 'rar', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  'exe', 'dll', 'so', 'dylib', 'bin', 'class', 'jar', 'apk', 'wasm'
]);

function isBinaryExtension(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? BINARY_EXTENSIONS.has(ext) : false;
}

// Compute Git blob SHA-1: SHA-1 of "blob <size>\0<content>"
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

export class ZipEngineService {
  /**
   * Extract all files from a user uploaded ZIP file in browser memory
   */
  public async extractZip(
    zipBlob: Blob | File,
    onProgress?: (percent: number, currentFile: string) => void
  ): Promise<ZipExtractedFile[]> {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(zipBlob);

    const extractedFiles: ZipExtractedFile[] = [];
    const entries = Object.keys(loadedZip.files);
    const total = entries.length;

    // Detect if zip has a single root wrapper directory (e.g., "my-project-main/")
    let rootPrefix = '';
    const rootDirs = new Set<string>();
    for (const path of entries) {
      const parts = path.split('/');
      if (parts.length > 1 && parts[0]) {
        rootDirs.add(parts[0]);
      }
    }
    if (rootDirs.size === 1) {
      const singleRoot = Array.from(rootDirs)[0];
      const allInsideRoot = entries.every((p) => p === singleRoot || p.startsWith(`${singleRoot}/`));
      if (allInsideRoot) {
        rootPrefix = `${singleRoot}/`;
      }
    }

    let index = 0;
    for (const rawPath of entries) {
      index++;
      const zipEntry = loadedZip.files[rawPath];
      
      // Skip Mac metadata and junk files
      if (
        rawPath.startsWith('__MACOSX/') ||
        rawPath.includes('/.DS_Store') ||
        rawPath === '.DS_Store' ||
        rawPath.includes('/Thumbs.db') ||
        rawPath === 'Thumbs.db'
      ) {
        continue;
      }

      if (zipEntry.dir) {
        continue; // We only track files; directories will be created automatically in Git trees
      }

      // Normalize path (strip single root wrapper if present)
      let cleanPath = rawPath;
      if (rootPrefix && cleanPath.startsWith(rootPrefix)) {
        cleanPath = cleanPath.slice(rootPrefix.length);
      }
      cleanPath = cleanPath.replace(/^\/+/, ''); // Remove leading slash

      if (!cleanPath) continue;

      const isBinary = isBinaryExtension(cleanPath);
      let content: string | Uint8Array;

      onProgress?.(Math.round((index / total) * 100), cleanPath);

      if (isBinary) {
        content = await zipEntry.async('uint8array');
      } else {
        try {
          content = await zipEntry.async('string');
        } catch {
          content = await zipEntry.async('uint8array');
        }
      }

      const filename = cleanPath.split('/').pop() || cleanPath;

      extractedFiles.push({
        path: cleanPath,
        name: filename,
        size: typeof content === 'string' ? new TextEncoder().encode(content).length : content.length,
        isDirectory: false,
        isBinary: typeof content !== 'string',
        content,
        selected: true,
      });
    }

    return extractedFiles;
  }

  /**
   * Compare extracted zip files against the repository's existing Git tree
   */
  public async compareWithRepo(
    zipFiles: ZipExtractedFile[],
    repoTree: GitHubTreeItem[],
    targetPrefix: string = ''
  ): Promise<{
    diffs: ZipDiffResult[];
    stats: {
      total: number;
      newCount: number;
      modifiedCount: number;
      unchangedCount: number;
      repoOnlyCount: number;
    };
  }> {
    const repoMap = new Map<string, GitHubTreeItem>();
    for (const item of repoTree) {
      if (item.type === 'blob') {
        repoMap.set(item.path, item);
      }
    }

    const diffs: ZipDiffResult[] = [];
    const matchedRepoPaths = new Set<string>();

    let newCount = 0;
    let modifiedCount = 0;
    let unchangedCount = 0;

    const normalizedPrefix = targetPrefix.trim().replace(/^\/+|\/+$/g, '');

    for (const zipFile of zipFiles) {
      const finalPath = normalizedPrefix ? `${normalizedPrefix}/${zipFile.path}` : zipFile.path;
      const repoItem = repoMap.get(finalPath);

      let status: DiffStatus = 'new';

      if (!repoItem) {
        status = 'new';
        newCount++;
      } else {
        matchedRepoPaths.add(finalPath);
        // Calculate SHA-1 and compare with Git blob sha
        const computedSha = await computeGitBlobSha(zipFile.content);

        if (computedSha.toLowerCase() === repoItem.sha.toLowerCase()) {
          status = 'unchanged';
          unchangedCount++;
        } else {
          status = 'modified';
          modifiedCount++;
        }
      }

      diffs.push({
        path: finalPath,
        zipFile: {
          ...zipFile,
          path: finalPath,
        },
        repoSha: repoItem?.sha,
        repoSize: repoItem?.size,
        status,
        selected: status !== 'unchanged', // Auto-select new and modified files by default
      });
    }

    // Repo-only items that were not in ZIP
    let repoOnlyCount = 0;
    for (const [repoPath, repoItem] of repoMap.entries()) {
      if (!matchedRepoPaths.has(repoPath)) {
        if (!normalizedPrefix || repoPath.startsWith(`${normalizedPrefix}/`)) {
          repoOnlyCount++;
          diffs.push({
            path: repoPath,
            repoSha: repoItem.sha,
            repoSize: repoItem.size,
            status: 'repo_only',
            selected: false,
          });
        }
      }
    }

    return {
      diffs,
      stats: {
        total: zipFiles.length,
        newCount,
        modifiedCount,
        unchangedCount,
        repoOnlyCount,
      },
    };
  }
}

export const zipEngine = new ZipEngineService();
