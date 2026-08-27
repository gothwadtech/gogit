import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  GitBranch,
  Search,
  RefreshCw,
  Clock,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Layers,
  FileCode,
  Calendar,
} from 'lucide-react';
import { GitHubRepo, GitHubBranch, GitHubCommitItem } from '../../types/github';
import { githubService } from '../../services/github';
import { CommitDetailModal } from '../modals/CommitDetailModal';

interface CommitsViewProps {
  repo: GitHubRepo;
  branches: GitHubBranch[];
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
  onTimeTravel: (sha: string) => void;
}

export const CommitsView: React.FC<CommitsViewProps> = ({
  repo,
  branches,
  selectedBranch,
  onSelectBranch,
  onTimeTravel,
}) => {
  const [commits, setCommits] = useState<GitHubCommitItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(null);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!repo || !selectedBranch) return;
    loadCommits(1, true);
  }, [repo.name, selectedBranch]);

  const loadCommits = async (pageNum: number, reset = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await githubService.getCommits(repo.owner.login, repo.name, {
        sha: selectedBranch,
        per_page: 30,
        page: pageNum,
      });

      if (reset) {
        setCommits(data);
      } else {
        setCommits((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === 30);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || 'Failed to load commits history');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySha = (sha: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const filteredCommits = commits.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.commit.message.toLowerCase().includes(q) ||
      c.sha.toLowerCase().includes(q) ||
      c.commit.author.name.toLowerCase().includes(q) ||
      (c.author?.login || '').toLowerCase().includes(q)
    );
  });

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Actions Card */}
      <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#0494f4]/10 text-[#0494f4] flex items-center justify-center shrink-0">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed]">
                Commit History & Time-Travel Graph
              </h3>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                Track visual lineage, inspect file diffs, and explore code at any historic snapshot.
              </p>
            </div>
          </div>

          {/* Branch Selector */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedBranch}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-8 pr-7 py-1.5 bg-[#f1f3f4] dark:bg-[#292a2d] text-xs font-semibold text-[#202124] dark:text-[#e8eaed] rounded-xl border border-[#dadce0] dark:border-[#3c4043] focus:outline-none focus:border-[#0494f4] cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
              <GitBranch className="w-3.5 h-3.5 text-[#0494f4] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => loadCommits(1, true)}
              disabled={loading}
              title="Refresh Commits"
              className="p-2 bg-[#f1f3f4] dark:bg-[#292a2d] hover:bg-[#e8eaed] dark:hover:bg-[#303134] text-[#202124] dark:text-[#e8eaed] rounded-xl border border-[#dadce0] dark:border-[#3c4043] transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0494f4] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search commits by message, author, or SHA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl text-xs text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4] transition"
          />
          <Search className="w-4 h-4 text-[#80868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-[#ea4335]/10 border border-[#ea4335]/20 rounded-2xl text-[#ea4335] text-xs">
          {error}
        </div>
      )}

      {/* Timeline Commit List */}
      <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-4">
        {loading && commits.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#0494f4] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Loading commit graph...</p>
          </div>
        ) : filteredCommits.length === 0 ? (
          <div className="py-12 text-center text-[#5f6368] dark:text-[#9aa0a6] text-xs">
            No commits found matching query.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-4">
            {/* Visual Continuous Timeline Rail */}
            <div className="absolute left-2.5 sm:left-3.5 top-3 bottom-3 w-0.5 bg-[#dadce0] dark:bg-[#3c4043]" />

            {filteredCommits.map((item, idx) => {
              const firstLine = item.commit.message.split('\n')[0];
              const authorName = item.author?.login || item.commit.author.name;
              const avatarUrl = item.author?.avatar_url;

              return (
                <div
                  key={item.sha}
                  onClick={() => setSelectedCommitSha(item.sha)}
                  className="relative group bg-[#f8f9fa] dark:bg-[#292a2d] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] rounded-2xl p-3 sm:p-4 transition cursor-pointer shadow-2xs"
                >
                  {/* Timeline Graph Node Dot */}
                  <div className="absolute -left-6 sm:-left-8 top-4 w-3.5 h-3.5 rounded-full bg-[#0494f4] border-2 border-white dark:border-[#202124] shadow-xs group-hover:scale-125 transition-transform" />

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Commit Title */}
                      <h4 className="text-xs sm:text-sm font-semibold text-[#202124] dark:text-[#e8eaed] leading-snug break-words">
                        {firstLine}
                      </h4>

                      {/* Author & Date metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                        <div className="flex items-center gap-1.5 font-medium text-[#202124] dark:text-[#e8eaed]">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={authorName} className="w-4 h-4 rounded-full object-cover" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-[#dadce0] dark:bg-[#3c4043] flex items-center justify-center text-[9px]">
                              {authorName.charAt(0)}
                            </div>
                          )}
                          <span>{authorName}</span>
                        </div>

                        <span>•</span>
                        <span title={item.commit.author.date}>{formatRelativeTime(item.commit.author.date)}</span>

                        {item.commit.verification?.verified && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-[#34a853]/15 text-[#34a853] font-bold rounded text-[10px]">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side SHA & Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-start pt-0.5">
                      {/* Copy SHA pill */}
                      <button
                        onClick={(e) => handleCopySha(item.sha, e)}
                        title="Copy Commit SHA"
                        className="px-2 py-1 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-lg font-mono text-[11px] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#0494f4] hover:border-[#0494f4] transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedSha === item.sha ? (
                          <Check className="w-3 h-3 text-[#34a853]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{item.sha.substring(0, 7)}</span>
                      </button>

                      {/* Time travel button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTimeTravel(item.sha);
                        }}
                        title="Explore Codebase at this point in time"
                        className="p-1.5 bg-[#0494f4]/10 hover:bg-[#0494f4] text-[#0494f4] hover:text-white rounded-lg transition cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-[#80868b] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => loadCommits(page + 1)}
                  disabled={loading}
                  className="px-4 py-2 bg-[#f1f3f4] dark:bg-[#292a2d] hover:bg-[#e8eaed] dark:hover:bg-[#303134] text-xs font-bold text-[#202124] dark:text-[#e8eaed] rounded-xl border border-[#dadce0] dark:border-[#3c4043] transition cursor-pointer"
                >
                  {loading ? 'Loading more commits...' : 'Load More Commits'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Commit Detail Modal */}
      {selectedCommitSha && (
        <CommitDetailModal
          repo={repo}
          commitSha={selectedCommitSha}
          onClose={() => setSelectedCommitSha(null)}
          onTimeTravel={(sha) => {
            setSelectedCommitSha(null);
            onTimeTravel(sha);
          }}
        />
      )}
    </div>
  );
};
