import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Shield,
  Key,
  Database,
  ExternalLink,
  LogOut,
  Building,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Star,
  Users,
  Code2,
  Plus,
  Trash2,
  FileCode,
  X,
} from 'lucide-react';
import { GitHubUser, GitHubRateLimit, GitHubOrg, GitHubGist, GitHubRepo } from '../../types/github';
import { githubService } from '../../services/github';

interface ProfileViewProps {
  user: GitHubUser;
  rateLimit: GitHubRateLimit | null;
  onClose?: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  onSelectRepo?: (repo: GitHubRepo) => void;
  isTabMode?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  rateLimit,
  onClose,
  onLogout,
  onRefresh,
  onSelectRepo,
  isTabMode = false,
}) => {
  const [newToken, setNewToken] = useState('');
  const [updatingToken, setUpdatingToken] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orgs, setOrgs] = useState<GitHubOrg[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Gists & Starred state within Profile
  const [gistsSubTab, setGistsSubTab] = useState<'gists' | 'starred'>('gists');
  const [gists, setGists] = useState<GitHubGist[]>([]);
  const [starredRepos, setStarredRepos] = useState<GitHubRepo[]>([]);
  const [loadingGists, setLoadingGists] = useState(false);

  // Create Gist Modal
  const [showNewGistModal, setShowNewGistModal] = useState(false);
  const [gistFilename, setGistFilename] = useState('snippet.js');
  const [gistDescription, setGistDescription] = useState('');
  const [gistContent, setGistContent] = useState('');
  const [gistIsPublic, setGistIsPublic] = useState(true);
  const [creatingGist, setCreatingGist] = useState(false);

  useEffect(() => {
    loadOrgs();
    loadGistsAndStarred();
  }, [gistsSubTab]);

  const loadOrgs = async () => {
    try {
      setLoadingOrgs(true);
      const data = await githubService.getUserOrgs();
      setOrgs(data || []);
    } catch {
      // ignore
    } finally {
      setLoadingOrgs(false);
    }
  };

  const loadGistsAndStarred = async () => {
    try {
      setLoadingGists(true);
      if (gistsSubTab === 'gists') {
        const list = await githubService.getUserGists();
        setGists(list);
      } else {
        const starred = await githubService.getStarredRepos();
        setStarredRepos(starred);
      }
    } catch {
      // ignore
    } finally {
      setLoadingGists(false);
    }
  };

  const handleCreateGist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gistFilename.trim() || !gistContent.trim()) return;

    try {
      setCreatingGist(true);
      await githubService.createGist({
        description: gistDescription.trim(),
        public: gistIsPublic,
        files: {
          [gistFilename.trim()]: {
            content: gistContent,
          },
        },
      });
      setShowNewGistModal(false);
      setGistFilename('snippet.js');
      setGistDescription('');
      setGistContent('');
      loadGistsAndStarred();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create gist');
    } finally {
      setCreatingGist(false);
    }
  };

  const handleDeleteGist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this Gist?')) return;
    try {
      await githubService.deleteGist(id);
      setGists((prev) => prev.filter((g) => g.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete gist');
    }
  };

  const handleUnstarRepo = async (repo: GitHubRepo, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await githubService.unstarRepo(repo.owner.login, repo.name);
      setStarredRepos((prev) => prev.filter((r) => r.id !== repo.id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to unstar');
    }
  };

  const handleUpdateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim()) return;

    try {
      setUpdatingToken(true);
      setUpdateMsg(null);
      githubService.setToken(newToken.trim());
      await githubService.getAuthenticatedUser();
      setUpdateMsg({ type: 'success', text: 'Token validated & updated successfully! Reloading studio...' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      setUpdateMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Invalid GitHub PAT token',
      });
    } finally {
      setUpdatingToken(false);
    }
  };

  const rateRemaining = rateLimit?.remaining ?? 5000;
  const rateTotal = rateLimit?.limit ?? 5000;
  const ratePercentage = Math.round((rateRemaining / rateTotal) * 100);

  const containerClasses = isTabMode
    ? 'space-y-5 pb-16 max-w-4xl mx-auto'
    : 'fixed inset-0 z-50 bg-[#f8f9fa] dark:bg-[#202124] overflow-y-auto transition-colors duration-200';

  return (
    <div className={containerClasses}>
      {/* Top Header with Back Navigation (only when modal) */}
      {!isTabMode && (
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] rounded-b-2xl sm:rounded-b-3xl px-4 sm:px-6 py-3 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {onClose && (
                <button
                  onClick={onClose}
                  id="close-profile-view-btn"
                  className="p-2 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#202124] dark:text-[#e8eaed] rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
              <div className="h-5 w-px bg-[#dadce0] dark:border-[#3c4043]" />
              <h2 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
                <User className="w-4 h-4 text-[#0494f4]" />
                <span>GitHub Account Profile</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={user.html_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-[#f1f3f4] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-[#202124] dark:text-[#e8eaed] text-xs font-semibold rounded-xl border border-[#dadce0] dark:border-[#3c4043] transition cursor-pointer"
              >
                <span>GitHub Web</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Profile Content */}
      <main className={`max-w-4xl mx-auto ${isTabMode ? 'space-y-5' : 'p-4 sm:p-6 space-y-5 pb-16'}`}>
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 sm:p-7 shadow-sm space-y-6 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="relative">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-[#0494f4] shadow-md"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#34a853] border-2 border-white dark:border-[#292a2d] rounded-full" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] dark:text-[#e8eaed] tracking-tight">
                    {user.name || user.login}
                  </h1>
                  <p className="text-sm font-mono text-[#0494f4] font-semibold">@{user.login}</p>
                </div>

                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f3f4] dark:bg-[#202124] hover:bg-[#e8eaed] dark:hover:bg-[#303134] text-[#202124] dark:text-[#e8eaed] text-xs font-semibold rounded-xl border border-[#dadce0] dark:border-[#3c4043] transition cursor-pointer self-center sm:self-start"
                >
                  <span>View on GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#0494f4]" />
                </a>
              </div>

              {user.bio && (
                <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-xl leading-relaxed">
                  {user.bio}
                </p>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-[#5f6368] dark:text-[#9aa0a6] pt-1 flex-wrap">
                {user.company && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-[#0494f4]" /> {user.company}
                  </span>
                )}
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#ea4335]" /> {user.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#34a853]" /> Joined{' '}
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-3.5 text-center">
              <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] block">Public Repos</span>
              <span className="text-xl font-bold text-[#202124] dark:text-[#e8eaed] font-mono">
                {user.public_repos}
              </span>
            </div>

            <div className="bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-3.5 text-center">
              <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] block">Private Repos</span>
              <span className="text-xl font-bold text-[#202124] dark:text-[#e8eaed] font-mono">
                {user.total_private_repos ?? 'Full PAT'}
              </span>
            </div>

            <div className="bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-3.5 text-center">
              <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] block">Followers</span>
              <span className="text-xl font-bold text-[#202124] dark:text-[#e8eaed] font-mono">
                {user.followers}
              </span>
            </div>

            <div className="bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-3.5 text-center">
              <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] block">Following</span>
              <span className="text-xl font-bold text-[#202124] dark:text-[#e8eaed] font-mono">
                {user.following}
              </span>
            </div>
          </div>
        </div>

        {/* Integrated Gists & Starred Repositories Section */}
        <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-sm space-y-4 transition-colors duration-200">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl">
              <button
                onClick={() => setGistsSubTab('gists')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  gistsSubTab === 'gists'
                    ? 'bg-[#0494f4] text-white shadow-xs'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>My Gists ({gists.length})</span>
              </button>

              <button
                onClick={() => setGistsSubTab('starred')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  gistsSubTab === 'starred'
                    ? 'bg-[#0494f4] text-white shadow-xs'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-[#fbbc04]" />
                <span>Starred ({starredRepos.length})</span>
              </button>
            </div>

            {gistsSubTab === 'gists' && (
              <button
                onClick={() => setShowNewGistModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0494f4] hover:bg-[#0382d6] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Gist</span>
              </button>
            )}
          </div>

          {loadingGists ? (
            <div className="py-8 text-center text-xs text-[#5f6368] dark:text-[#9aa0a6]">
              <div className="w-6 h-6 border-2 border-[#0494f4]/20 border-t-[#0494f4] rounded-full animate-spin mx-auto mb-2" />
              Loading {gistsSubTab}...
            </div>
          ) : gistsSubTab === 'gists' ? (
            gists.length === 0 ? (
              <div className="text-center py-10 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 space-y-2">
                <Code2 className="w-8 h-8 text-[#80868b] mx-auto opacity-60" />
                <h4 className="text-xs font-bold text-[#202124] dark:text-[#e8eaed]">No Gists created yet</h4>
                <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                  Share code snippets, notes, and configs easily with Gists.
                </p>
                <button
                  onClick={() => setShowNewGistModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0494f4] hover:bg-[#0382d6] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Gist
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gists.map((gist) => {
                  const fileKeys = Object.keys(gist.files);
                  const firstFile = gist.files[fileKeys[0]];
                  return (
                    <div
                      key={gist.id}
                      className="bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between hover:border-[#0494f4] transition"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <FileCode className="w-3.5 h-3.5 text-[#0494f4] shrink-0" />
                              <h5 className="text-xs font-bold text-[#202124] dark:text-[#e8eaed] truncate">
                                {firstFile?.filename || 'Untitled Gist'}
                              </h5>
                              <span
                                className={`px-2 py-0.2 rounded-full text-[9.5px] font-semibold border ${
                                  gist.public
                                    ? 'bg-[#0494f4]/10 text-[#0494f4] border-[#0494f4]/20'
                                    : 'bg-[#dadce0]/50 dark:bg-[#3c4043]/50 text-[#5f6368] dark:text-[#9aa0a6] border-transparent'
                                }`}
                              >
                                {gist.public ? 'Public' : 'Secret'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] line-clamp-1 mt-0.5">
                              {gist.description || 'No description'}
                            </p>
                          </div>

                          <a
                            href={gist.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#0494f4]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50 flex items-center justify-between text-[10.5px]">
                        <a
                          href={firstFile?.raw_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0494f4] hover:underline font-mono"
                        >
                          Raw View
                        </a>
                        <button
                          onClick={(e) => handleDeleteGist(gist.id, e)}
                          className="p-1 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#ea4335]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : starredRepos.length === 0 ? (
            <div className="text-center py-10 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 space-y-1">
              <Star className="w-8 h-8 text-[#80868b] mx-auto opacity-60" />
              <h4 className="text-xs font-bold text-[#202124] dark:text-[#e8eaed]">No starred repositories</h4>
              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">You haven't starred any repositories on GitHub yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {starredRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between hover:border-[#0494f4] transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#0494f4] shrink-0" />
                          <h5 className="text-xs font-bold text-[#202124] dark:text-[#e8eaed] truncate">{repo.full_name}</h5>
                        </div>
                        <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] line-clamp-1 mt-0.5">{repo.description}</p>
                      </div>
                      <a href={repo.html_url} target="_blank" rel="noreferrer" className="p-1 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#0494f4]">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50 flex items-center justify-between text-[11px]">
                    {onSelectRepo ? (
                      <button
                        onClick={() => onSelectRepo(repo)}
                        className="text-[#0494f4] font-semibold hover:underline cursor-pointer"
                      >
                        Explore Codebase →
                      </button>
                    ) : (
                      <span className="text-[#5f6368] dark:text-[#9aa0a6] font-mono">{repo.language || 'Code'}</span>
                    )}
                    <button
                      onClick={(e) => handleUnstarRepo(repo, e)}
                      className="px-2 py-0.5 bg-white dark:bg-[#292a2d] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#fbbc04] text-[10.5px] rounded-lg border border-[#dadce0] dark:border-[#3c4043] flex items-center gap-1 cursor-pointer"
                    >
                      <Star className="w-2.5 h-2.5 text-[#fbbc04] fill-[#fbbc04]" />
                      <span>Unstar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Organizations Section */}
        <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-sm space-y-4 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0494f4]" />
            <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed]">
              Organizations & Teams
            </h3>
          </div>

          {loadingOrgs ? (
            <div className="p-4 text-center text-xs text-[#5f6368] dark:text-[#9aa0a6]">Loading organizations...</div>
          ) : orgs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {orgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center gap-3 p-3 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl"
                >
                  <img src={org.avatar_url} alt={org.login} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#202124] dark:text-[#e8eaed] truncate">{org.login}</h4>
                    <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] truncate">
                      {org.description || 'Member'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
              No organization memberships found for this account.
            </p>
          )}
        </div>

        {/* API Rate Limit & Quota Live Gauge */}
        <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-sm space-y-3.5 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0494f4]" />
              <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">GitHub REST API Quota</h3>
            </div>
            <span className="text-xs font-mono text-[#0494f4] font-bold">
              {rateRemaining.toLocaleString()} / {rateTotal.toLocaleString()} requests ({ratePercentage}%)
            </span>
          </div>

          <div className="w-full h-3 bg-[#f1f3f4] dark:bg-[#303134] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                ratePercentage < 20 ? 'bg-[#ea4335]' : ratePercentage < 50 ? 'bg-[#fbbc04]' : 'bg-[#0494f4]'
              }`}
              style={{ width: `${ratePercentage}%` }}
            />
          </div>

          {rateLimit && (
            <div className="flex items-center justify-between text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
              <span>Used: {rateLimit.used.toLocaleString()} calls</span>
              <span>Quota resets at {new Date(rateLimit.reset * 1000).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Security & Active Personal Access Token */}
        <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-sm space-y-4 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#0494f4]" />
            <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed]">
              Update Personal Access Token (PAT)
            </h3>
          </div>

          <form onSubmit={handleUpdateToken} className="space-y-3">
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
              Tokens are securely stored locally in your browser session. Replace your current PAT anytime to switch scopes or renew access.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="password"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder="Paste new GitHub Personal Access Token (ghp_...)..."
                className="flex-1 px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl text-xs sm:text-sm font-mono text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4]"
              />
              <button
                type="submit"
                disabled={updatingToken || !newToken.trim()}
                className="px-5 py-2.5 bg-[#0494f4] hover:bg-[#0382d6] disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-xs transition shrink-0 cursor-pointer"
              >
                {updatingToken ? 'Validating...' : 'Update PAT'}
              </button>
            </div>

            {updateMsg && (
              <div
                className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                  updateMsg.type === 'success'
                    ? 'bg-[#0494f4]/15 text-[#0494f4] border border-[#0494f4]/30'
                    : 'bg-[#ea4335]/15 text-[#ea4335] border border-[#ea4335]/30'
                }`}
              >
                {updateMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{updateMsg.text}</span>
              </div>
            )}
          </form>

          {/* Scopes Checklist */}
          <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#202124] dark:text-[#e8eaed]">
              <Shield className="w-3.5 h-3.5 text-[#0494f4]" />
              <span>Active Scope Capabilities:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono text-[#5f6368] dark:text-[#9aa0a6]">
              <div className="p-2 bg-[#f8f9fa] dark:bg-[#202124] rounded-xl border border-[#dadce0] dark:border-[#3c4043] flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#0494f4]" /> repo (all)
              </div>
              <div className="p-2 bg-[#f8f9fa] dark:bg-[#202124] rounded-xl border border-[#dadce0] dark:border-[#3c4043] flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#0494f4]" /> workflow (CI/CD)
              </div>
              <div className="p-2 bg-[#f8f9fa] dark:bg-[#202124] rounded-xl border border-[#dadce0] dark:border-[#3c4043] flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#0494f4]" /> delete_repo
              </div>
              <div className="p-2 bg-[#f8f9fa] dark:bg-[#202124] rounded-xl border border-[#dadce0] dark:border-[#3c4043] flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#0494f4]" /> gist
              </div>
              <div className="p-2 bg-[#f8f9fa] dark:bg-[#202124] rounded-xl border border-[#dadce0] dark:border-[#3c4043] flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#0494f4]" /> user
              </div>
              <div className="p-2 bg-[#f8f9fa] dark:bg-[#202124] rounded-xl border border-[#dadce0] dark:border-[#3c4043] flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#0494f4]" /> admin:org
              </div>
            </div>
          </div>
        </div>

        {/* Disconnect & Logout */}
        <div className="p-5 bg-[#ea4335]/10 border border-[#ea4335]/30 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-[#ea4335]">Disconnect GitHub Account</h4>
            <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
              Clears the active PAT from this browser session. You can re-authenticate anytime.
            </p>
          </div>
          <button
            onClick={onLogout}
            id="profile-disconnect-btn"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#ea4335] hover:bg-[#d93025] active:scale-95 text-white text-xs font-bold rounded-2xl shadow-xs transition cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect & Sign Out</span>
          </button>
        </div>
      </main>

      {/* Create Gist Modal */}
      {showNewGistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#0494f4]" />
                Create New Gist
              </h3>
              <button
                onClick={() => setShowNewGistModal(false)}
                className="p-1 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGist} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed]">Filename</label>
                <input
                  type="text"
                  required
                  value={gistFilename}
                  onChange={(e) => setGistFilename(e.target.value)}
                  placeholder="e.g. snippet.ts or index.js"
                  className="w-full px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-mono text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed]">Description (Optional)</label>
                <input
                  type="text"
                  value={gistDescription}
                  onChange={(e) => setGistDescription(e.target.value)}
                  placeholder="What is this snippet for?"
                  className="w-full px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed]">Content</label>
                <textarea
                  rows={6}
                  required
                  value={gistContent}
                  onChange={(e) => setGistContent(e.target.value)}
                  placeholder="// Paste or write snippet content..."
                  className="w-full px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-mono text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4] resize-y"
                />
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[#202124] dark:text-[#e8eaed]">
                  <input
                    type="radio"
                    name="gistPublic"
                    checked={gistIsPublic}
                    onChange={() => setGistIsPublic(true)}
                  />
                  <span>Public Gist</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[#202124] dark:text-[#e8eaed]">
                  <input
                    type="radio"
                    name="gistPublic"
                    checked={!gistIsPublic}
                    onChange={() => setGistIsPublic(false)}
                  />
                  <span>Secret Gist</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewGistModal(false)}
                  className="px-4 py-2 bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGist || !gistFilename.trim() || !gistContent.trim()}
                  className="px-5 py-2 bg-[#0494f4] hover:bg-[#0382d6] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {creatingGist ? 'Creating...' : 'Publish Gist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
