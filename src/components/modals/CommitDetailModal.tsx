import React, { useState, useEffect } from 'react';
import {
  X,
  GitCommit,
  GitBranch,
  Copy,
  Check,
  Calendar,
  User,
  Plus,
  Minus,
  FileCode,
  ExternalLink,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GitHubRepo, GitHubCommitDetail, GitHubCommitFile } from '../../types/github';
import { githubService } from '../../services/github';

interface CommitDetailModalProps {
  repo: GitHubRepo;
  commitSha: string;
  onClose: () => void;
  onTimeTravel: (sha: string) => void;
}

export const CommitDetailModal: React.FC<CommitDetailModalProps> = ({
  repo,
  commitSha,
  onClose,
  onTimeTravel,
}) => {
  const [detail, setDetail] = useState<GitHubCommitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedSha, setCopiedSha] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCommit();
  }, [commitSha]);

  const loadCommit = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await githubService.getCommitDetail(repo.owner.login, repo.name, commitSha);
      setDetail(data);
      // Auto-expand first 3 file patches
      const initExpanded: Record<string, boolean> = {};
      (data.files || []).slice(0, 5).forEach((f) => {
        initExpanded[f.filename] = true;
      });
      setExpandedFiles(initExpanded);
    } catch (err: any) {
      setError(err.message || 'Failed to load commit details');
    } finally {
      setLoading(false);
    }
  };

  const copySha = () => {
    navigator.clipboard.writeText(commitSha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const toggleFile = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename],
    }));
  };

  const getStatusBadge = (status: GitHubCommitFile['status']) => {
    switch (status) {
      case 'added':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#34a853]/15 text-[#34a853]">Added</span>;
      case 'removed':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#ea4335]/15 text-[#ea4335]">Removed</span>;
      case 'modified':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#0494f4]/15 text-[#0494f4]">Modified</span>;
      case 'renamed':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#fbbc04]/20 text-[#b06000] dark:text-[#fbbc04]">Renamed</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-500/15 text-gray-500">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between gap-3 bg-white/50 dark:bg-[#292a2d]/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#0494f4]/10 text-[#0494f4] flex items-center justify-center shrink-0">
              <GitCommit className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] truncate flex items-center gap-2">
                Commit Details
                <span className="text-xs font-mono px-2 py-0.5 bg-[#f1f3f4] dark:bg-[#303134] rounded-lg text-[#5f6368] dark:text-[#9aa0a6]">
                  {commitSha.substring(0, 7)}
                </span>
              </h2>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate font-mono">
                {repo.full_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTimeTravel(commitSha)}
              title="Browse Codebase at this point in time"
              className="px-3 py-1.5 bg-[#0494f4] hover:bg-[#037acf] active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Time-Travel</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#0494f4] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Fetching commit diffs & metadata...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-[#ea4335]/10 border border-[#ea4335]/20 rounded-2xl text-[#ea4335] text-xs">
              {error}
            </div>
          ) : detail ? (
            <>
              {/* Commit Meta Card */}
              <div className="bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 space-y-3">
                {/* Commit Message */}
                <h3 className="text-sm font-semibold text-[#202124] dark:text-[#e8eaed] whitespace-pre-wrap break-words leading-relaxed font-sans">
                  {detail.commit.message}
                </h3>

                {/* Author & Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-[#dadce0]/60 dark:border-[#3c4043]/60">
                  <div className="flex items-center gap-2">
                    {detail.author?.avatar_url ? (
                      <img
                        src={detail.author.avatar_url}
                        alt={detail.author.login}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#dadce0] dark:bg-[#3c4043] flex items-center justify-center text-[10px] font-bold">
                        {detail.commit.author.name.charAt(0)}
                      </div>
                    )}
                    <span className="font-semibold text-[#202124] dark:text-[#e8eaed]">
                      {detail.author?.login || detail.commit.author.name}
                    </span>
                    <span className="text-[#80868b] text-[11px]">
                      committed on {new Date(detail.commit.author.date).toLocaleString()}
                    </span>
                  </div>

                  {/* SHA & GitHub Link */}
                  <div className="flex items-center gap-2 font-mono">
                    <button
                      onClick={copySha}
                      className="px-2.5 py-1 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-lg flex items-center gap-1.5 text-[11px] hover:border-[#0494f4] transition cursor-pointer"
                    >
                      {copiedSha ? <Check className="w-3 h-3 text-[#34a853]" /> : <Copy className="w-3 h-3" />}
                      <span>{commitSha.substring(0, 10)}</span>
                    </button>
                    <a
                      href={detail.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#0494f4] transition"
                      title="Open commit on GitHub"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Diff Stats Bar */}
                <div className="flex items-center gap-4 text-xs font-mono pt-1">
                  <span className="text-[#5f6368] dark:text-[#9aa0a6]">
                    <strong>{detail.files.length}</strong> changed files
                  </span>
                  <span className="text-[#34a853] flex items-center gap-0.5">
                    <Plus className="w-3.5 h-3.5" /> {detail.stats.additions.toLocaleString()} additions
                  </span>
                  <span className="text-[#ea4335] flex items-center gap-0.5">
                    <Minus className="w-3.5 h-3.5" /> {detail.stats.deletions.toLocaleString()} deletions
                  </span>
                </div>
              </div>

              {/* Changed Files with Diff Patches */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">
                    Files Changed ({detail.files.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const all: Record<string, boolean> = {};
                        detail.files.forEach((f) => (all[f.filename] = true));
                        setExpandedFiles(all);
                      }}
                      className="text-[11px] text-[#0494f4] hover:underline cursor-pointer"
                    >
                      Expand All
                    </button>
                    <span className="text-[#dadce0] dark:text-[#3c4043]">•</span>
                    <button
                      onClick={() => setExpandedFiles({})}
                      className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] hover:underline cursor-pointer"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {detail.files.map((file) => {
                    const isExpanded = Boolean(expandedFiles[file.filename]);
                    return (
                      <div
                        key={file.filename}
                        className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl overflow-hidden shadow-2xs"
                      >
                        {/* File Header Bar */}
                        <div
                          onClick={() => toggleFile(file.filename)}
                          className="px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-[#292a2d] flex items-center justify-between gap-2 cursor-pointer hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition"
                        >
                          <div className="flex items-center gap-2 min-w-0 font-mono text-xs">
                            <FileCode className="w-4 h-4 text-[#0494f4] shrink-0" />
                            <span className="font-semibold text-[#202124] dark:text-[#e8eaed] truncate">
                              {file.filename}
                            </span>
                            {getStatusBadge(file.status)}
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 text-xs font-mono">
                            <span className="text-[#34a853] text-[11px]">+{file.additions}</span>
                            <span className="text-[#ea4335] text-[11px]">-{file.deletions}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#5f6368]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#5f6368]" />
                            )}
                          </div>
                        </div>

                        {/* Diff Content / Patch */}
                        {isExpanded && (
                          <div className="p-3 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs overflow-x-auto max-h-96">
                            {file.patch ? (
                              <pre className="leading-5">
                                {file.patch.split('\n').map((line, idx) => {
                                  let lineClass = 'text-[#9cdcfe]';
                                  if (line.startsWith('+') && !line.startsWith('+++')) {
                                    lineClass = 'bg-[#34a853]/20 text-[#4ade80] px-1 block';
                                  } else if (line.startsWith('-') && !line.startsWith('---')) {
                                    lineClass = 'bg-[#ea4335]/20 text-[#f87171] px-1 block';
                                  } else if (line.startsWith('@@')) {
                                    lineClass = 'text-[#38bdf8] font-bold py-1 block bg-black/20';
                                  }
                                  return (
                                    <div key={idx} className={lineClass}>
                                      {line}
                                    </div>
                                  );
                                })}
                              </pre>
                            ) : (
                              <p className="text-xs text-[#80868b] italic py-2">
                                Binary file changed or diff not directly previewable.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
