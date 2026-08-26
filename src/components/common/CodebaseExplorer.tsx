import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  File,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  ArrowUpDown,
  Search,
  Plus,
  Copy,
  Check,
  Eye,
  Layers,
  HardDrive,
  Filter,
  ArrowUpLeft,
} from 'lucide-react';
import { GitHubTreeItem } from '../../types/github';
import {
  calculateFolderMetrics,
  calculatePathAnalysis,
  formatBytes,
  getFileExtensionInfo,
  FolderMetrics,
} from '../../utils/treeMetrics';
import { FolderAnalysisCard } from './FolderAnalysisCard';

export type ViewMode = 'grid' | 'list';
export type SortOption = 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc' | 'items_desc' | 'type_folder_first';
export type FilterCategory = 'all' | 'folders' | 'code' | 'docs' | 'media' | 'config';

interface CodebaseExplorerProps {
  treeItems: GitHubTreeItem[];
  currentPath: string;
  onNavigatePath: (path: string) => void;
  onOpenFile: (file: GitHubTreeItem) => void;
  onCreateNewFile: () => void;
  loading: boolean;
}

export const CodebaseExplorer: React.FC<CodebaseExplorerProps> = ({
  treeItems,
  currentPath,
  onNavigatePath,
  onOpenFile,
  onCreateNewFile,
  loading,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('type_folder_first');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [extensionFilter, setExtensionFilter] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // 1. Calculate Path Analysis (Deep Folder Metrics for Current Directory)
  const pathAnalysis = useMemo(() => {
    return calculatePathAnalysis(treeItems, currentPath);
  }, [treeItems, currentPath]);

  // 2. Identify all direct items (files & immediate subfolders) under currentPath
  const directItems = useMemo(() => {
    const normalizedCurrent = currentPath.replace(/\/+$/, '');
    const prefix = normalizedCurrent ? `${normalizedCurrent}/` : '';

    const folderMap = new Map<string, FolderMetrics>();
    const fileList: GitHubTreeItem[] = [];

    for (const item of treeItems) {
      if (prefix && !item.path.startsWith(prefix)) {
        continue;
      }

      const relPath = prefix ? item.path.slice(prefix.length) : item.path;
      if (!relPath) continue;

      const segments = relPath.split('/');

      if (segments.length === 1) {
        // Immediate child
        if (item.type === 'blob') {
          fileList.push(item);
        } else if (item.type === 'tree') {
          const folderFullPath = prefix ? `${prefix}${segments[0]}` : segments[0];
          if (!folderMap.has(folderFullPath)) {
            const metrics = calculateFolderMetrics(treeItems, folderFullPath);
            folderMap.set(folderFullPath, metrics);
          }
        }
      } else {
        // Subfolder path
        const directSubfolderName = segments[0];
        const folderFullPath = prefix ? `${prefix}${directSubfolderName}` : directSubfolderName;
        if (!folderMap.has(folderFullPath)) {
          const metrics = calculateFolderMetrics(treeItems, folderFullPath);
          folderMap.set(folderFullPath, metrics);
        }
      }
    }

    return {
      folders: Array.from(folderMap.values()),
      files: fileList,
    };
  }, [treeItems, currentPath]);

  // 3. Filter & Sort Items
  const processedItems = useMemo(() => {
    let filteredFolders = [...directItems.folders];
    let filteredFiles = [...directItems.files];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filteredFolders = filteredFolders.filter((f) => f.name.toLowerCase().includes(q));
      filteredFiles = filteredFiles.filter((f) => {
        const name = f.path.split('/').pop() || f.path;
        return name.toLowerCase().includes(q);
      });
    }

    // Category filter
    if (categoryFilter === 'folders') {
      filteredFiles = [];
    } else if (categoryFilter !== 'all') {
      filteredFolders = [];
      filteredFiles = filteredFiles.filter((f) => {
        const name = f.path.split('/').pop() || f.path;
        const info = getFileExtensionInfo(name);
        if (categoryFilter === 'code') return info.category === 'code';
        if (categoryFilter === 'docs') return info.category === 'doc';
        if (categoryFilter === 'media') return info.category === 'media';
        if (categoryFilter === 'config') return info.category === 'config';
        return true;
      });
    }

    // Extension filter from deep analytics
    if (extensionFilter) {
      filteredFolders = [];
      filteredFiles = filteredFiles.filter((f) => {
        const name = f.path.split('/').pop() || f.path;
        const ext = name.split('.').pop()?.toLowerCase();
        return ext === extensionFilter.toLowerCase();
      });
    }

    // Sort items
    type ExplorerItem =
      | { type: 'folder'; data: FolderMetrics; name: string; size: number; totalItems: number }
      | { type: 'file'; data: GitHubTreeItem; name: string; size: number; totalItems: number };

    const combined: ExplorerItem[] = [
      ...filteredFolders.map((f) => ({
        type: 'folder' as const,
        data: f,
        name: f.name,
        size: f.totalRecursiveSize,
        totalItems: f.totalRecursiveItemsCount,
      })),
      ...filteredFiles.map((f) => {
        const name = f.path.split('/').pop() || f.path;
        return {
          type: 'file' as const,
          data: f,
          name,
          size: f.size || 0,
          totalItems: 1,
        };
      }),
    ];

    combined.sort((a, b) => {
      if (sortOption === 'type_folder_first') {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortOption === 'size_desc') {
        return b.size - a.size;
      }
      if (sortOption === 'size_asc') {
        return a.size - b.size;
      }
      if (sortOption === 'items_desc') {
        return b.totalItems - a.totalItems;
      }
      return 0;
    });

    return combined;
  }, [directItems, searchQuery, categoryFilter, extensionFilter, sortOption]);

  const handleCopyPath = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleNavigateParent = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    onNavigatePath(parts.join('/'));
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  // Render Icon based on file extension
  const renderFileIcon = (fileName: string) => {
    const info = getFileExtensionInfo(fileName);
    switch (info.category) {
      case 'code':
        return <FileCode className={`w-5 h-5 ${info.color}`} />;
      case 'doc':
        return <FileText className={`w-5 h-5 ${info.color}`} />;
      case 'media':
        return <FileImage className={`w-5 h-5 ${info.color}`} />;
      case 'archive':
        return <FileArchive className={`w-5 h-5 ${info.color}`} />;
      case 'config':
        return <FileSpreadsheet className={`w-5 h-5 ${info.color}`} />;
      default:
        return <File className={`w-5 h-5 ${info.color}`} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Deep Folder & Storage Analysis Card */}
      <FolderAnalysisCard
        analysis={pathAnalysis}
        onSelectFile={onOpenFile}
        selectedExtensionFilter={extensionFilter}
        onToggleExtensionFilter={(ext) => setExtensionFilter(ext)}
      />

      {/* 2. Explorer Controls Bar: Breadcrumbs, Search, View Mode Toggle, Sorting */}
      <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-4 shadow-sm space-y-3 transition-colors duration-200">
        {/* Row 1: Breadcrumbs Navigation & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-1 text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] overflow-x-auto py-1 scrollbar-none">
            <button
              onClick={() => onNavigatePath('')}
              className={`px-2 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer ${
                !currentPath
                  ? 'bg-[#0494f4]/15 text-[#0494f4] font-bold'
                  : 'hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#202124] dark:text-[#e8eaed]'
              }`}
            >
              <span>root</span>
              {!currentPath && (
                <span className="text-[10px] px-1.5 py-0.2 bg-[#0494f4] text-white rounded-full font-bold">
                  {pathAnalysis.directTotalItems}
                </span>
              )}
            </button>

            {pathParts.map((part, idx) => {
              const subPath = pathParts.slice(0, idx + 1).join('/');
              const isLast = idx === pathParts.length - 1;
              return (
                <React.Fragment key={subPath}>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#80868b]" />
                  <button
                    onClick={() => onNavigatePath(subPath)}
                    className={`px-2 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer ${
                      isLast
                        ? 'bg-[#0494f4]/15 text-[#0494f4] font-bold'
                        : 'hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#202124] dark:text-[#e8eaed]'
                    }`}
                  >
                    <span>{part}</span>
                    {isLast && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#0494f4] text-white rounded-full font-bold">
                        {pathAnalysis.directTotalItems}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search current folder..."
              className="w-full sm:w-56 pl-8 pr-3 py-1.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4]"
            />
          </div>
        </div>

        {/* Row 2: Category Filter Pills, Sort Dropdown, & Grid/List View Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#dadce0] dark:border-[#3c4043]">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            {(
              [
                { id: 'all', label: 'All Items' },
                { id: 'folders', label: `Folders (${pathAnalysis.directFoldersCount})` },
                { id: 'code', label: 'Code' },
                { id: 'docs', label: 'Docs' },
                { id: 'media', label: 'Media' },
                { id: 'config', label: 'Configs' },
              ] as Array<{ id: FilterCategory; label: string }>
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat.id && !extensionFilter
                    ? 'bg-[#0494f4] text-white shadow-2xs'
                    : 'bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right Toolbar: Sort & View Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] px-2.5 py-1 rounded-xl text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#0494f4]" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-transparent text-xs font-semibold text-[#202124] dark:text-[#e8eaed] focus:outline-none cursor-pointer"
              >
                <option value="type_folder_first">Folders First</option>
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
                <option value="size_desc">Size (Largest)</option>
                <option value="size_asc">Size (Smallest)</option>
                <option value="items_desc">Most Nested Items</option>
              </select>
            </div>

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center bg-[#f1f3f4] dark:bg-[#303134] p-0.5 rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
              <button
                id="view-mode-grid-btn"
                onClick={() => setViewMode('grid')}
                title="Grid View (File Manager)"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#202124] text-[#0494f4] shadow-2xs font-bold'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                id="view-mode-list-btn"
                onClick={() => setViewMode('list')}
                title="List View (Detailed)"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-[#202124] text-[#0494f4] shadow-2xs font-bold'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124]'
                }`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Items View: Grid or List */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl">
          <div className="w-8 h-8 border-3 border-[#0494f4]/20 border-t-[#0494f4] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6]">
            Analyzing and loading repository tree...
          </p>
        </div>
      ) : processedItems.length === 0 ? (
        <div className="text-center py-16 space-y-3 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6">
          <Folder className="w-12 h-12 text-[#80868b] mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">
            No matching items found
          </h4>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-sm mx-auto">
            {searchQuery || categoryFilter !== 'all' || extensionFilter
              ? 'No files or folders matched your active filter or search query.'
              : 'This directory is currently empty.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {(searchQuery || categoryFilter !== 'all' || extensionFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setExtensionFilter(null);
                }}
                className="px-3.5 py-1.5 bg-[#f1f3f4] dark:bg-[#303134] text-xs font-semibold text-[#202124] dark:text-[#e8eaed] rounded-xl hover:bg-[#e8eaed] transition cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={onCreateNewFile}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0494f4] hover:bg-[#0382d6] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create File</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= GRID VIEW (FILE MANAGER CARDS) ================= */
        <div className="space-y-3">
          {/* Parent navigation button if inside subfolder */}
          {currentPath && (
            <div
              onClick={handleNavigateParent}
              className="flex items-center gap-2.5 p-3 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] rounded-2xl cursor-pointer text-xs font-bold text-[#0494f4] transition shadow-2xs group"
            >
              <ArrowUpLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Go up to parent folder (.. /)</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {processedItems.map((item) => {
              if (item.type === 'folder') {
                const f = item.data;
                return (
                  <div
                    key={f.path}
                    onClick={() => onNavigatePath(f.path)}
                    className="group bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] dark:hover:border-[#0494f4] rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top Folder Icon & Direct items badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="p-2 bg-[#0494f4]/15 text-[#0494f4] rounded-xl group-hover:scale-105 transition-transform">
                        <Folder className="w-6 h-6 fill-[#0494f4]/30" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] rounded-lg">
                        {f.directTotalItems} direct
                      </span>
                    </div>

                    {/* Folder Name */}
                    <div className="min-w-0 my-1">
                      <h4 className="font-bold text-xs sm:text-sm text-[#202124] dark:text-[#e8eaed] group-hover:text-[#0494f4] truncate">
                        {f.name}
                      </h4>
                      <p className="text-[10px] text-[#80868b] mt-0.5 truncate">
                        {f.totalRecursiveFilesCount} files • {f.totalRecursiveFoldersCount} subdirs
                      </p>
                    </div>

                    {/* Bottom Metadata: Recursive Size & Total Items */}
                    <div className="pt-2 mt-2 border-t border-[#dadce0]/60 dark:border-[#3c4043]/60 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#0494f4]">
                        {formatBytes(f.totalRecursiveSize)}
                      </span>
                      <span className="text-[10px] text-[#80868b] flex items-center gap-0.5">
                        <span>{f.totalRecursiveItemsCount} total</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              } else {
                const file = item.data;
                const extInfo = getFileExtensionInfo(item.name);
                return (
                  <div
                    key={file.path}
                    onClick={() => onOpenFile(file)}
                    className="group bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] dark:hover:border-[#0494f4] rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top File Type Badge & Copy Button */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className={`p-2 rounded-xl ${extInfo.bgColor} ${extInfo.darkBgColor} group-hover:scale-105 transition-transform`}>
                        {renderFileIcon(item.name)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-lg ${extInfo.bgColor} ${extInfo.darkBgColor} ${extInfo.color}`}>
                          {extInfo.label}
                        </span>
                        <button
                          onClick={(e) => handleCopyPath(file.path, e)}
                          title="Copy file path"
                          className="p-1 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded-lg text-[#80868b] hover:text-[#202124] transition opacity-0 group-hover:opacity-100"
                        >
                          {copiedPath === file.path ? (
                            <Check className="w-3 h-3 text-[#188038]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* File Name */}
                    <div className="min-w-0 my-1">
                      <h4 className="font-mono font-semibold text-xs text-[#202124] dark:text-[#e8eaed] group-hover:text-[#0494f4] truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-[#80868b] mt-0.5 truncate">
                        {extInfo.category.toUpperCase()} file
                      </p>
                    </div>

                    {/* Bottom Metadata: Exact File Size & Preview Action */}
                    <div className="pt-2 mt-2 border-t border-[#dadce0]/60 dark:border-[#3c4043]/60 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#5f6368] dark:text-[#9aa0a6]">
                        {formatBytes(file.size)}
                      </span>
                      <span className="text-[10px] text-[#0494f4] font-semibold flex items-center gap-0.5 group-hover:underline">
                        <span>View</span>
                        <Eye className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      ) : (
        /* ================= LIST VIEW (DETAILED COLUMNS) ================= */
        <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#292a2d] border-b border-[#dadce0] dark:border-[#3c4043] text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">
            <div className="col-span-6 sm:col-span-5 flex items-center gap-2">Name</div>
            <div className="col-span-3 sm:col-span-3 text-center sm:text-left">Items / Type</div>
            <div className="col-span-3 sm:col-span-2 text-right">Size</div>
            <div className="hidden sm:block sm:col-span-2 text-right">Action</div>
          </div>

          <div className="divide-y divide-[#dadce0] dark:divide-[#3c4043]">
            {/* Parent folder if in subpath */}
            {currentPath && (
              <div
                onClick={handleNavigateParent}
                className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#f8f9fa] dark:hover:bg-[#292a2d] transition cursor-pointer text-xs font-bold text-[#0494f4] items-center"
              >
                <div className="col-span-12 flex items-center gap-2">
                  <ArrowUpLeft className="w-4 h-4" />
                  <span>.. (Parent Directory)</span>
                </div>
              </div>
            )}

            {processedItems.map((item) => {
              if (item.type === 'folder') {
                const f = item.data;
                return (
                  <div
                    key={f.path}
                    onClick={() => onNavigatePath(f.path)}
                    className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#f8f9fa] dark:hover:bg-[#292a2d] transition cursor-pointer text-xs items-center group"
                  >
                    {/* Name */}
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-2.5 min-w-0">
                      <Folder className="w-4 h-4 text-[#0494f4] fill-[#0494f4]/20 shrink-0" />
                      <span className="font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[#0494f4] truncate">
                        {f.name}
                      </span>
                    </div>

                    {/* Items count */}
                    <div className="col-span-3 sm:col-span-3 text-center sm:text-left text-[11px] text-[#5f6368] dark:text-[#9aa0a6] truncate">
                      <span className="font-semibold text-[#202124] dark:text-[#e8eaed]">
                        {f.directTotalItems} direct
                      </span>
                      <span className="hidden sm:inline text-[#80868b]">
                        {' '}
                        ({f.totalRecursiveItemsCount} nested)
                      </span>
                    </div>

                    {/* Total Size */}
                    <div className="col-span-3 sm:col-span-2 text-right font-bold text-[#0494f4] text-xs">
                      {formatBytes(f.totalRecursiveSize)}
                    </div>

                    {/* Action */}
                    <div className="hidden sm:flex sm:col-span-2 justify-end items-center text-[#80868b] group-hover:text-[#0494f4]">
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              } else {
                const file = item.data;
                const extInfo = getFileExtensionInfo(item.name);
                return (
                  <div
                    key={file.path}
                    onClick={() => onOpenFile(file)}
                    className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#f8f9fa] dark:hover:bg-[#292a2d] transition cursor-pointer text-xs items-center group"
                  >
                    {/* Name */}
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0">{renderFileIcon(item.name)}</div>
                      <span className="font-mono text-[#202124] dark:text-[#e8eaed] group-hover:text-[#0494f4] truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>

                    {/* Type tag */}
                    <div className="col-span-3 sm:col-span-3 text-center sm:text-left">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${extInfo.bgColor} ${extInfo.darkBgColor} ${extInfo.color}`}>
                        {extInfo.label}
                      </span>
                    </div>

                    {/* Exact File Size */}
                    <div className="col-span-3 sm:col-span-2 text-right font-semibold text-[#5f6368] dark:text-[#9aa0a6] text-xs">
                      {formatBytes(file.size)}
                    </div>

                    {/* Quick Action */}
                    <div className="hidden sm:flex sm:col-span-2 justify-end items-center gap-2">
                      <button
                        onClick={(e) => handleCopyPath(file.path, e)}
                        title="Copy Path"
                        className="p-1 hover:bg-[#dadce0] dark:hover:bg-[#3c4043] rounded-lg text-[#80868b] transition"
                      >
                        {copiedPath === file.path ? (
                          <Check className="w-3.5 h-3.5 text-[#188038]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <ChevronRight className="w-4 h-4 text-[#80868b] group-hover:text-[#0494f4] transition" />
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
};
