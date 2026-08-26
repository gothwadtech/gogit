import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  HardDrive,
  BarChart3,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileImage,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { PathAnalysis, formatBytes } from '../../utils/treeMetrics';
import { GitHubTreeItem } from '../../types/github';

interface FolderAnalysisCardProps {
  analysis: PathAnalysis;
  onSelectFile?: (item: GitHubTreeItem) => void;
  selectedExtensionFilter?: string | null;
  onToggleExtensionFilter?: (ext: string | null) => void;
}

export const FolderAnalysisCard: React.FC<FolderAnalysisCardProps> = ({
  analysis,
  onSelectFile,
  selectedExtensionFilter,
  onToggleExtensionFilter,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const pathDisplay = analysis.isRoot ? 'root directory' : `/${analysis.path}`;

  return (
    <div className="bg-gradient-to-br from-[#f8f9fa] to-white dark:from-[#202124] dark:to-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 transition-all duration-200">
      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-[#0494f4]/15 text-[#0494f4] rounded-2xl shrink-0">
            <Folder className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">
                {analysis.isRoot ? 'Repository Root' : 'Folder Analysis'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#0494f4]/10 text-[#0494f4] rounded-full">
                {formatBytes(analysis.totalRecursiveSize)} total
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold font-mono text-[#202124] dark:text-[#e8eaed] truncate">
              {pathDisplay}
            </h3>
          </div>
        </div>

        {/* Action button to expand deep analytics */}
        <button
          id="toggle-deep-analysis-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#303134] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] border border-[#dadce0] dark:border-[#3c4043] text-xs font-semibold text-[#202124] dark:text-[#e8eaed] rounded-xl shadow-2xs transition self-end sm:self-auto cursor-pointer"
        >
          <BarChart3 className="w-3.5 h-3.5 text-[#0494f4]" />
          <span>{isExpanded ? 'Hide Deep Analysis' : 'Full Storage Analysis'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 4-Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Metric 1: Direct Items */}
        <div className="bg-white dark:bg-[#202124] border border-[#dadce0]/80 dark:border-[#3c4043]/80 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-[#5f6368] dark:text-[#9aa0a6] text-[11px] font-medium mb-1">
            <span>Direct in Folder</span>
            <Folder className="w-3.5 h-3.5 text-[#0494f4]" />
          </div>
          <div className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed]">
            {analysis.directTotalItems} <span className="text-xs font-normal text-[#5f6368] dark:text-[#9aa0a6]">items</span>
          </div>
          <div className="text-[10px] text-[#80868b] mt-0.5 flex items-center gap-1.5">
            <span>{analysis.directFilesCount} files</span>
            <span>•</span>
            <span>{analysis.directFoldersCount} subfolders</span>
          </div>
        </div>

        {/* Metric 2: Direct Size */}
        <div className="bg-white dark:bg-[#202124] border border-[#dadce0]/80 dark:border-[#3c4043]/80 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-[#5f6368] dark:text-[#9aa0a6] text-[11px] font-medium mb-1">
            <span>Direct Size</span>
            <HardDrive className="w-3.5 h-3.5 text-[#188038]" />
          </div>
          <div className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed]">
            {formatBytes(analysis.directSize)}
          </div>
          <div className="text-[10px] text-[#80868b] mt-0.5">
            Immediate files only
          </div>
        </div>

        {/* Metric 3: Total Subtree Items */}
        <div className="bg-white dark:bg-[#202124] border border-[#dadce0]/80 dark:border-[#3c4043]/80 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-[#5f6368] dark:text-[#9aa0a6] text-[11px] font-medium mb-1">
            <span>Total Nested Items</span>
            <Layers className="w-3.5 h-3.5 text-[#f29900]" />
          </div>
          <div className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed]">
            {analysis.totalRecursiveItemsCount} <span className="text-xs font-normal text-[#5f6368] dark:text-[#9aa0a6]">all subfolders</span>
          </div>
          <div className="text-[10px] text-[#80868b] mt-0.5 flex items-center gap-1.5">
            <span>{analysis.totalRecursiveFilesCount} files</span>
            <span>•</span>
            <span>{analysis.totalRecursiveFoldersCount} folders</span>
          </div>
        </div>

        {/* Metric 4: Total Subtree Storage */}
        <div className="bg-white dark:bg-[#202124] border border-[#dadce0]/80 dark:border-[#3c4043]/80 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-[#5f6368] dark:text-[#9aa0a6] text-[11px] font-medium mb-1">
            <span>Total Nested Size</span>
            <Sparkles className="w-3.5 h-3.5 text-[#a142f4]" />
          </div>
          <div className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed]">
            {formatBytes(analysis.totalRecursiveSize)}
          </div>
          <div className="text-[10px] text-[#80868b] mt-0.5">
            Entire directory tree
          </div>
        </div>
      </div>

      {/* Deep Analysis Expandable Section */}
      {isExpanded && (
        <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] space-y-4 animate-fadeIn">
          {/* Storage Distribution Visual Bar */}
          {analysis.extensionStats.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6]">
                <span>Storage & File Type Breakdown</span>
                <span className="text-[11px] text-[#80868b]">
                  {analysis.extensionStats.length} file types detected
                </span>
              </div>

              {/* Multi-color segment bar */}
              <div className="w-full h-3 bg-[#e8eaed] dark:bg-[#303134] rounded-full overflow-hidden flex shadow-inner">
                {analysis.extensionStats.map((stat) => {
                  const widthPct = Math.max(stat.percentage, 1);
                  return (
                    <div
                      key={stat.extension}
                      title={`${stat.extension.toUpperCase()}: ${stat.count} files (${formatBytes(stat.totalSize)}, ${stat.percentage.toFixed(1)}%)`}
                      style={{ width: `${widthPct}%` }}
                      className={`h-full transition-all duration-300 ${
                        stat.info.category === 'code'
                          ? 'bg-[#0494f4]'
                          : stat.info.category === 'style'
                          ? 'bg-[#d93025]'
                          : stat.info.category === 'config'
                          ? 'bg-[#f29900]'
                          : stat.info.category === 'doc'
                          ? 'bg-[#188038]'
                          : stat.info.category === 'media'
                          ? 'bg-[#a142f4]'
                          : 'bg-[#80868b]'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Extension Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {analysis.extensionStats.map((stat) => {
                  const isSelected = selectedExtensionFilter === stat.extension;
                  return (
                    <button
                      key={stat.extension}
                      onClick={() =>
                        onToggleExtensionFilter?.(isSelected ? null : stat.extension)
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs transition border cursor-pointer ${
                        isSelected
                          ? 'bg-[#0494f4] text-white border-[#0494f4] shadow-sm'
                          : 'bg-white dark:bg-[#202124] border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e8eaed] hover:border-[#0494f4]'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          stat.info.category === 'code'
                            ? 'bg-[#0494f4]'
                            : stat.info.category === 'style'
                            ? 'bg-[#d93025]'
                            : stat.info.category === 'config'
                            ? 'bg-[#f29900]'
                            : stat.info.category === 'doc'
                            ? 'bg-[#188038]'
                            : stat.info.category === 'media'
                            ? 'bg-[#a142f4]'
                            : 'bg-[#80868b]'
                        }`}
                      />
                      <span className="font-mono font-bold">.{stat.extension}</span>
                      <span className="text-[11px] opacity-75">
                        ({stat.count} • {formatBytes(stat.totalSize)})
                      </span>
                    </button>
                  );
                })}
                {selectedExtensionFilter && (
                  <button
                    onClick={() => onToggleExtensionFilter?.(null)}
                    className="text-xs text-[#0494f4] hover:underline px-2 py-1"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Largest Files Table */}
          {analysis.largestFiles.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#dadce0]/60 dark:border-[#3c4043]/60">
              <div className="flex items-center justify-between text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6]">
                <span>Top Largest Files in this Directory Tree</span>
                <span className="text-[11px] text-[#80868b]">Click to view</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysis.largestFiles.map((file) => {
                  const fileName = file.path.split('/').pop() || file.path;
                  return (
                    <div
                      key={file.path}
                      onClick={() => onSelectFile?.(file)}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl hover:border-[#0494f4] transition cursor-pointer text-xs group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCode className="w-3.5 h-3.5 text-[#0494f4] shrink-0" />
                        <div className="min-w-0">
                          <p className="font-mono font-semibold text-[#202124] dark:text-[#e8eaed] truncate group-hover:text-[#0494f4]">
                            {fileName}
                          </p>
                          <p className="text-[10px] text-[#80868b] truncate">{file.path}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-[#f1f3f4] dark:bg-[#303134] text-[#202124] dark:text-[#e8eaed] rounded-lg">
                          {formatBytes(file.size)}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#80868b] group-hover:text-[#0494f4]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
