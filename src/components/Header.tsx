import React, { useState, useRef, useEffect } from 'react';
import { Github, RefreshCw, LogOut, ShieldCheck, Database, Layers, Sun, Moon, Laptop } from 'lucide-react';
import { GitHubUser, GitHubRateLimit, GitHubRepo } from '../types/github';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface HeaderProps {
  user: GitHubUser | null;
  activeRepo: GitHubRepo | null;
  rateLimit: GitHubRateLimit | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLogout: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeRepo,
  rateLimit,
  onRefresh,
  isRefreshing,
  onLogout,
  onOpenProfile,
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close theme menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] px-3 sm:px-5 py-2.5 transition-colors duration-200 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Active Repo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-2xl bg-[#0494f4] text-white shrink-0 flex items-center justify-center shadow-xs">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-[#202124] dark:text-[#e8eaed] truncate">
                Gothwad Github
              </h1>
              <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 bg-[#0494f4]/10 text-[#0494f4] text-[10px] font-bold rounded-full border border-[#0494f4]/20">
                <ShieldCheck className="w-3 h-3" /> Full PAT
              </span>
            </div>
            {activeRepo ? (
              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] font-mono flex items-center gap-1 truncate">
                <Layers className="w-3 h-3 text-[#0494f4] shrink-0" />
                <span className="truncate text-[#202124] dark:text-[#e8eaed] font-medium">{activeRepo.name}</span>
                <span className="text-[#80868b]">({activeRepo.default_branch})</span>
              </p>
            ) : (
              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] truncate">Mobile GitHub Studio</p>
            )}
          </div>
        </div>

        {/* Right side actions & profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Rate limit status pill */}
          {rateLimit && (
            <div
              title={`GitHub API Rate Limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`}
              className="hidden xs:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f1f3f4] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-[11px] text-[#202124] dark:text-[#e8eaed] font-mono"
            >
              <Database className="w-3 h-3 text-[#0494f4]" />
              <span>{rateLimit.remaining.toLocaleString()}</span>
              <span className="text-[#80868b]">/ {rateLimit.limit}</span>
            </div>
          )}

          {/* Theme Mode Toggle Dropdown */}
          <div className="relative" ref={themeMenuRef}>
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              title={`Current theme: ${theme} (${isDark ? 'Dark' : 'Light'})`}
              className="p-2 bg-[#f1f3f4] dark:bg-[#292a2d] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-[#202124] dark:text-[#e8eaed] border border-[#dadce0] dark:border-[#3c4043] rounded-xl transition cursor-pointer"
            >
              {theme === 'system' ? (
                <Laptop className="w-4 h-4 text-[#0494f4]" />
              ) : isDark ? (
                <Moon className="w-4 h-4 text-[#0494f4]" />
              ) : (
                <Sun className="w-4 h-4 text-[#0494f4]" />
              )}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-xl py-1.5 z-50 text-xs text-[#202124] dark:text-[#e8eaed]">
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    setShowThemeMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition cursor-pointer ${
                    theme === 'light' ? 'text-[#0494f4] font-bold' : ''
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light Theme</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    setShowThemeMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition cursor-pointer ${
                    theme === 'dark' ? 'text-[#0494f4] font-bold' : ''
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark Theme</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTheme('system');
                    setShowThemeMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition cursor-pointer ${
                    theme === 'system' ? 'text-[#0494f4] font-bold' : ''
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>System Auto</span>
                </button>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            id="header-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh current data"
            className="p-2 bg-[#f1f3f4] dark:bg-[#292a2d] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] active:scale-95 text-[#202124] dark:text-[#e8eaed] border border-[#dadce0] dark:border-[#3c4043] rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-[#0494f4] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* User Profile Avatar / Logout */}
          {user && (
            <div className="flex items-center gap-1 sm:gap-1.5 pl-1">
              <button
                id="header-user-avatar-btn"
                onClick={onOpenProfile}
                className="relative group p-0.5 rounded-xl border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] transition cursor-pointer"
                title={`Logged in as ${user.login} (${user.name || ''})`}
              >
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="w-7 h-7 rounded-[10px] object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#34a853] border border-white dark:border-[#202124] rounded-full" />
              </button>

              <button
                id="header-logout-btn"
                onClick={onLogout}
                title="Disconnect PAT / Switch Account"
                className="p-2 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#ea4335] hover:bg-[#ea4335]/10 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
