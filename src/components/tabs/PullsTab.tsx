import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  Plus,
  Filter,
  RefreshCw,
  GitMerge,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  FileCode,
  ArrowRight,
  GitBranch,
  Search,
  Check,
  AlertCircle,
} from 'lucide-react';
import { GitHubRepo, GitHubPullRequest, GitHubBranch } from '../../types/github';
import { githubService } from '../../services/github';

interface PullsTabProps {
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  onSelectRepo: (repo: GitHubRepo) => void;
}

export const PullsTab: React.FC<PullsTabProps> = ({
  repos,
  selectedRepo,
  onSelectRepo,
}) => {
  const [pulls, setPulls] = useState<GitHubPullRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterState, setFilterState] = useState<'open' | 'closed' | 'all'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected PR Details
  const [selectedPR, setSelectedPR] = useState<GitHubPullRequest | null>(null);
  const [prFiles, setPrFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeMethod, setMergeMethod] = useState<'merge' | 'squash' | 'rebase'>('merge');

  // Create PR State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [headBranch, setHeadBranch] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedRepo) {
      loadPulls();
      loadBranches();
    }
  }, [selectedRepo, filterState]);

  const loadPulls = async () => {
    if (!selectedRepo) return;
    try {
      setLoading(true);
      const data = await githubService.getRepoPullRequests(
        selectedRepo.owner.login,
        selectedRepo.name,
        filterState
      );
      setPulls(data || []);
    } catch (err) {
      console.error(err);
      setPulls([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    if (!selectedRepo) return;
    try {
      const data = await githubService.getBranches(selectedRepo.owner.login, selectedRepo.name);
      setBranches(data);
      if (data.length > 0) {
        setBaseBranch(selectedRepo.default_branch || data[0].name);
        const otherBranch = data.find((b) => b.name !== selectedRepo.default_branch) || data[0];
        setHeadBranch(otherBranch.name);
      }
    } catch {
      // ignore
    }
  };

  const handleOpenPRDetail = async (pr: GitHubPullRequest) => {
    setSelectedPR(pr);
    if (!selectedRepo) return;
    try {
      setLoadingFiles(true);
      const files = await githubService.getPullRequestFiles(
        selectedRepo.owner.login,
        selectedRepo.name,
        pr.number
      );
      setPrFiles(files || []);
    } catch {
      setPrFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleMergePR = async () => {
    if (!selectedRepo || !selectedPR) return;
    if (!confirm(`Are you sure you want to ${mergeMethod} PR #${selectedPR.number}?`)) return;

    try {
      setMerging(true);
      await githubService.mergePullRequest(
        selectedRepo.owner.login,
        selectedRepo.name,
        selectedPR.number,
        {
          commit_title: `Merge pull request #${selectedPR.number} from ${selectedPR.head.ref}`,
          merge_method: mergeMethod,
        }
      );
      alert(`Pull Request #${selectedPR.number} successfully merged!`);
      setSelectedPR(null);
      loadPulls();
    } catch (err: any) {
      alert(`Merge failed: ${err.message || 'Check for merge conflicts'}`);
    } finally {
      setMerging(false);
    }
  };

  const handleClosePR = async () => {
    if (!selectedRepo || !selectedPR) return;
    if (!confirm(`Are you sure you want to close PR #${selectedPR.number} without merging?`)) return;

    try {
      await githubService.closePullRequest(
        selectedRepo.owner.login,
        selectedRepo.name,
        selectedPR.number
      );
      alert(`Pull Request #${selectedPR.number} closed.`);
      setSelectedPR(null);
      loadPulls();
    } catch (err: any) {
      alert(`Failed to close PR: ${err.message}`);
    }
  };

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo || !newTitle.trim()) return;
    if (headBranch === baseBranch) {
      setCreateError('Head branch and base branch cannot be the same.');
      return;
    }

    try {
      setCreatingPR(true);
      setCreateError(null);
      await githubService.createPullRequest(selectedRepo.owner.login, selectedRepo.name, {
        title: newTitle.trim(),
        head: headBranch,
        base: baseBranch,
        body: newBody.trim() || undefined,
        draft: isDraft,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewBody('');
      loadPulls();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create Pull Request');
    } finally {
      setCreatingPR(false);
    }
  };

  const filteredPulls = pulls.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(p.number).includes(searchQuery) ||
    p.user.login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto">
      {/* Top Header & Repository Selector */}
      <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#34a853]/15 text-[#34a853] rounded-2xl">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed]">
                Pull Requests
              </h2>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                Review branch merges, view diffs, create and merge PRs
              </p>
            </div>
          </div>

          {selectedRepo && (
            <button
              id="new-pull-request-btn"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0494f4] hover:bg-[#0382d6] active:scale-95 text-white text-xs font-bold rounded-2xl shadow-sm transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Pull Request</span>
            </button>
          )}
        </div>

        {/* Repo Picker & State Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-[#dadce0]/60 dark:border-[#3c4043]/60">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] shrink-0">
              Repository:
            </span>
            <select
              value={selectedRepo?.id || ''}
              onChange={(e) => {
                const found = repos.find((r) => r.id === Number(e.target.value));
                if (found) onSelectRepo(found);
              }}
              className="w-full sm:w-64 px-3 py-1.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-semibold text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4] cursor-pointer"
            >
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.private ? '🔒' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-[#f1f3f4] dark:bg-[#202124] p-1 rounded-xl border border-[#dadce0] dark:border-[#3c4043] text-xs">
              <button
                onClick={() => setFilterState('open')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterState === 'open'
                    ? 'bg-[#34a853] text-white shadow-xs'
                    : 'text-[#5f6368] dark:text-[#9aa0a6]'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setFilterState('closed')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterState === 'closed'
                    ? 'bg-[#80868b] text-white shadow-xs'
                    : 'text-[#5f6368] dark:text-[#9aa0a6]'
                }`}
              >
                Closed
              </button>
              <button
                onClick={() => setFilterState('all')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterState === 'all'
                    ? 'bg-[#0494f4] text-white shadow-xs'
                    : 'text-[#5f6368] dark:text-[#9aa0a6]'
                }`}
              >
                All
              </button>
            </div>

            <button
              onClick={loadPulls}
              title="Refresh PRs"
              className="p-2 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0494f4]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* PR Search Filter */}
      {pulls.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#80868b]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter pull requests by title, number, or author..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl text-xs text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4]"
          />
        </div>
      )}

      {/* Pull Requests List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#5f6368] dark:text-[#9aa0a6] space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0494f4]" />
          <p>Fetching pull requests...</p>
        </div>
      ) : filteredPulls.length > 0 ? (
        <div className="space-y-2.5">
          {filteredPulls.map((pr) => {
            const isOpen = pr.state === 'open';
            const isMerged = Boolean(pr.merged_at);

            return (
              <div
                key={pr.id}
                onClick={() => handleOpenPRDetail(pr)}
                className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition cursor-pointer space-y-3 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isMerged
                          ? 'bg-[#a142f4]/15 text-[#a142f4]'
                          : isOpen
                          ? 'bg-[#34a853]/15 text-[#34a853]'
                          : 'bg-[#ea4335]/15 text-[#ea4335]'
                      }`}
                    >
                      <GitPullRequest className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[#0494f4] transition truncate">
                          {pr.title}
                        </h3>
                        <span className="text-xs font-mono text-[#80868b]">#{pr.number}</span>
                        {pr.draft && (
                          <span className="px-2 py-0.5 bg-[#80868b]/15 text-[#80868b] text-[10px] font-bold rounded-full">
                            Draft
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#5f6368] dark:text-[#9aa0a6] pt-1 flex-wrap font-mono">
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3 text-[#0494f4]" />
                          <strong className="text-[#202124] dark:text-[#e8eaed]">{pr.head.ref}</strong>
                        </span>
                        <span>into</span>
                        <span className="font-semibold text-[#80868b]">{pr.base.ref}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize shrink-0 ${
                      isMerged
                        ? 'bg-[#a142f4]/15 text-[#a142f4]'
                        : isOpen
                        ? 'bg-[#34a853]/15 text-[#34a853]'
                        : 'bg-[#80868b]/15 text-[#80868b]'
                    }`}
                  >
                    {isMerged ? 'Merged' : pr.state}
                  </span>
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between text-[11px] text-[#80868b] pt-2 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50">
                  <div className="flex items-center gap-2">
                    <img src={pr.user.avatar_url} alt={pr.user.login} className="w-4 h-4 rounded-full" />
                    <span>opened by <strong>{pr.user.login}</strong> on {new Date(pr.created_at).toLocaleDateString()}</span>
                  </div>

                  <span className="text-[#0494f4] font-bold">Review & Diff →</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#34a853]/15 text-[#34a853] flex items-center justify-center mx-auto">
            <GitPullRequest className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">
            No Pull Requests Found
          </h3>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-sm mx-auto">
            There are currently no {filterState !== 'all' ? filterState : ''} pull requests in this repository.
          </p>
          {selectedRepo && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#0494f4] hover:bg-[#0382d6] text-white text-xs font-bold rounded-2xl transition cursor-pointer"
            >
              Create Pull Request
            </button>
          )}
        </div>
      )}

      {/* PR Detail Modal / Drawer */}
      {selectedPR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-[#dadce0] dark:border-[#3c4043] flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-[#34a853]/15 text-[#34a853] text-xs font-bold rounded-full">
                    {selectedPR.state.toUpperCase()}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] truncate">
                    {selectedPR.title}
                  </h3>
                  <span className="text-xs font-mono text-[#80868b]">#{selectedPR.number}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#5f6368] dark:text-[#9aa0a6] pt-1 font-mono">
                  <span className="font-bold text-[#0494f4]">{selectedPR.head.ref}</span>
                  <ArrowRight className="w-3 h-3 text-[#80868b]" />
                  <span className="font-bold text-[#202124] dark:text-[#e8eaed]">{selectedPR.base.ref}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPR(null)}
                className="p-1.5 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#80868b] hover:text-[#202124] dark:hover:text-[#e8eaed] rounded-xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {selectedPR.body && (
                <div className="p-3.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl whitespace-pre-wrap text-[#202124] dark:text-[#e8eaed] leading-relaxed">
                  {selectedPR.body}
                </div>
              )}

              {/* Changed Files List */}
              <div className="space-y-2">
                <h4 className="font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between">
                  <span>Files Changed ({prFiles.length})</span>
                  {loadingFiles && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0494f4]" />}
                </h4>

                {prFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-[#202124] dark:text-[#e8eaed] truncate">
                        {file.filename}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[#34a853]">+{file.additions}</span>
                        <span className="text-[#ea4335]">-{file.deletions}</span>
                      </div>
                    </div>

                    {file.patch && (
                      <pre className="p-2.5 bg-[#202124] text-[#e8eaed] rounded-xl text-[11px] font-mono overflow-x-auto max-h-40 border border-[#3c4043]">
                        {file.patch}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Merge / Close Action Footer */}
            {selectedPR.state === 'open' && (
              <div className="p-4 border-t border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#202124] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={mergeMethod}
                    onChange={(e) => setMergeMethod(e.target.value as any)}
                    className="px-3 py-1.5 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-semibold text-[#202124] dark:text-[#e8eaed] cursor-pointer"
                  >
                    <option value="merge">Create a merge commit</option>
                    <option value="squash">Squash and merge</option>
                    <option value="rebase">Rebase and merge</option>
                  </select>

                  <button
                    onClick={handleMergePR}
                    disabled={merging}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0494f4] hover:bg-[#0382d6] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <GitMerge className="w-4 h-4" />
                    <span>{merging ? 'Merging...' : 'Merge Pull Request'}</span>
                  </button>
                </div>

                <button
                  onClick={handleClosePR}
                  className="px-3.5 py-1.5 text-[#ea4335] hover:bg-[#ea4335]/10 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Close PR
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Pull Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-[#0494f4]" />
                <span>Open New Pull Request</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-[#80868b] hover:text-[#202124] dark:hover:text-[#e8eaed] rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePR} className="space-y-3.5 text-xs">
              {/* Branch Selector Row */}
              <div className="grid grid-cols-2 gap-2.5 p-3 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl">
                <div>
                  <label className="text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] block mb-1">
                    Compare (Head Branch)
                  </label>
                  <select
                    value={headBranch}
                    onChange={(e) => setHeadBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-mono font-semibold text-[#0494f4] cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] block mb-1">
                    Base Branch (Target)
                  </label>
                  <select
                    value={baseBranch}
                    onChange={(e) => setBaseBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-mono font-semibold text-[#202124] dark:text-[#e8eaed] cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#5f6368] dark:text-[#9aa0a6] block mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. feat: integrate responsive design..."
                  className="w-full px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#5f6368] dark:text-[#9aa0a6] block mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Describe your changes and PR purpose..."
                  className="w-full px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4] resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="draft-pr-toggle"
                  checked={isDraft}
                  onChange={(e) => setIsDraft(e.target.checked)}
                  className="w-4 h-4 accent-[#0494f4] cursor-pointer"
                />
                <label htmlFor="draft-pr-toggle" className="text-xs text-[#5f6368] dark:text-[#9aa0a6] cursor-pointer">
                  Create as draft pull request (cannot be merged until marked ready)
                </label>
              </div>

              {createError && (
                <div className="p-3 bg-[#ea4335]/15 text-[#ea4335] text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPR || !newTitle.trim()}
                  className="px-5 py-2 bg-[#0494f4] hover:bg-[#0382d6] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                >
                  {creatingPR ? 'Opening PR...' : 'Create Pull Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
