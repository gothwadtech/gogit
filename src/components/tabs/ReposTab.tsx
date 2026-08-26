import React, { useState } from 'react';
import {
  Search,
  Plus,
  Lock,
  Globe,
  Star,
  GitFork,
  ExternalLink,
  Trash2,
  Code2,
  Clock,
  Layers,
  BookOpen,
  Filter,
} from 'lucide-react';
import { GitHubRepo } from '../../types/github';
import { githubService } from '../../services/github';
import { CreateRepoModal } from '../modals/CreateRepoModal';

interface ReposTabProps {
  repos: GitHubRepo[];
  loading: boolean;
  onSelectRepo: (repo: GitHubRepo, tab?: 'codebase' | 'issues') => void;
  onRepoCreated: (repo: GitHubRepo) => void;
  onRepoDeleted: (repoId: number) => void;
  onRefresh: () => void;
}

export const ReposTab: React.FC<ReposTabProps> = ({
  repos,
  loading,
  onSelectRepo,
  onRepoCreated,
  onRepoDeleted,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private' | 'forks'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name'>('updated');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filter repos
  const filteredRepos = repos
    .filter((repo) => {
      const matchSearch =
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (repo.language && repo.language.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (filterType === 'public') return !repo.private;
      if (filterType === 'private') return repo.private;
      if (filterType === 'forks') return repo.fork;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const handleDeleteRepo = async (repo: GitHubRepo, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `⚠️ ARE YOU SURE you want to permanently delete "${repo.full_name}" from GitHub?\n\nThis action CANNOT be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(repo.id);
      await githubService.deleteRepo(repo.owner.login, repo.name);
      onRepoDeleted(repo.id);
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to delete repository. Check if your PAT has "delete_repo" permission.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto">
      {/* Top Action & Search Bar */}
      <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors duration-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]" />
          <input
            id="search-repos-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repositories by name, language, or description..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl text-xs sm:text-sm text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4]"
          />
        </div>

        <button
          id="create-repo-modal-open-btn"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0494f4] hover:bg-[#0382d6] active:scale-95 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Repository</span>
        </button>
      </div>

      {/* Filter Tabs & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] p-1 rounded-2xl text-xs">
          {(['all', 'public', 'private', 'forks'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl capitalize font-medium transition ${
                filterType === type
                  ? 'bg-[#0494f4] text-white font-bold shadow-sm'
                  : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] px-3 py-1 rounded-2xl text-xs">
          <Filter className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />
          <span className="text-[#5f6368] dark:text-[#9aa0a6]">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-[#202124] dark:text-[#e8eaed] font-semibold focus:outline-none cursor-pointer"
          >
            <option value="updated" className="bg-white dark:bg-[#292a2d]">Recently Updated</option>
            <option value="stars" className="bg-white dark:bg-[#292a2d]">Most Stars</option>
            <option value="name" className="bg-white dark:bg-[#292a2d]">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Repos Grid */}
      {loading ? (
        <div className="space-y-3 py-12 text-center">
          <div className="w-8 h-8 border-3 border-[#0494f4]/20 border-t-[#0494f4] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Fetching repositories from GitHub...</p>
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 space-y-3">
          <BookOpen className="w-12 h-12 text-[#80868b] mx-auto opacity-60" />
          <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed]">No repositories found</h3>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-sm mx-auto">
            {searchQuery ? `No results match "${searchQuery}"` : 'You do not have any repositories in this filter.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0494f4] hover:bg-[#0382d6] text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Create First Repository
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              onClick={() => onSelectRepo(repo, 'codebase')}
              className="bg-white dark:bg-[#292a2d] hover:border-[#0494f4] dark:hover:border-[#0494f4] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 transition cursor-pointer flex flex-col justify-between group"
            >
              {/* Header Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {repo.private ? (
                        <span className="p-1 bg-[#ea4335]/10 text-[#ea4335] rounded-lg shrink-0" title="Private Repository">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="p-1 bg-[#34a853]/10 text-[#34a853] rounded-lg shrink-0" title="Public Repository">
                          <Globe className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[#0494f4] transition truncate">
                        {repo.name}
                      </h3>
                      {repo.fork && (
                        <span className="px-1.5 py-0.5 bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] text-[10px] font-semibold rounded-md">
                          Fork
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1.5 line-clamp-2 leading-relaxed">
                      {repo.description || <span className="italic text-[#80868b]">No description provided</span>}
                    </p>
                  </div>

                  {/* GitHub External link */}
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#0494f4] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded-xl transition"
                    title="Open on GitHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Tags & Metadata */}
                <div className="flex items-center gap-3 text-xs text-[#5f6368] dark:text-[#9aa0a6] flex-wrap pt-1">
                  {repo.language && (
                    <span className="flex items-center gap-1 font-medium text-[#202124] dark:text-[#e8eaed]">
                      <span className="w-2 h-2 rounded-full bg-[#0494f4]" />
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-[#fbbc04]" />
                    {repo.stargazers_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5" />
                    {repo.forks_count}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-[#80868b]">
                    <Clock className="w-3 h-3" />
                    {new Date(repo.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Bottom Quick Action Buttons */}
              <div className="pt-2 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRepo(repo, 'codebase');
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-[#0494f4] hover:underline"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>View Code & ZIP</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRepo(repo, 'issues');
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]"
                  >
                    <span>Issues ({repo.open_issues_count})</span>
                  </button>
                </div>

                <button
                  onClick={(e) => handleDeleteRepo(repo, e)}
                  disabled={deletingId === repo.id}
                  title="Delete Repository"
                  className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#ea4335] hover:bg-[#ea4335]/10 rounded-xl transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Repo Modal */}
      <CreateRepoModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={onRepoCreated}
      />
    </div>
  );
};
