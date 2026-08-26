import React from 'react';

export type TabType = 'repos' | 'codebase' | 'issues' | 'gists' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasActiveRepo: boolean;
  issuesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  hasActiveRepo,
  issuesCount = 0,
}) => {
  const navItems: Array<{
    id: TabType;
    label: string;
    badge?: number | string;
    svg: (active: boolean) => React.ReactNode;
  }> = [
    {
      id: 'repos',
      label: 'Repos',
      svg: (active) => (
        <svg
          className="w-5 h-5 transition-transform"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? '2.4' : '1.8'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
          <path d="M6 14h6" />
        </svg>
      ),
    },
    {
      id: 'codebase',
      label: 'Code',
      badge: hasActiveRepo ? '●' : undefined,
      svg: (active) => (
        <svg
          className="w-5 h-5 transition-transform"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? '2.4' : '1.8'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <path d="M12 2v4" />
          <path d="M12 18v4" />
        </svg>
      ),
    },
    {
      id: 'issues',
      label: 'Issues',
      badge: issuesCount > 0 ? issuesCount : undefined,
      svg: (active) => (
        <svg
          className="w-5 h-5 transition-transform"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? '2.4' : '1.8'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="18" r="3" />
          <circle cx="6" cy="6" r="3" />
          <path d="M13 6h3a2 2 0 0 1 2 2v7" />
          <line x1="6" y1="9" x2="6" y2="21" />
        </svg>
      ),
    },
    {
      id: 'gists',
      label: 'Gists',
      svg: (active) => (
        <svg
          className="w-5 h-5 transition-transform"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={active ? '1.5' : '1.8'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      svg: (active) => (
        <svg
          className="w-5 h-5 transition-transform"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? '2.4' : '1.8'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Play Store Style Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-t border-[#dadce0] dark:border-[#3c4043] pb-safe shadow-lg transition-colors duration-200"
    >
      <div className="max-w-md sm:max-w-lg md:max-w-xl mx-auto flex items-center justify-around px-2 pt-2 pb-1.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`tab-btn-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center flex-1 transition-all duration-200 group active:scale-95 cursor-pointer py-0.5"
            >
              {/* Play Store Active Pill Indicator */}
              <div
                className={`relative w-14 sm:w-16 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-[#0494f4]/15 dark:bg-[#0494f4]/25 text-[#0494f4]'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {item.svg(isActive)}

                {/* Badge Container */}
                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-0.5 right-2 text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight flex items-center justify-center ${
                      item.badge === '●'
                        ? 'text-[#0494f4] text-xs'
                        : 'bg-[#0494f4] text-white min-w-4 h-4 text-[10px]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Short Label (Play Store standard: 11px font) */}
              <span
                className={`text-[11px] tracking-tight mt-1 truncate max-w-[64px] leading-none transition-colors duration-200 ${
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
