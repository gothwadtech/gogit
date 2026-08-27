import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  Star,
  GitFork,
  Flame,
  Activity,
  Code2,
  ExternalLink,
  RefreshCw,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';
import { GitHubRepo } from '../../types/github';
import { githubService } from '../../services/github';

interface ExploreTabProps {
  onSelectRepoToExplore: (repo: GitHubRepo) => void;
}

const LANGUAGES = [
  { id: 'all', label: 'All Languages' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
  { id: 'cpp', label: 'C++' },
];

export const ExploreTab: React.FC<ExploreTabProps> = ({ onSelectRepoToExplore }) => {
  const [activeLang, setActiveLang] = useState('all');
  const [trendingRepos, setTrendingRepos] = useState<GitHubRepo[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GitHubRepo[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [starredIds, setStarredIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadTrending();
  }, [activeLang]);

  const loadTrending = async () => {
    try {
      setLoadingTrending(true);
      const items = await githubService.getTrendingRepositories(activeLang);
      setTrendingRepos(items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTrending(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      setSearching(true);
      const res = await githubService.searchRepositories(searchQuery.trim());
      setSearchResults(res.items || []);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleToggleStar = async (repo: GitHubRepo, e: React.MouseEvent) => {
    e.stopPropagation();
    const isStarred = starredIds.has(repo.id);
    try {
      if (isStarred) {
        await githubService.unstarRepo(repo.owner.login, repo.name);
        setStarredIds((prev) => {
          const next = new Set(prev);
          next.delete(repo.id);
          return next;
        });
      } else {
        await githubService.starRepo(repo.owner.login, repo.name);
        setStarredIds((prev) => {
          const next = new Set(prev);
          next.add(repo.id);
          return next;
        });
      }
    } catch (err: any) {
      alert(`Star action failed: ${err.message}`);
    }
  };

  const displayList = searchResults !== null ? searchResults : trendingRepos;

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto">
      {/* Top Hero & Search Bar */}
      <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0494f4]/15 text-[#0494f4] rounded-2xl">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed]">
                Explore GitHub Universe
              </h2>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                Discover trending open-source repositories and explore global code
              </p>
            </div>
          </div>
        </div>

        {/* Global Search Box */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all of GitHub for repositories, frameworks, tools..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl text-xs text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4]"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 bg-[#0494f4] hover:bg-[#0382d6] active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-sm transition cursor-pointer shrink-0"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
          {searchResults !== null && (
            <button
              type="button"
              onClick={() => {
                setSearchResults(null);
                setSearchQuery('');
              }}
              className="px-3.5 py-2.5 bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] text-xs font-semibold rounded-2xl border border-[#dadce0] dark:border-[#3c4043] transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </form>

        {/* Language Category Chips */}
        {searchResults === null && (
          <div className="pt-2 border-t border-[#dadce0]/60 dark:border-[#3c4043]/60 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <div className="flex items-center gap-1 text-[#fbbc04] font-bold text-xs shrink-0 pr-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Trending:</span>
            </div>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setActiveLang(lang.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeLang === lang.id
                    ? 'bg-[#0494f4] text-white shadow-xs'
                    : 'bg-[#f8f9fa] dark:bg-[#202124] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] border border-[#dadce0]/80 dark:border-[#3c4043]'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Repositories Display */}
      {loadingTrending || searching ? (
        <div className="p-12 text-center text-xs text-[#5f6368] dark:text-[#9aa0a6] space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0494f4]" />
          <p>{searching ? 'Searching GitHub...' : 'Loading trending repositories...'}</p>
        </div>
      ) : displayList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayList.map((repo) => {
            const isStarred = starredIds.has(repo.id);

            return (
              <div
                key={repo.id}
                onClick={() => onSelectRepoToExplore(repo)}
                className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] rounded-3xl p-5 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3.5 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={repo.owner.avatar_url}
                        alt={repo.owner.login}
                        className="w-8 h-8 rounded-xl object-cover border border-[#dadce0] dark:border-[#3c4043]"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] block truncate">
                          {repo.owner.login}
                        </span>
                        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[#0494f4] transition truncate">
                          {repo.name}
                        </h3>
                      </div>
                    </div>

                    {/* Star Button */}
                    <button
                      onClick={(e) => handleToggleStar(repo, e)}
                      title={isStarred ? 'Starred' : 'Star repo'}
                      className={`p-2 rounded-xl border transition cursor-pointer ${
                        isStarred
                          ? 'bg-[#fbbc04]/15 border-[#fbbc04]/40 text-[#fbbc04]'
                          : 'bg-[#f8f9fa] dark:bg-[#202124] border-[#dadce0] dark:border-[#3c4043] text-[#80868b] hover:text-[#fbbc04]'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-[#fbbc04]' : ''}`} />
                    </button>
                  </div>

                  <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] line-clamp-2 leading-relaxed">
                    {repo.description || 'No description provided.'}
                  </p>
                </div>

                {/* Topics & Meta stats */}
                <div className="space-y-2.5 pt-2 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50">
                  <div className="flex items-center justify-between text-xs text-[#5f6368] dark:text-[#9aa0a6] flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {repo.language && (
                        <span className="flex items-center gap-1 font-semibold text-[#202124] dark:text-[#e8eaed]">
                          <span className="w-2 h-2 rounded-full bg-[#0494f4]" />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-mono">
                        <Star className="w-3 h-3 text-[#fbbc04]" /> {repo.stargazers_count.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <GitFork className="w-3 h-3" /> {repo.forks_count.toLocaleString()}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-[#0494f4] group-hover:underline">
                      Open in Studio →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-10 text-center space-y-2">
          <Compass className="w-8 h-8 text-[#80868b] mx-auto" />
          <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">No Repositories Found</h3>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            Try searching for a different keyword or choose another language.
          </p>
        </div>
      )}
    </div>
  );
};
