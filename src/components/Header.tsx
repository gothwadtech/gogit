import React, { useState, useRef, useEffect } from 'react';
import {
  Github,
  RefreshCw,
  LogOut,
  Settings,
  Database,
  ChevronDown,
  FolderGit2,
  Check,
  Search,
} from 'lucide-react';
import { GitHubUser, GitHubRateLimit, GitHubRepo } from '../types/github';

interface HeaderProps {
  user: GitHubUser | null;
  activeRepo: GitHubRepo | null;
  repos?: GitHubRepo[];
  onSelectRepo?: (repo: GitHubRepo) => void;
  rateLimit: GitHubRateLimit | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLogout: () => void;
  onOpenProfile?: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeRepo,
  repos = [],
  onSelectRepo,
  rateLimit,
  onRefresh,
  isRefreshing,
  onLogout,
  onOpenSettings,
}) => {
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRepoDropdown(false);
      }
    };
    if (showRepoDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRepoDropdown]);

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-40 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] rounded-b-2xl sm:rounded-b-3xl px-3 sm:px-6 h-[56px] sm:h-[60px] flex items-center transition-colors duration-200 shadow-xs"
    >
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-3">
        {/* Left Side: Branding / Repository Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#0494f4] text-white shrink-0 flex items-center justify-center shadow-xs">
              <Github className="w-4.5 h-4.5 text-white" />
            </div>

            <div className="min-w-0 flex items-center gap-2">
              <div className="flex flex-col min-w-0 relative" ref={dropdownRef}>
                {/* Brand Title */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-[#202124] dark:text-[#e8eaed] tracking-tight truncate">
                    Gothwad GoGit Repo
                  </span>
                </div>

                {/* Subtitle / Active Repo Switcher with same font style and trailing arrow */}
                {activeRepo ? (
                  <div className="flex items-center min-w-0">
                    <button
                      type="button"
                      id="header-repo-switcher-btn"
                      onClick={() => setShowRepoDropdown(!showRepoDropdown)}
                      className="flex items-center gap-1 text-xs sm:text-sm font-bold text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#0494f4] dark:hover:text-[#0494f4] tracking-tight truncate cursor-pointer transition-colors max-w-[200px] sm:max-w-[280px]"
                      title="Switch Repository"
                    >
                      <span className="truncate">{activeRepo.name}</span>
                      <span className="text-[#80868b] font-normal px-0.5">·</span>
                      <span className="text-[#5f6368] dark:text-[#9aa0a6] font-semibold shrink-0">
                        {activeRepo.default_branch}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6] shrink-0 ml-0.5 transition-transform duration-200 ${
                          showRepoDropdown ? 'rotate-180 text-[#0494f4]' : ''
                        }`}
                      />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm font-bold text-[#5f6368] dark:text-[#9aa0a6] tracking-tight">
                    Developer Studio
                  </span>
                )}

                {/* Repository Switcher Dropdown */}
                {showRepoDropdown && repos.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-64 sm:w-72 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl">
                      <Search className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />
                      <input
                        type="text"
                        placeholder="Search repository..."
                        value={repoSearch}
                        onChange={(e) => setRepoSearch(e.target.value)}
                        className="w-full bg-transparent text-xs text-[#202124] dark:text-[#e8eaed] placeholder-[#80868b] focus:outline-none"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-[#dadce0]/50 dark:divide-[#3c4043]/50">
                      {filteredRepos.length === 0 ? (
                        <div className="py-3 text-center text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                          No repositories found
                        </div>
                      ) : (
                        filteredRepos.map((r) => {
                          const isSelected = activeRepo?.id === r.id;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                onSelectRepo?.(r);
                                setShowRepoDropdown(false);
                                setRepoSearch('');
                              }}
                              className={`w-full px-2.5 py-2 flex items-center justify-between text-left rounded-xl text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0494f4]/15 text-[#0494f4] font-bold'
                                  : 'text-[#202124] dark:text-[#e8eaed] hover:bg-[#f1f3f4] dark:hover:bg-[#303134]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <FolderGit2
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSelected ? 'text-[#0494f4]' : 'text-[#5f6368] dark:text-[#9aa0a6]'
                                  }`}
                                />
                                <span className="truncate">{r.name}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#0494f4] shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Rate Quota, Refresh, Settings, Logout (No avatar in header) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Rate Quota Indicator */}
          {rateLimit && (
            <div
              title={`API Quota: ${rateLimit.remaining}/${rateLimit.limit} requests`}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-[11px] font-mono text-[#5f6368] dark:text-[#9aa0a6]"
            >
              <Database className="w-3.5 h-3.5 text-[#0494f4]" />
              <span className="font-semibold text-[#202124] dark:text-[#e8eaed]">
                {rateLimit.remaining.toLocaleString()}
              </span>
              <span className="text-[#80868b]">/ {rateLimit.limit}</span>
            </div>
          )}

          {/* Refresh Data */}
          <button
            id="header-refresh-btn"
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh repository data"
            className="w-9 h-9 flex items-center justify-center bg-[#f8f9fa] dark:bg-[#292a2d] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#202124] dark:text-[#e8eaed] border border-[#dadce0] dark:border-[#3c4043] rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-[#0494f4] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Settings Modal Toggle */}
          <button
            id="header-settings-btn"
            type="button"
            onClick={onOpenSettings}
            title="Studio Settings"
            className="w-9 h-9 flex items-center justify-center bg-[#f8f9fa] dark:bg-[#292a2d] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#202124] dark:text-[#e8eaed] border border-[#dadce0] dark:border-[#3c4043] rounded-xl transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#0494f4] transition-colors" />
          </button>

          {/* Logout Button */}
          {user && (
            <button
              id="header-logout-btn"
              type="button"
              onClick={onLogout}
              title="Disconnect PAT"
              className="w-9 h-9 flex items-center justify-center text-[#80868b] hover:text-[#ea4335] hover:bg-[#ea4335]/10 rounded-xl border border-[#dadce0] dark:border-[#3c4043] sm:border-transparent transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
