import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  GitPullRequest,
  Plus,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  Layers,
  Search,
  X,
} from 'lucide-react';
import { GitHubRepo, GitHubIssue, GitHubPullRequest } from '../../types/github';
import { githubService } from '../../services/github';

interface IssuesTabProps {
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  onSelectRepo: (repo: GitHubRepo) => void;
}

export const IssuesTab: React.FC<IssuesTabProps> = ({
  repos,
  selectedRepo,
  onSelectRepo,
}) => {
  const [activeType, setActiveType] = useState<'issues' | 'pulls'>('issues');
  const [stateFilter, setStateFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [searchQuery, setSearchQuery] = useState('');

  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // New Issue Modal
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueBody, setNewIssueBody] = useState('');
  const [creatingIssue, setCreatingIssue] = useState(false);

  // Detail Modal
  const [detailItem, setDetailItem] = useState<GitHubIssue | GitHubPullRequest | null>(null);

  useEffect(() => {
    if (!selectedRepo) return;
    loadData();
  }, [selectedRepo, activeType, stateFilter]);

  const loadData = async () => {
    if (!selectedRepo) return;
    try {
      setLoading(true);
      if (activeType === 'issues') {
        const data = await githubService.getRepoIssues(
          selectedRepo.owner.login,
          selectedRepo.name,
          stateFilter
        );
        // Filter out pull requests from issues endpoint if present
        setIssues(data.filter((i) => !i.pull_request));
      } else {
        const pulls = await githubService.getRepoPullRequests(
          selectedRepo.owner.login,
          selectedRepo.name,
          stateFilter
        );
        setPullRequests(pulls);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo || !newIssueTitle.trim()) return;
    try {
      setCreatingIssue(true);
      await githubService.createIssue(selectedRepo.owner.login, selectedRepo.name, {
        title: newIssueTitle.trim(),
        body: newIssueBody.trim(),
      });
      setShowNewIssueModal(false);
      setNewIssueTitle('');
      setNewIssueBody('');
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create issue');
    } finally {
      setCreatingIssue(false);
    }
  };

  const handleCloseIssue = async (issueNum: number) => {
    if (!selectedRepo) return;
    try {
      await githubService.closeIssue(selectedRepo.owner.login, selectedRepo.name, issueNum);
      setDetailItem(null);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to close issue');
    }
  };

  const filteredIssues = issues.filter((i) =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPulls = pullRequests.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto">
      {/* Top Repo Selector */}
      <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors duration-200">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="p-2 bg-[#0494f4]/15 text-[#0494f4] rounded-xl shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-[#5f6368] dark:text-[#9aa0a6] block mb-0.5">
              Select Repository
            </label>
            <select
              id="issues-repo-select"
              value={selectedRepo ? selectedRepo.name : ''}
              onChange={(e) => {
                const target = repos.find((r) => r.name === e.target.value);
                if (target) onSelectRepo(target);
              }}
              className="w-full bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4]"
            >
              {repos.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* New Issue Button */}
        {selectedRepo && activeType === 'issues' && (
          <button
            onClick={() => setShowNewIssueModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0494f4] hover:bg-[#0382d6] active:scale-95 text-white text-xs font-bold rounded-2xl shadow-sm transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Issue</span>
          </button>
        )}
      </div>

      {/* Tab Switcher: Issues vs Pull Requests */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl">
          <button
            id="tab-issues-btn"
            onClick={() => setActiveType('issues')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeType === 'issues'
                ? 'bg-[#0494f4] text-white shadow-sm'
                : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Issues</span>
          </button>

          <button
            id="tab-pulls-btn"
            onClick={() => setActiveType('pulls')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeType === 'pulls'
                ? 'bg-[#0494f4] text-white shadow-sm'
                : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Pull Requests</span>
          </button>
        </div>

        {/* State Filter */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] p-1 rounded-2xl text-xs">
          {(['open', 'closed', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStateFilter(st)}
              className={`px-3 py-1 rounded-xl capitalize font-medium transition ${
                stateFilter === st
                  ? 'bg-[#0494f4] text-white font-bold shadow-sm'
                  : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Filter ${activeType}...`}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl text-xs text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4]"
        />
      </div>

      {/* List content */}
      {loading ? (
        <div className="space-y-3 py-10 text-center">
          <div className="w-8 h-8 border-3 border-[#0494f4]/20 border-t-[#0494f4] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Loading from GitHub...</p>
        </div>
      ) : activeType === 'issues' ? (
        filteredIssues.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 space-y-2 shadow-sm">
            <AlertCircle className="w-10 h-10 text-[#80868b] mx-auto opacity-60" />
            <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">No issues found</h3>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">There are no {stateFilter} issues in this repository.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => setDetailItem(issue)}
                className="bg-white dark:bg-[#292a2d] hover:border-[#0494f4] dark:hover:border-[#0494f4] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 transition cursor-pointer shadow-sm flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {issue.state === 'open' ? (
                    <AlertCircle className="w-4 h-4 text-[#34a853] shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#0494f4] shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#202124] dark:text-[#e8eaed] truncate hover:text-[#0494f4] transition">
                      {issue.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-1 flex-wrap">
                      <span className="font-mono text-[#80868b]">#{issue.number}</span>
                      <span>opened by {issue.user.login}</span>
                      <span>• {new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>

                    {issue.labels && issue.labels.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {issue.labels.map((l) => (
                          <span
                            key={l.id}
                            style={{ backgroundColor: `#${l.color}22`, borderColor: `#${l.color}44`, color: `#${l.color}` }}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium border"
                          >
                            {l.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {issue.comments > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{issue.comments}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredPulls.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 space-y-2 shadow-sm">
          <GitPullRequest className="w-10 h-10 text-[#80868b] mx-auto opacity-60" />
          <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">No pull requests found</h3>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">There are no {stateFilter} PRs in this repository.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPulls.map((pr) => (
            <div
              key={pr.id}
              onClick={() => setDetailItem(pr)}
              className="bg-white dark:bg-[#292a2d] hover:border-[#0494f4] dark:hover:border-[#0494f4] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 transition cursor-pointer shadow-sm flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <GitPullRequest
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    pr.merged_at ? 'text-[#0494f4]' : pr.state === 'open' ? 'text-[#34a853]' : 'text-[#ea4335]'
                  }`}
                />
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-[#202124] dark:text-[#e8eaed] truncate hover:text-[#0494f4] transition">
                    {pr.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-1 flex-wrap font-mono">
                    <span className="text-[#80868b]">#{pr.number}</span>
                    <span className="text-[#0494f4]">{pr.head.ref}</span>
                    <span>→</span>
                    <span className="text-[#202124] dark:text-[#e8eaed]">{pr.base.ref}</span>
                  </div>
                </div>
              </div>

              <a
                href={pr.html_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* New Issue Modal */}
      {showNewIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0494f4]" />
                Create New Issue
              </h3>
              <button
                onClick={() => setShowNewIssueModal(false)}
                className="p-1 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed]">Title</label>
                <input
                  type="text"
                  required
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  placeholder="Issue title or bug description"
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed]">Description / Markdown</label>
                <textarea
                  rows={5}
                  value={newIssueBody}
                  onChange={(e) => setNewIssueBody(e.target.value)}
                  placeholder="Detailed information, steps to reproduce, or feature context..."
                  className="w-full px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewIssueModal(false)}
                  className="px-4 py-2 bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingIssue || !newIssueTitle.trim()}
                  className="px-5 py-2 bg-[#0494f4] hover:bg-[#0382d6] text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  {creatingIssue ? 'Creating...' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-[#0494f4]">#{detailItem.number}</span>
                <h3 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] mt-0.5">{detailItem.title}</h3>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[#f8f9fa] dark:bg-[#202124] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] text-xs text-[#202124] dark:text-[#e8eaed] whitespace-pre-wrap leading-relaxed">
              {detailItem.body || <span className="text-[#80868b] italic">No description provided.</span>}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#dadce0] dark:border-[#3c4043]">
              <a
                href={detailItem.html_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#0494f4] hover:underline flex items-center gap-1"
              >
                Open on GitHub <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {detailItem.state === 'open' && 'comments' in detailItem && (
                <button
                  onClick={() => handleCloseIssue(detailItem.number)}
                  className="px-3 py-1.5 bg-[#ea4335]/10 text-[#ea4335] hover:bg-[#ea4335]/20 border border-[#ea4335]/20 text-xs font-semibold rounded-xl transition"
                >
                  Close Issue
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
