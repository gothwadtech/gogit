import React from 'react';
import {
  FolderGit2,
  Code2,
  GitPullRequest,
  AlertCircle,
  Compass,
  User,
} from 'lucide-react';
import { GitHubUser } from '../types/github';

export type TabType = 'repos' | 'codebase' | 'pulls' | 'issues' | 'explore' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasActiveRepo?: boolean;
  issuesCount?: number;
  user?: GitHubUser | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  issuesCount = 0,
}) => {
  const navItems: Array<{
    id: TabType;
    label: string;
    badge?: number | string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'repos',
      label: 'Repos',
      icon: FolderGit2,
    },
    {
      id: 'codebase',
      label: 'Code',
      icon: Code2,
    },
    {
      id: 'pulls',
      label: 'Pulls',
      icon: GitPullRequest,
    },
    {
      id: 'issues',
      label: 'Issues',
      badge: issuesCount > 0 ? issuesCount : undefined,
      icon: AlertCircle,
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: Compass,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-t border-x border-[#dadce0] dark:border-[#3c4043] rounded-t-2xl sm:rounded-t-3xl pb-safe shadow-xl transition-colors duration-200"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-1.5 min-h-[56px] sm:min-h-[60px]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`tab-btn-${item.id}`}
              onClick={() => onTabChange(item.id)}
              type="button"
              className="flex flex-col items-center justify-center flex-1 cursor-pointer py-0.5 px-0.5 min-w-0 select-none group"
            >
              {/* Stable Pill Container */}
              <div
                className={`relative w-12 sm:w-14 h-7 sm:h-7.5 rounded-full flex items-center justify-center transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#0494f4]/15 dark:bg-[#0494f4]/25 text-[#0494f4]'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />

                {/* Numeric Badge (e.g. Issues Count) */}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-0.5 bg-[#ea4335] text-white min-w-4 h-4 text-[9px] font-bold px-1 rounded-full flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10.5px] sm:text-[11px] tracking-tight mt-0.5 truncate max-w-[58px] sm:max-w-[70px] leading-tight transition-colors duration-150 ${
                  isActive
                    ? 'text-[#0494f4] font-bold'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
