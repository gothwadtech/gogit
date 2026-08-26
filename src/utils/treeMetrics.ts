import { GitHubTreeItem } from '../types/github';

export interface FileExtensionInfo {
  extension: string;
  label: string;
  category: 'code' | 'config' | 'doc' | 'style' | 'media' | 'archive' | 'other';
  color: string;
  bgColor: string;
  darkBgColor: string;
}

export interface ExtensionStat {
  extension: string;
  count: number;
  totalSize: number;
  percentage: number;
  info: FileExtensionInfo;
}

export interface FolderMetrics {
  path: string;
  name: string;
  directFilesCount: number;
  directFoldersCount: number;
  directTotalItems: number;
  directSize: number;
  totalRecursiveFilesCount: number;
  totalRecursiveFoldersCount: number;
  totalRecursiveItemsCount: number;
  totalRecursiveSize: number;
}

export interface PathAnalysis {
  path: string;
  isRoot: boolean;
  directFilesCount: number;
  directFoldersCount: number;
  directTotalItems: number;
  directSize: number;
  totalRecursiveFilesCount: number;
  totalRecursiveFoldersCount: number;
  totalRecursiveItemsCount: number;
  totalRecursiveSize: number;
  extensionStats: ExtensionStat[];
  largestFiles: GitHubTreeItem[];
}

export function formatBytes(bytes?: number, decimals = 1): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i >= sizes.length) return (bytes / Math.pow(k, sizes.length - 1)).toFixed(dm) + ' ' + sizes[sizes.length - 1];

  const value = bytes / Math.pow(k, i);
  // For small bytes, show integer
  if (i === 0) return `${Math.round(bytes)} B`;
  return `${value.toFixed(dm)} ${sizes[i]}`;
}

export function getFileExtensionInfo(fileName: string): FileExtensionInfo {
  const parts = fileName.split('.');
  const rawExt = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  const ext = rawExt;

  switch (ext) {
    case 'tsx':
    case 'jsx':
      return {
        extension: ext,
        label: ext.toUpperCase(),
        category: 'code',
        color: 'text-[#0494f4]',
        bgColor: 'bg-[#0494f4]/10',
        darkBgColor: 'dark:bg-[#0494f4]/20',
      };
    case 'ts':
      return {
        extension: ext,
        label: 'TS',
        category: 'code',
        color: 'text-[#1a73e8]',
        bgColor: 'bg-[#1a73e8]/10',
        darkBgColor: 'dark:bg-[#1a73e8]/20',
      };
    case 'js':
    case 'mjs':
    case 'cjs':
      return {
        extension: ext,
        label: 'JS',
        category: 'code',
        color: 'text-[#f29900]',
        bgColor: 'bg-[#f29900]/10',
        darkBgColor: 'dark:bg-[#f29900]/20',
      };
    case 'json':
      return {
        extension: ext,
        label: 'JSON',
        category: 'config',
        color: 'text-[#e37400]',
        bgColor: 'bg-[#e37400]/10',
        darkBgColor: 'dark:bg-[#e37400]/20',
      };
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return {
        extension: ext,
        label: ext.toUpperCase(),
        category: 'style',
        color: 'text-[#d93025]',
        bgColor: 'bg-[#d93025]/10',
        darkBgColor: 'dark:bg-[#d93025]/20',
      };
    case 'html':
    case 'htm':
      return {
        extension: ext,
        label: 'HTML',
        category: 'code',
        color: 'text-[#e8710a]',
        bgColor: 'bg-[#e8710a]/10',
        darkBgColor: 'dark:bg-[#e8710a]/20',
      };
    case 'md':
    case 'markdown':
    case 'txt':
    case 'rst':
      return {
        extension: ext || 'txt',
        label: 'DOC',
        category: 'doc',
        color: 'text-[#188038]',
        bgColor: 'bg-[#188038]/10',
        darkBgColor: 'dark:bg-[#188038]/20',
      };
    case 'svg':
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'ico':
      return {
        extension: ext,
        label: 'IMG',
        category: 'media',
        color: 'text-[#a142f4]',
        bgColor: 'bg-[#a142f4]/10',
        darkBgColor: 'dark:bg-[#a142f4]/20',
      };
    case 'zip':
    case 'tar':
    case 'gz':
    case '7z':
      return {
        extension: ext,
        label: 'ZIP',
        category: 'archive',
        color: 'text-[#c5221f]',
        bgColor: 'bg-[#c5221f]/10',
        darkBgColor: 'dark:bg-[#c5221f]/20',
      };
    case 'yaml':
    case 'yml':
    case 'toml':
    case 'env':
    case 'config':
    case 'xml':
      return {
        extension: ext,
        label: 'CONF',
        category: 'config',
        color: 'text-[#5f6368] dark:text-[#9aa0a6]',
        bgColor: 'bg-[#f1f3f4]',
        darkBgColor: 'dark:bg-[#303134]',
      };
    default:
      return {
        extension: ext || 'file',
        label: (ext || 'FILE').toUpperCase().slice(0, 4),
        category: 'other',
        color: 'text-[#5f6368] dark:text-[#9aa0a6]',
        bgColor: 'bg-[#f1f3f4]',
        darkBgColor: 'dark:bg-[#303134]',
      };
  }
}

/**
 * Calculates metrics for a specific folder path (immediate and recursive)
 */
export function calculateFolderMetrics(
  treeItems: GitHubTreeItem[],
  folderPath: string
): FolderMetrics {
  const normalizedFolderPath = folderPath.replace(/\/+$/, '');
  const prefix = normalizedFolderPath ? `${normalizedFolderPath}/` : '';
  const folderName = normalizedFolderPath.split('/').pop() || 'root';

  let directFilesCount = 0;
  let directSize = 0;
  let totalRecursiveFilesCount = 0;
  let totalRecursiveSize = 0;

  const directSubfolderNames = new Set<string>();
  const totalSubfolderPaths = new Set<string>();

  for (const item of treeItems) {
    if (prefix && !item.path.startsWith(prefix)) {
      continue;
    }

    const relPath = prefix ? item.path.slice(prefix.length) : item.path;
    if (!relPath) continue;

    const pathSegments = relPath.split('/');

    if (item.type === 'blob') {
      totalRecursiveFilesCount++;
      totalRecursiveSize += item.size || 0;

      if (pathSegments.length === 1) {
        // Direct file in this folder
        directFilesCount++;
        directSize += item.size || 0;
      } else {
        // Nested inside a subfolder
        directSubfolderNames.add(pathSegments[0]);
        // All subfolder levels
        for (let i = 1; i < pathSegments.length; i++) {
          totalSubfolderPaths.add(
            (prefix ? prefix : '') + pathSegments.slice(0, i).join('/')
          );
        }
      }
    } else if (item.type === 'tree') {
      if (pathSegments.length === 1) {
        directSubfolderNames.add(pathSegments[0]);
      }
      totalSubfolderPaths.add(item.path);
    }
  }

  const directFoldersCount = directSubfolderNames.size;
  const directTotalItems = directFilesCount + directFoldersCount;
  const totalRecursiveFoldersCount = Math.max(totalSubfolderPaths.size, directFoldersCount);
  const totalRecursiveItemsCount = totalRecursiveFilesCount + totalRecursiveFoldersCount;

  return {
    path: normalizedFolderPath,
    name: folderName,
    directFilesCount,
    directFoldersCount,
    directTotalItems,
    directSize,
    totalRecursiveFilesCount,
    totalRecursiveFoldersCount,
    totalRecursiveItemsCount,
    totalRecursiveSize,
  };
}

/**
 * Calculates complete deep analysis for the active path view
 */
export function calculatePathAnalysis(
  treeItems: GitHubTreeItem[],
  currentPath: string
): PathAnalysis {
  const normalizedPath = currentPath.replace(/\/+$/, '');
  const prefix = normalizedPath ? `${normalizedPath}/` : '';

  let directFilesCount = 0;
  let directSize = 0;
  let totalRecursiveFilesCount = 0;
  let totalRecursiveSize = 0;

  const directSubfolders = new Set<string>();
  const totalSubfolders = new Set<string>();
  const extMap = new Map<string, { count: number; totalSize: number }>();
  const descendantFiles: GitHubTreeItem[] = [];

  for (const item of treeItems) {
    if (prefix && !item.path.startsWith(prefix)) {
      continue;
    }

    const relPath = prefix ? item.path.slice(prefix.length) : item.path;
    if (!relPath) continue;

    const segments = relPath.split('/');

    if (item.type === 'blob') {
      totalRecursiveFilesCount++;
      const fileSize = item.size || 0;
      totalRecursiveSize += fileSize;
      descendantFiles.push(item);

      // Extension grouping
      const fileName = segments[segments.length - 1];
      const extInfo = getFileExtensionInfo(fileName);
      const extKey = extInfo.extension || 'other';
      const curr = extMap.get(extKey) || { count: 0, totalSize: 0 };
      curr.count += 1;
      curr.totalSize += fileSize;
      extMap.set(extKey, curr);

      if (segments.length === 1) {
        directFilesCount++;
        directSize += fileSize;
      } else {
        directSubfolders.add(segments[0]);
        for (let i = 1; i < segments.length; i++) {
          totalSubfolders.add(
            (prefix ? prefix : '') + segments.slice(0, i).join('/')
          );
        }
      }
    } else if (item.type === 'tree') {
      if (segments.length === 1) {
        directSubfolders.add(segments[0]);
      }
      totalSubfolders.add(item.path);
    }
  }

  const directFoldersCount = directSubfolders.size;
  const directTotalItems = directFilesCount + directFoldersCount;
  const totalRecursiveFoldersCount = Math.max(totalSubfolders.size, directFoldersCount);
  const totalRecursiveItemsCount = totalRecursiveFilesCount + totalRecursiveFoldersCount;

  // Compute Extension Stats sorted by size / count
  const extensionStats: ExtensionStat[] = Array.from(extMap.entries())
    .map(([extension, data]) => {
      const info = getFileExtensionInfo(`file.${extension}`);
      const percentage = totalRecursiveSize > 0 ? (data.totalSize / totalRecursiveSize) * 100 : 0;
      return {
        extension,
        count: data.count,
        totalSize: data.totalSize,
        percentage,
        info,
      };
    })
    .sort((a, b) => b.totalSize - a.totalSize);

  // Top 5 largest files
  const largestFiles = [...descendantFiles]
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .slice(0, 5);

  return {
    path: normalizedPath,
    isRoot: !normalizedPath,
    directFilesCount,
    directFoldersCount,
    directTotalItems,
    directSize,
    totalRecursiveFilesCount,
    totalRecursiveFoldersCount,
    totalRecursiveItemsCount,
    totalRecursiveSize,
    extensionStats,
    largestFiles,
  };
}
