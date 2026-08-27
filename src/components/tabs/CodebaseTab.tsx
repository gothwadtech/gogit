import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FileText,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  ChevronRight,
  GitBranch,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCode,
  CheckSquare,
  Square,
  FileUp,
  Layers,
  Sparkles,
  GitCommit,
  Activity,
  Package,
  Clock,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  GitHubRepo,
  GitHubBranch,
  GitHubTreeItem,
  ZipExtractedFile,
  ZipDiffResult,
  DiffStatus,
  BatchCommitProgress,
} from '../../types/github';
import { githubService } from '../../services/github';
import { parseZipArchive } from '../../utils/zipParser';
import { CodeViewer } from '../common/CodeViewer';
import { NewFileModal } from '../modals/NewFileModal';
import { UniversalUploadModal } from '../modals/UniversalUploadModal';
import { CodebaseExplorer } from '../common/CodebaseExplorer';
import { CommitsView } from './CommitsView';
import { ActionsView } from './ActionsView';
import { ReleasesView } from './ReleasesView';

export type CodebaseSubTab = 'explorer' | 'commits' | 'actions' | 'releases' | 'zipsync';

interface CodebaseTabProps {
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  onSelectRepo: (repo: GitHubRepo) => void;
  initialSubTab?: CodebaseSubTab;
}

export const CodebaseTab: React.FC<CodebaseTabProps> = ({
  repos,
  selectedRepo,
  onSelectRepo,
  initialSubTab = 'explorer',
}) => {
  // Sub-Navigation Mode
  const [activeSubTab, setActiveSubTab] = useState<CodebaseSubTab>(initialSubTab);

  // Time-Travel State
  const [timeTravelSha, setTimeTravelSha] = useState<string | null>(null);

  // Branch & Navigation State
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [treeItems, setTreeItems] = useState<GitHubTreeItem[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);

  // Active File Viewing/Editing
  const [activeFile, setActiveFile] = useState<{
    path: string;
    content: string;
    sha: string;
    isBinary: boolean;
    rawUrl?: string;
  } | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  // Modals
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showUniversalUploadModal, setShowUniversalUploadModal] = useState(false);

  // ZIP Sync & Diff State
  const [zipFiles, setZipFiles] = useState<ZipExtractedFile[]>([]);
  const [zipDiffList, setZipDiffList] = useState<ZipDiffResult[]>([]);
  const [zipFilter, setZipFilter] = useState<'all' | 'new_modified' | 'identical' | 'repo_only'>('all');
  const [isParsingZip, setIsParsingZip] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [showZipSyncPanel, setShowZipSyncPanel] = useState(false);
  const [zipCommitMessage, setZipCommitMessage] = useState('');
  const [batchProgress, setBatchProgress] = useState<BatchCommitProgress | null>(null);
  const [isCommittingBatch, setIsCommittingBatch] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load branches when repo changes
  useEffect(() => {
    if (!selectedRepo) return;
    loadBranches(selectedRepo);
    setTimeTravelSha(null);
  }, [selectedRepo]);

  // Load Tree when branch or repo changes
  useEffect(() => {
    if (!selectedRepo || !selectedBranch) return;
    if (!timeTravelSha) {
      loadTree(selectedRepo, selectedBranch);
    }
    setActiveFile(null);
    setCurrentPath('');
  }, [selectedRepo, selectedBranch, timeTravelSha]);

  const loadBranches = async (repo: GitHubRepo) => {
    try {
      const branchList = await githubService.getBranches(repo.owner.login, repo.name);
      setBranches(branchList);
      if (branchList.length > 0) {
        const defaultB = branchList.find((b) => b.name === repo.default_branch) || branchList[0];
        setSelectedBranch(defaultB.name);
      }
    } catch (err: unknown) {
      console.error('Failed to load branches:', err);
    }
  };

  const loadTree = async (repo: GitHubRepo, branchName: string) => {
    try {
      setLoadingTree(true);
      const branchObj = branches.find((b) => b.name === branchName);
      const commitSha = branchObj?.commit.sha || branchName;
      const items = await githubService.getTree(repo.owner.login, repo.name, commitSha, true);
      setTreeItems(items);
    } catch (err: unknown) {
      console.error('Failed to load repo tree:', err);
    } finally {
      setLoadingTree(false);
    }
  };

  const handleTimeTravel = async (commitSha: string) => {
    if (!selectedRepo) return;
    try {
      setLoadingTree(true);
      setTimeTravelSha(commitSha);
      setActiveSubTab('explorer');
      setActiveFile(null);
      setCurrentPath('');
      const items = await githubService.getTreeAtCommit(selectedRepo.owner.login, selectedRepo.name, commitSha);
      setTreeItems(items);
    } catch (err: any) {
      alert(`Time travel failed: ${err.message || 'Could not fetch commit snapshot'}`);
      setTimeTravelSha(null);
    } finally {
      setLoadingTree(false);
    }
  };

  const handleReturnToLive = () => {
    setTimeTravelSha(null);
    if (selectedRepo && selectedBranch) {
      loadTree(selectedRepo, selectedBranch);
    }
  };

  const handleOpenFile = async (item: GitHubTreeItem) => {
    if (!selectedRepo) return;
    try {
      setLoadingFile(true);
      const refToUse = timeTravelSha || selectedBranch;
      const res = await githubService.getFileContent(
        selectedRepo.owner.login,
        selectedRepo.name,
        item.path,
        refToUse
      );
      setActiveFile({
        path: item.path,
        content: res.content,
        sha: res.sha,
        isBinary: res.isBinary,
        rawUrl: res.rawUrl,
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to fetch file content');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleSaveFileContent = async (newContent: string, commitMsg: string) => {
    if (!selectedRepo || !activeFile) return;
    if (timeTravelSha) {
      alert('Cannot edit files in historic Time-Travel mode. Return to live branch to make changes.');
      return;
    }
    try {
      const result = await githubService.createOrUpdateFile(
        selectedRepo.owner.login,
        selectedRepo.name,
        activeFile.path,
        newContent,
        commitMsg,
        activeFile.sha,
        selectedBranch
      );
      setActiveFile({
        ...activeFile,
        content: newContent,
        sha: result.content.sha,
      });
      // Refresh tree
      loadTree(selectedRepo, selectedBranch);
    } catch (err: unknown) {
      throw err;
    }
  };

  const handleDeleteActiveFile = async () => {
    if (!selectedRepo || !activeFile) return;
    if (timeTravelSha) {
      alert('Cannot delete files in historic Time-Travel mode.');
      return;
    }
    if (!confirm(`Are you sure you want to delete ${activeFile.path} from branch ${selectedBranch}?`)) return;

    try {
      await githubService.deleteFile(
        selectedRepo.owner.login,
        selectedRepo.name,
        activeFile.path,
        activeFile.sha,
        `chore: delete ${activeFile.path}`,
        selectedBranch
      );
      setActiveFile(null);
      loadTree(selectedRepo, selectedBranch);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const handleCreateNewFile = async (filePath: string, content: string, commitMsg: string) => {
    if (!selectedRepo) return;
    if (timeTravelSha) {
      alert('Cannot create files in historic Time-Travel mode.');
      return;
    }
    await githubService.createOrUpdateFile(
      selectedRepo.owner.login,
      selectedRepo.name,
      filePath,
      content,
      commitMsg,
      undefined,
      selectedBranch
    );
    loadTree(selectedRepo, selectedBranch);
  };

  // ZIP Upload & Diff Handling
  const handleZipFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRepo) return;

    try {
      setIsParsingZip(true);
      setShowZipSyncPanel(true);
      const parsedFiles = await parseZipArchive(file);
      setZipFiles(parsedFiles);

      // Now run comparison against repository tree
      setIsComparing(true);
      const diffResults: ZipDiffResult[] = [];

      const repoFileMap = new Map<string, GitHubTreeItem>();
      treeItems.forEach((t) => {
        if (t.type === 'blob') {
          repoFileMap.set(t.path, t);
        }
      });

      const processedZipPaths = new Set<string>();

      for (const zf of parsedFiles) {
        processedZipPaths.add(zf.path);
        const repoItem = repoFileMap.get(zf.path);

        if (!repoItem) {
          // New file in zip that doesn't exist in repo
          diffResults.push({
            path: zf.path,
            zipFile: zf,
            status: 'new',
            selected: true,
          });
        } else {
          // Exists in both: compare size as primary quick check
          const isSameSize = repoItem.size !== undefined && repoItem.size === zf.size;
          diffResults.push({
            path: zf.path,
            zipFile: zf,
            repoSha: repoItem.sha,
            repoSize: repoItem.size,
            status: isSameSize ? 'unchanged' : 'modified',
            selected: !isSameSize, // Auto-select modified files
          });
        }
      }

      // Identify GitHub-Only / Legacy files (exist in repo, but missing in ZIP)
      repoFileMap.forEach((repoItem, rPath) => {
        if (!processedZipPaths.has(rPath)) {
          diffResults.push({
            path: rPath,
            repoSha: repoItem.sha,
            repoSize: repoItem.size,
            status: 'repo_only',
            selected: false, // Default unselected so user can choose to clean
          });
        }
      });

      setZipDiffList(diffResults);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to parse ZIP archive');
    } finally {
      setIsParsingZip(false);
      setIsComparing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleDiffItemSelection = (path: string) => {
    setZipDiffList((prev) =>
      prev.map((item) => (item.path === path ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSelectAllFiltered = (selectAll: boolean) => {
    setZipDiffList((prev) =>
      prev.map((item) => {
        if (zipFilter === 'new_modified' && (item.status === 'new' || item.status === 'modified')) {
          return { ...item, selected: selectAll };
        }
        if (zipFilter === 'identical' && item.status === 'unchanged') {
          return { ...item, selected: selectAll };
        }
        if (zipFilter === 'repo_only' && item.status === 'repo_only') {
          return { ...item, selected: selectAll };
        }
        if (zipFilter === 'all') {
          return { ...item, selected: selectAll };
        }
        return item;
      })
    );
  };

  // Perform Atomic Batch Sync to GitHub (Uploads + Deletions)
  const handleExecuteBatchSync = async () => {
    if (!selectedRepo || !selectedBranch) return;

    const filesToUpload = zipDiffList
      .filter((d) => d.selected && d.status !== 'repo_only' && d.zipFile)
      .map((d) => ({
        path: d.path,
        content: d.zipFile!.content,
        isBinary: d.zipFile!.isBinary,
      }));

    const filesToDelete = zipDiffList
      .filter((d) => d.selected && d.status === 'repo_only')
      .map((d) => d.path);

    if (filesToUpload.length === 0 && filesToDelete.length === 0) {
      alert('Please select at least one file to upload or delete.');
      return;
    }

    try {
      setIsCommittingBatch(true);
      setBatchProgress({
        step: 'preparing',
        completedFiles: 0,
        totalFiles: filesToUpload.length + filesToDelete.length,
        percent: 0,
        message: 'Initializing Git commit...',
      });

      await githubService.batchCommitFiles(
        selectedRepo.owner.login,
        selectedRepo.name,
        selectedBranch,
        filesToUpload,
        zipCommitMessage.trim() ||
          `sync: batch update ${filesToUpload.length} files, removed ${filesToDelete.length} legacy files`,
        filesToDelete,
        (progress) => {
          setBatchProgress(progress);
        }
      );

      // Refresh repository tree
      setTimeout(() => {
        loadTree(selectedRepo, selectedBranch);
        setShowZipSyncPanel(false);
        setZipFiles([]);
        setZipDiffList([]);
        setIsCommittingBatch(false);
        setBatchProgress(null);
      }, 1500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Batch synchronization failed');
      setIsCommittingBatch(false);
    }
  };

  const filteredZipDiff = zipDiffList.filter((d) => {
    if (zipFilter === 'new_modified') return d.status === 'new' || d.status === 'modified';
    if (zipFilter === 'identical') return d.status === 'unchanged';
    if (zipFilter === 'repo_only') return d.status === 'repo_only';
    return true;
  });

  const newCount = zipDiffList.filter((d) => d.status === 'new').length;
  const modifiedCount = zipDiffList.filter((d) => d.status === 'modified').length;
  const identicalCount = zipDiffList.filter((d) => d.status === 'unchanged').length;
  const repoOnlyCount = zipDiffList.filter((d) => d.status === 'repo_only').length;
  const selectedUploadCount = zipDiffList.filter((d) => d.selected && d.status !== 'repo_only').length;
  const selectedDeleteCount = zipDiffList.filter((d) => d.selected && d.status === 'repo_only').length;

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto">
      {/* Hidden File Input for ZIP */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleZipFileSelected}
        className="hidden"
      />

      {/* Top Header Card: Repo & Branch Selector */}
      <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Repo dropdown */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="p-2 bg-[#0494f4]/15 text-[#0494f4] rounded-xl shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-[#5f6368] dark:text-[#9aa0a6] block mb-0.5">
                Active Repository
              </label>
              <select
                id="codebase-repo-select"
                value={selectedRepo ? selectedRepo.name : ''}
                onChange={(e) => {
                  const target = repos.find((r) => r.name === e.target.value);
                  if (target) onSelectRepo(target);
                }}
                className="w-full bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4]"
              >
                {repos.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name} {r.private ? '🔒' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Branch dropdown */}
          {branches.length > 0 && (
            <div className="flex items-center gap-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] px-3 py-1.5 rounded-xl shrink-0">
              <GitBranch className="w-4 h-4 text-[#0494f4]" />
              <select
                id="codebase-branch-select"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-[#202124] dark:text-[#e8eaed] focus:outline-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.name} value={b.name} className="bg-white dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed]">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons: Smart Upload Studio, ZIP Upload / Sync, New File, Refresh */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#dadce0] dark:border-[#3c4043] flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="smart-upload-studio-btn"
              onClick={() => setShowUniversalUploadModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0494f4] hover:bg-[#0382d6] active:scale-95 text-white text-xs font-bold rounded-2xl shadow-xs transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Smart Upload & Commit</span>
            </button>

            <button
              id="upload-zip-btn"
              onClick={() => {
                setActiveSubTab('zipsync');
                fileInputRef.current?.click();
              }}
              disabled={isParsingZip}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f3f4] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-[#202124] dark:text-[#e8eaed] text-xs font-semibold rounded-2xl border border-[#dadce0] dark:border-[#3c4043] transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#0494f4]" />
              <span>{isParsingZip ? 'Unpacking...' : 'ZIP Diff Sync'}</span>
            </button>

            <button
              id="create-new-file-btn"
              onClick={() => setShowNewFileModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f3f4] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-[#202124] dark:text-[#e8eaed] text-xs font-semibold rounded-2xl border border-[#dadce0] dark:border-[#3c4043] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#0494f4]" />
              <span>New File</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (selectedRepo && selectedBranch) {
                if (timeTravelSha) {
                  handleTimeTravel(timeTravelSha);
                } else {
                  loadTree(selectedRepo, selectedBranch);
                }
              }
            }}
            title="Refresh tree"
            className="p-2 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingTree ? 'animate-spin text-[#0494f4]' : ''}`} />
          </button>
        </div>

        {/* 5-Sub-Tab Navigation Bar */}
        <div className="pt-2 border-t border-[#dadce0]/60 dark:border-[#3c4043]/60 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          <button
            onClick={() => {
              setActiveSubTab('explorer');
              setActiveFile(null);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'explorer'
                ? 'bg-[#0494f4] text-white shadow-xs'
                : 'bg-[#f8f9fa] dark:bg-[#202124] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Code & Files</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('commits');
              setActiveFile(null);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'commits'
                ? 'bg-[#0494f4] text-white shadow-xs'
                : 'bg-[#f8f9fa] dark:bg-[#202124] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Commits & Time-Travel</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('actions');
              setActiveFile(null);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'actions'
                ? 'bg-[#0494f4] text-white shadow-xs'
                : 'bg-[#f8f9fa] dark:bg-[#202124] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Actions CI/CD</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('releases');
              setActiveFile(null);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'releases'
                ? 'bg-[#0494f4] text-white shadow-xs'
                : 'bg-[#f8f9fa] dark:bg-[#202124] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Releases & Tags</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('zipsync');
              setShowZipSyncPanel(true);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'zipsync' || showZipSyncPanel
                ? 'bg-[#0494f4] text-white shadow-xs'
                : 'bg-[#f8f9fa] dark:bg-[#202124] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>ZIP Sync Engine</span>
          </button>
        </div>
      </div>

      {/* Time-Travel Active Banner */}
      {timeTravelSha && (
        <div className="bg-[#0494f4]/15 border-2 border-[#0494f4] rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-[#0494f4] text-white rounded-xl shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-[#0494f4]">
                Time-Travel Active: Historic Commit Snapshot
              </h4>
              <p className="text-[#5f6368] dark:text-[#9aa0a6] font-mono text-[11px] truncate">
                Browsing codebase at SHA <strong>{timeTravelSha}</strong> (Read-Only)
              </p>
            </div>
          </div>

          <button
            onClick={handleReturnToLive}
            className="px-4 py-2 bg-[#0494f4] hover:bg-[#037acf] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return to Live Branch</span>
          </button>
        </div>
      )}

      {/* Render Active Sub-View */}
      {selectedRepo && activeSubTab === 'commits' ? (
        <CommitsView
          repo={selectedRepo}
          branches={branches}
          selectedBranch={selectedBranch}
          onSelectBranch={(b) => setSelectedBranch(b)}
          onTimeTravel={handleTimeTravel}
        />
      ) : selectedRepo && activeSubTab === 'actions' ? (
        <ActionsView
          repo={selectedRepo}
          branches={branches}
          selectedBranch={selectedBranch}
        />
      ) : selectedRepo && activeSubTab === 'releases' ? (
        <ReleasesView
          repo={selectedRepo}
          branches={branches}
          selectedBranch={selectedBranch}
        />
      ) : (
        /* Explorer / File Tree or ZIP Sync */
        <>
          {/* ZIP Sync Panel */}
          {showZipSyncPanel && (
        <div className="bg-white dark:bg-[#292a2d] border-2 border-[#0494f4] rounded-3xl p-5 shadow-lg space-y-4 transition-colors duration-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#0494f4] text-white rounded-xl">
                  <FileUp className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-[#202124] dark:text-[#e8eaed]">
                  ZIP Codebase Sync & Diff Engine
                </h3>
              </div>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1">
                Extracted <span className="font-bold text-[#202124] dark:text-[#e8eaed]">{zipFiles.length} files</span> locally. Compare with existing GitHub codebase and choose what to sync or clean.
              </p>
            </div>

            <button
              onClick={() => setShowZipSyncPanel(false)}
              className="text-xs text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#ea4335] px-2 py-1 rounded-lg"
            >
              Close
            </button>
          </div>

          {/* Diff Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setZipFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                zipFilter === 'all'
                  ? 'bg-[#0494f4] text-white'
                  : 'bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6]'
              }`}
            >
              All ({zipDiffList.length})
            </button>

            <button
              onClick={() => setZipFilter('new_modified')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                zipFilter === 'new_modified'
                  ? 'bg-[#34a853] text-white'
                  : 'bg-[#f1f3f4] dark:bg-[#303134] text-[#34a853]'
              }`}
            >
              <span>New & Modified</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                {newCount + modifiedCount}
              </span>
            </button>

            <button
              onClick={() => setZipFilter('identical')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                zipFilter === 'identical'
                  ? 'bg-[#5f6368] text-white'
                  : 'bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6]'
              }`}
            >
              <span>Identical</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                {identicalCount}
              </span>
            </button>

            <button
              onClick={() => setZipFilter('repo_only')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                zipFilter === 'repo_only'
                  ? 'bg-[#ea4335] text-white'
                  : 'bg-[#f1f3f4] dark:bg-[#303134] text-[#ea4335]'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>GitHub-Only (Legacy)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                {repoOnlyCount}
              </span>
            </button>
          </div>

          {/* Quick Explanation / Legacy Code Notice */}
          {zipFilter === 'repo_only' && (
            <div className="p-3 bg-[#ea4335]/10 border border-[#ea4335]/30 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-[#ea4335] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Legacy Code Management
              </div>
              <p className="text-[#5f6368] dark:text-[#9aa0a6]">
                These files currently exist on GitHub but are <strong>NOT present in your uploaded ZIP</strong>. If you replaced or deleted old files locally, you can select and delete them to prevent broken builds in GitHub Actions.
              </p>
            </div>
          )}

          {/* Selection controls & list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#5f6368] dark:text-[#9aa0a6] px-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectAllFiltered(true)}
                  className="text-[#0494f4] hover:underline font-semibold"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  onClick={() => handleSelectAllFiltered(false)}
                  className="text-[#5f6368] dark:text-[#9aa0a6] hover:underline"
                >
                  Deselect All
                </button>
              </div>

              <span>
                {selectedUploadCount} to upload, {selectedDeleteCount} to delete
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto border border-[#dadce0] dark:border-[#3c4043] rounded-2xl bg-[#f8f9fa] dark:bg-[#202124] divide-y divide-[#dadce0] dark:divide-[#3c4043]">
              {filteredZipDiff.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#80868b]">
                  No files matching this filter.
                </div>
              ) : (
                filteredZipDiff.map((item) => (
                  <div
                    key={item.path}
                    onClick={() => toggleDiffItemSelection(item.path)}
                    className="flex items-center justify-between p-2.5 hover:bg-white dark:hover:bg-[#292a2d] transition cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {item.selected ? (
                        <CheckSquare className="w-4 h-4 text-[#0494f4] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-[#80868b] shrink-0" />
                      )}

                      <span className="font-mono text-[#202124] dark:text-[#e8eaed] truncate">
                        {item.path}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'new' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34a853]/15 text-[#34a853] border border-[#34a853]/30">
                          + New
                        </span>
                      )}
                      {item.status === 'modified' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fbbc04]/15 text-[#fbbc04] border border-[#fbbc04]/30">
                          Modified
                        </span>
                      )}
                      {item.status === 'unchanged' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6]">
                          Identical
                        </span>
                      )}
                      {item.status === 'repo_only' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ea4335]/15 text-[#ea4335] border border-[#ea4335]/30">
                          GitHub-Only (Legacy)
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Commit Message & Commit Action */}
          <div className="space-y-3 pt-2 border-t border-[#dadce0] dark:border-[#3c4043]">
            <input
              type="text"
              value={zipCommitMessage}
              onChange={(e) => setZipCommitMessage(e.target.value)}
              placeholder="Commit message (e.g. Sync codebase from ZIP release)"
              className="w-full px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4]"
            />

            {/* Live Batch Progress Bar */}
            {batchProgress && (
              <div className="space-y-1.5 p-3 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#0494f4] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#0494f4] rounded-full animate-ping" />
                    {batchProgress.message}
                  </span>
                  <span className="font-mono text-[#202124] dark:text-[#e8eaed]">{batchProgress.percent}%</span>
                </div>
                <div className="w-full h-2 bg-[#dadce0] dark:bg-[#3c4043] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0494f4] transition-all duration-200"
                    style={{ width: `${batchProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowZipSyncPanel(false)}
                disabled={isCommittingBatch}
                className="px-4 py-2 bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteBatchSync}
                disabled={isCommittingBatch || (selectedUploadCount === 0 && selectedDeleteCount === 0)}
                className="px-5 py-2.5 bg-[#0494f4] hover:bg-[#0382d6] active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
              >
                {isCommittingBatch ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Committing to GitHub...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Push Sync ({selectedUploadCount} uploads
                      {selectedDeleteCount > 0 ? `, ${selectedDeleteCount} deletes` : ''})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: Active Code Viewer OR Directory File Tree */}
      {activeFile ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveFile(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-semibold text-[#0494f4] hover:border-[#0494f4] transition shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to File Explorer</span>
            </button>
          </div>

          <CodeViewer
            filename={activeFile.path.split('/').pop() || activeFile.path}
            content={activeFile.content}
            isBinary={activeFile.isBinary}
            rawUrl={activeFile.rawUrl}
            onSave={handleSaveFileContent}
            onDelete={handleDeleteActiveFile}
            canEdit={!activeFile.isBinary}
          />
        </div>
      ) : (
        <CodebaseExplorer
          treeItems={treeItems}
          currentPath={currentPath}
          onNavigatePath={(newPath) => setCurrentPath(newPath)}
          onOpenFile={(file) => handleOpenFile(file)}
          onCreateNewFile={() => setShowNewFileModal(true)}
          loading={loadingTree}
        />
      )}
      </>
      )}

      {/* Universal Multi-Mode Upload Modal */}
      {showUniversalUploadModal && selectedRepo && (
        <UniversalUploadModal
          isOpen={showUniversalUploadModal}
          onClose={() => setShowUniversalUploadModal(false)}
          repo={selectedRepo}
          currentBranch={selectedBranch}
          branches={branches}
          onUploadSuccess={(branchName) => {
            setSelectedBranch(branchName);
            loadTree(selectedRepo, branchName);
          }}
        />
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <NewFileModal
          isOpen={showNewFileModal}
          onClose={() => setShowNewFileModal(false)}
          onCreateFile={handleCreateNewFile}
          currentDirectory={currentPath}
        />
      )}
    </div>
  );
};
