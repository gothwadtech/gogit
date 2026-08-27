import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FolderUp,
  FileCode,
  Archive,
  Layers,
  Zap,
  CheckCircle2,
  AlertCircle,
  Trash2,
  GitBranch,
  RefreshCw,
  FileText,
  FilePlus,
  ExternalLink,
  Info,
  Check,
} from 'lucide-react';
import JSZip from 'jszip';
import { GitHubRepo, GitHubBranch, BatchCommitProgress, BatchCommitResult } from '../../types/github';
import { githubService } from '../../services/github';
import { contentToBase64, formatBytes } from '../../utils/encoding';

export type UploadMode = 'bulk_files' | 'folder' | 'zip' | 'scratchpad';

interface UniversalUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: GitHubRepo;
  currentBranch: string;
  branches: GitHubBranch[];
  onUploadSuccess: (branch: string) => void;
}

interface StagedFile {
  path: string;
  size: number;
  content: string | Uint8Array;
  isBinary: boolean;
  type: string;
}

export const UniversalUploadModal: React.FC<UniversalUploadModalProps> = ({
  isOpen,
  onClose,
  repo,
  currentBranch,
  branches,
  onUploadSuccess,
}) => {
  const [activeMode, setActiveMode] = useState<UploadMode>('bulk_files');
  const [selectedBranch, setSelectedBranch] = useState(currentBranch || repo.default_branch || 'main');
  const [commitMessage, setCommitMessage] = useState('');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [ignoreNodeModules, setIgnoreNodeModules] = useState(true);

  // Scratchpad mode state
  const [scratchPath, setScratchPath] = useState('');
  const [scratchContent, setScratchContent] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchCommitProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<BatchCommitResult | null>(null);

  // Refs for file inputs
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Check if file is text based on extension
  const isTextFile = (filename: string) => {
    const textExts = [
      'txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'yaml', 'yml',
      'xml', 'svg', 'sh', 'py', 'rb', 'java', 'c', 'cpp', 'h', 'hpp', 'go', 'rs', 'php',
      'sql', 'graphql', 'toml', 'ini', 'env', 'gitignore', 'editorconfig', 'dockerfile',
    ];
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return textExts.includes(ext) || filename.startsWith('.');
  };

  // Helper to read standard File object
  const readFileData = async (file: File, customPath?: string): Promise<StagedFile> => {
    const relativePath = customPath || (file as { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const cleanPath = relativePath.replace(/^\/+/, '');
    const isText = isTextFile(file.name);

    if (isText) {
      const text = await file.text();
      return {
        path: cleanPath,
        size: file.size,
        content: text,
        isBinary: false,
        type: file.type || 'text/plain',
      };
    } else {
      const arrayBuffer = await file.arrayBuffer();
      return {
        path: cleanPath,
        size: file.size,
        content: new Uint8Array(arrayBuffer),
        isBinary: true,
        type: file.type || 'application/octet-stream',
      };
    }
  };

  // Handle Multi-file selection
  const handleMultiFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setError(null);
    try {
      const newFiles: StagedFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const staged = await readFileData(file);
        newFiles.push(staged);
      }
      setStagedFiles((prev) => {
        const existingPaths = new Set(prev.map((f) => f.path));
        const filtered = newFiles.filter((f) => !existingPaths.has(f.path));
        return [...prev, ...filtered];
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading files');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Handle Folder selection
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setError(null);
    try {
      const newFiles: StagedFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const path = (file as { webkitRelativePath?: string }).webkitRelativePath || file.name;
        
        // Filter out ignored directories
        if (ignoreNodeModules) {
          if (
            path.includes('node_modules/') ||
            path.includes('.git/') ||
            path.includes('.DS_Store') ||
            path.includes('.next/') ||
            path.includes('dist/')
          ) {
            continue;
          }
        }

        const staged = await readFileData(file, path);
        newFiles.push(staged);
      }
      setStagedFiles(newFiles);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error reading folder');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Handle ZIP selection
  const handleZipSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsProcessing(true);
    setProgress({
      step: 'preparing',
      completedFiles: 0,
      totalFiles: 1,
      percent: 10,
      message: 'Unpacking ZIP archive in browser memory...',
    });

    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      const extracted: StagedFile[] = [];

      const entries = Object.keys(zipContent.files);
      for (let i = 0; i < entries.length; i++) {
        const entryName = entries[i];
        const zipEntry = zipContent.files[entryName];

        if (zipEntry.dir) continue;
        if (ignoreNodeModules) {
          if (
            entryName.includes('node_modules/') ||
            entryName.includes('.git/') ||
            entryName.includes('.DS_Store') ||
            entryName.includes('__MACOSX/')
          ) {
            continue;
          }
        }

        const isText = isTextFile(entryName);
        let content: string | Uint8Array;
        let isBinary = !isText;

        if (isText) {
          try {
            content = await zipEntry.async('text');
            isBinary = false;
          } catch {
            content = await zipEntry.async('uint8array');
            isBinary = true;
          }
        } else {
          content = await zipEntry.async('uint8array');
          isBinary = true;
        }

        const { byteSize } = contentToBase64(content);

        extracted.push({
          path: entryName.replace(/^\/+/, ''),
          size: byteSize,
          content,
          isBinary,
          type: isBinary ? 'application/octet-stream' : 'text/plain',
        });
      }

      setStagedFiles(extracted);
      if (!commitMessage) {
        setCommitMessage(`feat: import ${extracted.length} files from ${file.name}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to unpack ZIP archive');
    } finally {
      setIsProcessing(false);
      setProgress(null);
      if (e.target) e.target.value = '';
    }
  };

  // Remove individual staged file
  const removeStagedFile = (pathToRemove: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.path !== pathToRemove));
  };

  // Perform the Atomic Git Tree commit
  const handleExecuteUpload = async () => {
    setError(null);

    let filesToCommit = stagedFiles;

    // Handle scratchpad single file
    if (activeMode === 'scratchpad') {
      const cleanPath = scratchPath.trim().replace(/^\/+/, '');
      if (!cleanPath) {
        setError('Please enter a valid file path (e.g. src/index.ts)');
        return;
      }
      const { byteSize } = contentToBase64(scratchContent);
      filesToCommit = [
        {
          path: cleanPath,
          size: byteSize,
          content: scratchContent,
          isBinary: false,
          type: 'text/plain',
        },
      ];
    }

    if (filesToCommit.length === 0) {
      setError('Please select or create at least 1 file to upload.');
      return;
    }

    const defaultMsg =
      filesToCommit.length === 1
        ? `feat: add ${filesToCommit[0].path}`
        : `feat: sync ${filesToCommit.length} files via Smart Upload Studio`;
    const finalMsg = commitMessage.trim() || defaultMsg;

    try {
      setIsProcessing(true);
      const result = await githubService.batchCommitFiles(
        repo.owner.login,
        repo.name,
        selectedBranch,
        filesToCommit,
        finalMsg,
        [],
        (prog) => setProgress(prog)
      );

      setSuccessInfo(result);
      onUploadSuccess(selectedBranch);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Total size calculation
  const totalStagedSize = stagedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div
      id="universal-upload-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] transition-colors duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#292a2d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0494f4] text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
                Smart Upload & Commit Studio
              </h2>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] flex items-center gap-1 font-mono">
                <span>{repo.owner.login}/{repo.name}</span>
                <span>·</span>
                <span className="text-[#0494f4]">{selectedBranch}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] rounded-xl hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {successInfo ? (
          <div className="p-6 sm:p-8 text-center space-y-4 flex-1 overflow-y-auto">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${
                successInfo.success ? 'bg-[#0494f4] text-white' : 'bg-[#fbbc04] text-white'
              }`}
            >
              {successInfo.success ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <AlertCircle className="w-8 h-8" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#202124] dark:text-[#e8eaed]">
                {successInfo.success
                  ? 'Commit Successfully Pushed!'
                  : 'Commit Pushed with Warnings'}
              </h3>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                <strong className="text-[#0494f4]">{successInfo.successfulCount} files</strong> committed to branch{' '}
                <strong className="text-[#0494f4] font-mono">{selectedBranch}</strong>.
                {successInfo.failedCount > 0 && (
                  <span className="text-[#ea4335] block mt-0.5 font-semibold">
                    {successInfo.failedCount} file(s) failed and were skipped.
                  </span>
                )}
              </p>
            </div>

            <div className="p-3 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl max-w-md mx-auto text-left font-mono text-xs space-y-1">
              <div className="text-[#5f6368] dark:text-[#9aa0a6] text-[11px]">Commit SHA:</div>
              <div className="text-[#0494f4] font-bold break-all">{successInfo.commitSha}</div>
            </div>

            {successInfo.failedFiles.length > 0 && (
              <div className="p-3 bg-[#ea4335]/10 border border-[#ea4335]/30 rounded-2xl max-w-md mx-auto text-left text-xs space-y-1 text-[#ea4335]">
                <div className="font-bold">Failed Files:</div>
                <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[11px]">
                  {successInfo.failedFiles.map((f) => (
                    <div key={f.path} className="truncate">
                      • {f.path}: <span className="text-[#80868b]">{f.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={successInfo.commitUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#f1f3f4] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-xl border border-[#dadce0] dark:border-[#3c4043] transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View on GitHub</span>
              </a>

              <button
                onClick={() => {
                  setSuccessInfo(null);
                  setStagedFiles([]);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#0494f4] hover:bg-[#0382d6] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Interactive Studio Body */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#f1f3f4] dark:bg-[#292a2d] rounded-2xl border border-[#dadce0] dark:border-[#3c4043]">
              <button
                type="button"
                onClick={() => setActiveMode('bulk_files')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'bulk_files'
                    ? 'bg-[#0494f4] text-white shadow-sm'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
                }`}
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span>Bulk Files</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('folder')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'folder'
                    ? 'bg-[#0494f4] text-white shadow-sm'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
                }`}
              >
                <FolderUp className="w-3.5 h-3.5 shrink-0" />
                <span>Folder</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('zip')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'zip'
                    ? 'bg-[#0494f4] text-white shadow-sm'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
                }`}
              >
                <Archive className="w-3.5 h-3.5 shrink-0" />
                <span>ZIP Unpack</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('scratchpad')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'scratchpad'
                    ? 'bg-[#0494f4] text-white shadow-sm'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span>Quick Code</span>
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3 bg-[#ea4335]/10 border border-[#ea4335]/30 rounded-2xl flex items-start gap-2 text-xs text-[#ea4335]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Mode 1: Bulk Multi-Files */}
            {activeMode === 'bulk_files' && (
              <div className="space-y-3">
                <input
                  type="file"
                  multiple
                  ref={multiFileInputRef}
                  onChange={handleMultiFileSelect}
                  className="hidden"
                />

                <div
                  onClick={() => multiFileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] dark:hover:border-[#0494f4] rounded-2xl p-6 text-center cursor-pointer transition bg-[#f8f9fa] dark:bg-[#292a2d]/50 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#0494f4]/15 text-[#0494f4] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#202124] dark:text-[#e8eaed]">
                    Click or Drag & Drop Multiple Files
                  </h4>
                  <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
                    Select 10, 50, or 100+ files to upload in a single high-speed Git commit
                  </p>
                </div>
              </div>
            )}

            {/* Mode 2: Folder Upload */}
            {activeMode === 'folder' && (
              <div className="space-y-3">
                <input
                  type="file"
                  // @ts-expect-error webkitdirectory attribute is standard in browsers
                  webkitdirectory=""
                  directory=""
                  ref={folderInputRef}
                  onChange={handleFolderSelect}
                  className="hidden"
                />

                <div
                  onClick={() => folderInputRef.current?.click()}
                  className="border-2 border-dashed border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] dark:hover:border-[#0494f4] rounded-2xl p-6 text-center cursor-pointer transition bg-[#f8f9fa] dark:bg-[#292a2d]/50 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#0494f4]/15 text-[#0494f4] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <FolderUp className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#202124] dark:text-[#e8eaed]">
                    Select Entire Directory / Project Folder
                  </h4>
                  <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
                    Automatically preserves internal folder trees (`src/components/`, `public/`, etc.)
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs bg-[#f8f9fa] dark:bg-[#292a2d] p-3 rounded-2xl border border-[#dadce0] dark:border-[#3c4043]">
                  <span className="text-[#5f6368] dark:text-[#9aa0a6]">Auto-ignore node_modules & .git</span>
                  <input
                    type="checkbox"
                    checked={ignoreNodeModules}
                    onChange={(e) => setIgnoreNodeModules(e.target.checked)}
                    className="w-4 h-4 accent-[#0494f4] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Mode 3: ZIP Unpack */}
            {activeMode === 'zip' && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".zip"
                  ref={zipInputRef}
                  onChange={handleZipSelect}
                  className="hidden"
                />

                <div
                  onClick={() => zipInputRef.current?.click()}
                  className="border-2 border-dashed border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] dark:hover:border-[#0494f4] rounded-2xl p-6 text-center cursor-pointer transition bg-[#f8f9fa] dark:bg-[#292a2d]/50 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#fbbc04]/15 text-[#fbbc04] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <Archive className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#202124] dark:text-[#e8eaed]">
                    Upload & Unpack .ZIP Archive
                  </h4>
                  <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
                    Instant in-browser decompression & 1-click project sync to GitHub
                  </p>
                </div>
              </div>
            )}

            {/* Mode 4: Scratchpad Code Editor */}
            {activeMode === 'scratchpad' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#202124] dark:text-[#e8eaed]">
                    File Path (e.g. `src/utils/helpers.ts`)
                  </label>
                  <input
                    type="text"
                    placeholder="src/components/MyComponent.tsx"
                    value={scratchPath}
                    onChange={(e) => setScratchPath(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-mono text-[#202124] dark:text-[#e8eaed] focus:border-[#0494f4] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#202124] dark:text-[#e8eaed]">
                    File Content (Code / Text)
                  </label>
                  <textarea
                    rows={7}
                    placeholder="// Paste code here..."
                    value={scratchContent}
                    onChange={(e) => setScratchContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-mono text-[#202124] dark:text-[#e8eaed] focus:border-[#0494f4] focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* Staged Files Preview List (for modes 1, 2, 3) */}
            {activeMode !== 'scratchpad' && stagedFiles.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#dadce0] dark:border-[#3c4043]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#0494f4]" />
                    <span>Staged Files ({stagedFiles.length})</span>
                    <span className="text-[#5f6368] dark:text-[#9aa0a6] font-mono">({formatBytes(totalStagedSize)})</span>
                  </span>

                  <button
                    onClick={() => setStagedFiles([])}
                    className="text-[11px] text-[#ea4335] hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto border border-[#dadce0] dark:border-[#3c4043] rounded-2xl divide-y divide-[#dadce0] dark:divide-[#3c4043] bg-[#f8f9fa] dark:bg-[#292a2d]">
                  {stagedFiles.map((file) => (
                    <div
                      key={file.path}
                      className="px-3 py-1.5 flex items-center justify-between text-xs font-mono group hover:bg-[#f1f3f4] dark:hover:bg-[#303134]"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {file.isBinary ? (
                          <FilePlus className="w-3.5 h-3.5 text-[#fbbc04] shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-[#0494f4] shrink-0" />
                        )}
                        <span className="truncate text-[#202124] dark:text-[#e8eaed]">{file.path}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">
                          {formatBytes(file.size)}
                        </span>
                        <button
                          onClick={() => removeStagedFile(file.path)}
                          className="text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#ea4335] p-1 transition cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Target Branch & Commit Message Config */}
            <div className="space-y-3 pt-3 border-t border-[#dadce0] dark:border-[#3c4043]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-[#34a853]" />
                    <span>Target Branch</span>
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-mono font-semibold text-[#202124] dark:text-[#e8eaed] focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#202124] dark:text-[#e8eaed]">
                    Commit Message
                  </label>
                  <input
                    type="text"
                    placeholder="feat: upload project files"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs text-[#202124] dark:text-[#e8eaed] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Live Progress Bar during push */}
            {isProcessing && progress && (
              <div className="p-4 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#0494f4]/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#0494f4] flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{progress.message}</span>
                  </span>
                  <span className="font-mono text-[#202124] dark:text-[#e8eaed]">{progress.percent}%</span>
                </div>

                <div className="w-full h-2 bg-[#e8eaed] dark:bg-[#3c4043] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0494f4] transition-all duration-300 rounded-full"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Controls */}
        {!successInfo && (
          <div className="px-5 py-3.5 border-t border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#292a2d] flex items-center justify-between gap-3">
            <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] hidden sm:flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#0494f4]" />
              <span>Uses Atomic Git Tree API with parallel blob concurrency.</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 bg-[#e8eaed] dark:bg-[#303134] hover:bg-[#dadce0] dark:hover:bg-[#3c4043] text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteUpload}
                disabled={isProcessing || (activeMode !== 'scratchpad' && stagedFiles.length === 0)}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#0494f4] hover:bg-[#0382d6] active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Committing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>
                      {activeMode === 'scratchpad'
                        ? 'Commit File'
                        : `Commit & Push (${stagedFiles.length} files)`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
