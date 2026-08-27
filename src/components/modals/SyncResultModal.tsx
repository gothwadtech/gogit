import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Check,
  X,
  FileText,
  Trash2,
  AlertCircle,
  Copy,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { BatchCommitResult } from '../../types/github';
import { formatBytes } from '../../utils/encoding';

interface SyncResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: BatchCommitResult;
  repoOwner: string;
  repoName: string;
  branch: string;
}

export const SyncResultModal: React.FC<SyncResultModalProps> = ({
  isOpen,
  onClose,
  result,
  repoOwner,
  repoName,
  branch,
}) => {
  const [activeTab, setActiveTab] = useState<'success' | 'failed' | 'deleted'>('success');
  const [copiedSha, setCopiedSha] = useState(false);

  if (!isOpen) return null;

  const handleCopySha = () => {
    navigator.clipboard.writeText(result.commitSha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const totalSize = result.successfulFiles.reduce((acc, f) => acc + (f.size || 0), 0);

  return (
    <div
      id="sync-result-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] transition-colors duration-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#292a2d]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs ${
                result.success ? 'bg-[#0494f4]' : 'bg-[#fbbc04]'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
                {result.success
                  ? 'Batch Sync Successful'
                  : 'Batch Sync Completed with Warnings'}
              </h2>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-mono">
                {repoOwner}/{repoName} · <span className="text-[#0494f4] font-semibold">{branch}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] rounded-xl hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
              result.success
                ? 'bg-[#0494f4]/10 border-[#0494f4]/30 text-[#202124] dark:text-[#e8eaed]'
                : 'bg-[#fbbc04]/10 border-[#fbbc04]/30 text-[#202124] dark:text-[#e8eaed]'
            }`}
          >
            <div className="font-bold flex items-center gap-2 text-sm">
              {result.success ? (
                <span className="text-[#0494f4]">All {result.successfulCount} files synchronized and committed!</span>
              ) : (
                <span className="text-[#e37400] dark:text-[#fbbc04]">
                  {result.successfulCount} of {result.totalAttempted} files uploaded ({result.failedCount} skipped).
                </span>
              )}
            </div>
            <p className="text-[#5f6368] dark:text-[#9aa0a6]">
              {result.success
                ? 'All files from your upload batch have been pushed to GitHub in a single atomic Git Tree commit.'
                : 'Some files could not be uploaded due to network or API constraints. Successfully processed files were committed to avoid data loss.'}
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="p-3 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl">
              <div className="text-lg font-extrabold text-[#0494f4]">{result.successfulCount}</div>
              <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">Committed ({formatBytes(totalSize)})</div>
            </div>

            <div className="p-3 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl">
              <div className="text-lg font-extrabold text-[#ea4335]">{result.deletedCount}</div>
              <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">Deleted Files</div>
            </div>

            <div className="p-3 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl">
              <div
                className={`text-lg font-extrabold ${
                  result.failedCount > 0 ? 'text-[#ea4335]' : 'text-[#34a853]'
                }`}
              >
                {result.failedCount}
              </div>
              <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">Errors / Skipped</div>
            </div>
          </div>

          {/* Commit SHA Box */}
          <div className="p-3 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0 font-mono">
              <span className="text-[#5f6368] dark:text-[#9aa0a6] text-[11px] block">Commit SHA</span>
              <span className="font-bold text-[#0494f4] truncate block">{result.commitSha}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopySha}
                className="px-2.5 py-1.5 bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] text-[#202124] dark:text-[#e8eaed] text-[11px] font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedSha ? <Check className="w-3 h-3 text-[#34a853]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSha ? 'Copied' : 'Copy SHA'}</span>
              </button>

              <a
                href={result.commitUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#0494f4] hover:bg-[#0382d6] text-white text-[11px] font-bold rounded-xl flex items-center gap-1 transition shadow-xs"
              >
                <span>GitHub</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Breakdown Tabs */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 border-b border-[#dadce0] dark:border-[#3c4043] pb-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('success')}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'success'
                    ? 'bg-[#0494f4] text-white'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Committed Files ({result.successfulCount})</span>
              </button>

              {result.failedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('failed')}
                  className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'failed'
                      ? 'bg-[#ea4335] text-white'
                      : 'text-[#ea4335] hover:bg-[#ea4335]/10'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Failed Files ({result.failedCount})</span>
                </button>
              )}

              {result.deletedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('deleted')}
                  className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'deleted'
                      ? 'bg-[#5f6368] text-white'
                      : 'text-[#5f6368] dark:text-[#9aa0a6]'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Deleted ({result.deletedCount})</span>
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-48 overflow-y-auto border border-[#dadce0] dark:border-[#3c4043] rounded-2xl bg-[#f8f9fa] dark:bg-[#202124] divide-y divide-[#dadce0] dark:divide-[#3c4043] font-mono text-xs">
              {activeTab === 'success' && (
                result.successfulFiles.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#80868b]">No files committed</div>
                ) : (
                  result.successfulFiles.map((f) => (
                    <div
                      key={f.path}
                      className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-white dark:hover:bg-[#292a2d] transition"
                    >
                      <span className="text-[#202124] dark:text-[#e8eaed] truncate">{f.path}</span>
                      <span className="text-[10px] text-[#0494f4] font-semibold shrink-0 bg-[#0494f4]/10 px-2 py-0.5 rounded-md">
                        {formatBytes(f.size)}
                      </span>
                    </div>
                  ))
                )
              )}

              {activeTab === 'failed' && (
                result.failedFiles.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#80868b]">No failed files</div>
                ) : (
                  result.failedFiles.map((f) => (
                    <div
                      key={f.path}
                      className="px-3 py-2 flex flex-col gap-0.5 bg-[#ea4335]/5"
                    >
                      <span className="text-[#ea4335] font-bold truncate">{f.path}</span>
                      <span className="text-[10px] text-[#80868b]">{f.error}</span>
                    </div>
                  ))
                )
              )}

              {activeTab === 'deleted' && (
                result.deletedPaths.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#80868b]">No files deleted</div>
                ) : (
                  result.deletedPaths.map((p) => (
                    <div
                      key={p}
                      className="px-3 py-2 flex items-center justify-between text-[#ea4335]"
                    >
                      <span className="truncate">{p}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ea4335]/15 font-semibold">
                        Deleted
                      </span>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#292a2d] flex items-center justify-between">
          <a
            href={result.commitUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#0494f4] font-semibold hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Commit in GitHub</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#0494f4] hover:bg-[#0382d6] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
