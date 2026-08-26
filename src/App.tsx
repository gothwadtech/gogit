import React, { useState, useEffect } from 'react';
import { githubService } from './services/github';
import { GitHubUser, GitHubRepo, GitHubRateLimit } from './types/github';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { ReposTab } from './components/tabs/ReposTab';
import { CodebaseTab } from './components/tabs/CodebaseTab';
import { IssuesTab } from './components/tabs/IssuesTab';
import { GistsTab } from './components/tabs/GistsTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { ThemeProvider } from './context/ThemeContext';

function MainApp() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('repos');

  // Repositories & Active Selected Repo
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);

  // Rate Limit
  const [rateLimit, setRateLimit] = useState<GitHubRateLimit | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check initial token on startup
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    if (!githubService.hasToken()) {
      setLoadingAuth(false);
      return;
    }

    try {
      setLoadingAuth(true);
      const userData = await githubService.getAuthenticatedUser();
      setUser(userData);
      await loadInitialData();
    } catch {
      // Invalid or expired token
      githubService.setToken('');
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoadingRepos(true);
      const [repoList, limitData] = await Promise.all([
        githubService.getUserRepos({ per_page: 100, sort: 'updated' }),
        githubService.getRateLimit().catch(() => null),
      ]);

      setRepos(repoList);
      if (limitData) {
        setRateLimit(limitData.core);
      }

      // Auto-select first repo if none selected
      if (repoList.length > 0 && !selectedRepo) {
        setSelectedRepo(repoList[0]);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    try {
      setIsRefreshing(true);
      const [userData, repoList, limitData] = await Promise.all([
        githubService.getAuthenticatedUser(),
        githubService.getUserRepos({ per_page: 100, sort: 'updated' }),
        githubService.getRateLimit().catch(() => null),
      ]);
      setUser(userData);
      setRepos(repoList);
      if (limitData) {
        setRateLimit(limitData.core);
      }
      // If currently selected repo was updated, update reference
      if (selectedRepo) {
        const updated = repoList.find((r) => r.id === selectedRepo.id);
        if (updated) setSelectedRepo(updated);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    githubService.setToken('');
    setUser(null);
    setRepos([]);
    setSelectedRepo(null);
    setActiveTab('repos');
  };

  const handleSelectRepo = (repo: GitHubRepo, targetTab: 'codebase' | 'issues' = 'codebase') => {
    setSelectedRepo(repo);
    setActiveTab(targetTab);
  };

  const handleRepoCreated = (newRepo: GitHubRepo) => {
    setRepos((prev) => [newRepo, ...prev]);
    setSelectedRepo(newRepo);
    setActiveTab('codebase');
  };

  const handleRepoDeleted = (repoId: number) => {
    setRepos((prev) => {
      const updated = prev.filter((r) => r.id !== repoId);
      if (selectedRepo?.id === repoId) {
        setSelectedRepo(updated[0] || null);
      }
      return updated;
    });
  };

  // Loading Splash
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#202124] flex flex-col items-center justify-center p-4 space-y-3 transition-colors duration-200">
        <div className="w-10 h-10 border-3 border-[#0494f4]/20 border-t-[#0494f4] rounded-full animate-spin" />
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium tracking-wide">Connecting to GitHub...</p>
      </div>
    );
  }

  // If not authenticated, show PAT Onboarding & 1-click token creator
  if (!user) {
    return (
      <AuthScreen
        onSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          loadInitialData();
        }}
      />
    );
  }

  // Authenticated 5-Tab Application
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] flex flex-col selection:bg-[#0494f4]/20 selection:text-[#0494f4] transition-colors duration-200">
      {/* Top Header */}
      <Header
        user={user}
        activeRepo={selectedRepo}
        rateLimit={rateLimit}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onLogout={handleLogout}
        onOpenProfile={() => setActiveTab('profile')}
      />

      {/* Main Tab Screen Area */}
      <main className="flex-1 px-3 sm:px-5 pt-3 pb-24 max-w-7xl w-full mx-auto">
        {activeTab === 'repos' && (
          <ReposTab
            repos={repos}
            loading={loadingRepos}
            onSelectRepo={handleSelectRepo}
            onRepoCreated={handleRepoCreated}
            onRepoDeleted={handleRepoDeleted}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'codebase' && (
          <CodebaseTab
            repos={repos}
            selectedRepo={selectedRepo}
            onSelectRepo={(r) => setSelectedRepo(r)}
          />
        )}

        {activeTab === 'issues' && (
          <IssuesTab
            repos={repos}
            selectedRepo={selectedRepo}
            onSelectRepo={(r) => setSelectedRepo(r)}
          />
        )}

        {activeTab === 'gists' && (
          <GistsTab
            onSelectRepo={(r) => {
              setSelectedRepo(r);
              setActiveTab('codebase');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            rateLimit={rateLimit}
            onRefresh={handleRefresh}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Fixed Bottom Play Store 5-Tab Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasActiveRepo={Boolean(selectedRepo)}
        issuesCount={selectedRepo?.open_issues_count || 0}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
