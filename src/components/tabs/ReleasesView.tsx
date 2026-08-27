import React, { useState, useEffect } from 'react';
import {
  Tag,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Package,
  Calendar,
  Layers,
  FileArchive,
  ChevronDown,
  ChevronUp,
  GitCommit,
  ShieldAlert,
} from 'lucide-react';
import { GitHubRepo, GitHubBranch, GitHubRelease, GitHubTag } from '../../types/github';
import { githubService } from '../../services/github';
import { CreateReleaseModal } from '../modals/CreateReleaseModal';

interface ReleasesViewProps {
  repo: GitHubRepo;
  branches: GitHubBranch[];
  selectedBranch: string;
}

export const ReleasesView: React.FC<ReleasesViewProps> = ({
  repo,
  branches,
  selectedBranch,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'releases' | 'tags'>('releases');
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [tags, setTags] = useState<GitHubTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & UI
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedReleases, setExpandedReleases] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadData();
  }, [repo.name]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [releaseList, tagList] = await Promise.all([
        githubService.getReleases(repo.owner.login, repo.name).catch(() => []),
        githubService.getTags(repo.owner.login, repo.name).catch(() => []),
      ]);
      setReleases(releaseList);
      setTags(tagList);
      // Auto expand first release
      if (releaseList.length > 0) {
        setExpandedReleases({ [releaseList[0].id]: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load releases and tags');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRelease = async (releaseId: number, tagName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete release ${tagName}?`)) return;

    try {
      await githubService.deleteRelease(repo.owner.login, repo.name, releaseId);
      setReleases((prev) => prev.filter((r) => r.id !== releaseId));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedReleases((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatRelativeDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#0494f4]/10 text-[#0494f4] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed]">
                Releases & Asset Downloader Hub
              </h3>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                Manage tagged releases, download distribution assets, and generate automatic changelogs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-[#0494f4] hover:bg-[#037acf] active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Draft a Release</span>
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh Releases"
              className="p-2 bg-[#f1f3f4] dark:bg-[#292a2d] hover:bg-[#e8eaed] dark:hover:bg-[#303134] text-[#202124] dark:text-[#e8eaed] rounded-xl border border-[#dadce0] dark:border-[#3c4043] transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0494f4] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sub-tab switcher (Releases vs Tags) */}
        <div className="flex items-center gap-2 border-b border-[#dadce0]/60 dark:border-[#3c4043]/60 pb-2">
          <button
            onClick={() => setActiveSubTab('releases')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'releases'
                ? 'bg-[#0494f4] text-white shadow-xs'
                : 'bg-[#f1f3f4] dark:bg-[#292a2d] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Releases ({releases.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tags')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'tags'
                ? 'bg-[#0494f4] text-white shadow-xs'
                : 'bg-[#f1f3f4] dark:bg-[#292a2d] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
            }`}
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span>Tags ({tags.length})</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-[#ea4335]/10 border border-[#ea4335]/20 rounded-2xl text-[#ea4335] text-xs">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#0494f4] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Loading releases and assets...</p>
        </div>
      ) : activeSubTab === 'releases' ? (
        /* Releases List */
        <div className="space-y-4">
          {releases.length === 0 ? (
            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-16 text-center space-y-3">
              <Package className="w-10 h-10 text-[#80868b] mx-auto opacity-60" />
              <h4 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">No Releases Published</h4>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-sm mx-auto">
                Package your software into versioned releases, attach binaries, and broadcast updates to users.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 px-4 py-2 bg-[#0494f4] text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Release</span>
              </button>
            </div>
          ) : (
            releases.map((rel, idx) => {
              const isExpanded = Boolean(expandedReleases[rel.id]);
              const isLatest = idx === 0 && !rel.prerelease && !rel.draft;

              return (
                <div
                  key={rel.id}
                  className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 overflow-hidden"
                >
                  {/* Release Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm sm:text-base font-bold text-[#0494f4] flex items-center gap-1.5">
                          <Tag className="w-4 h-4" />
                          {rel.tag_name}
                        </span>

                        {isLatest && (
                          <span className="px-2.5 py-0.5 bg-[#34a853]/15 text-[#34a853] font-bold text-[10px] rounded-lg">
                            Latest
                          </span>
                        )}
                        {rel.prerelease && (
                          <span className="px-2.5 py-0.5 bg-[#fbbc04]/20 text-[#b06000] dark:text-[#fbbc04] font-bold text-[10px] rounded-lg">
                            Pre-release
                          </span>
                        )}
                        {rel.draft && (
                          <span className="px-2.5 py-0.5 bg-gray-500/15 text-gray-500 font-bold text-[10px] rounded-lg">
                            Draft
                          </span>
                        )}
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed]">
                        {rel.name || rel.tag_name}
                      </h4>

                      {/* Author & Published info */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                        {rel.author && (
                          <div className="flex items-center gap-1.5 text-[#202124] dark:text-[#e8eaed] font-medium">
                            <img
                              src={rel.author.avatar_url}
                              alt={rel.author.login}
                              className="w-4 h-4 rounded-full"
                            />
                            <span>{rel.author.login}</span>
                          </div>
                        )}
                        <span>•</span>
                        <span>released on {formatRelativeDate(rel.published_at || rel.created_at)}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">{rel.target_commitish}</span>
                      </div>
                    </div>

                    {/* Top Right Action buttons */}
                    <div className="flex items-center gap-1.5 self-start shrink-0">
                      <a
                        href={rel.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#0494f4] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded-xl transition"
                        title="View on GitHub"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        onClick={(e) => handleDeleteRelease(rel.id, rel.tag_name, e)}
                        title="Delete Release"
                        className="p-2 text-[#ea4335] hover:bg-[#ea4335]/10 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleExpand(rel.id)}
                        className="p-2 text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded-xl transition cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Release Body / Changelog (Collapsible) */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-[#dadce0]/60 dark:border-[#3c4043]/60 space-y-4">
                      {rel.body ? (
                        <div className="bg-[#f8f9fa] dark:bg-[#292a2d] rounded-2xl p-4 text-xs sm:text-sm text-[#202124] dark:text-[#e8eaed] leading-relaxed whitespace-pre-wrap font-sans border border-[#dadce0]/50 dark:border-[#3c4043]/50">
                          {rel.body}
                        </div>
                      ) : (
                        <p className="text-xs text-[#80868b] italic">No description provided for this release.</p>
                      )}

                      {/* Assets / Downloads Section */}
                      <div className="space-y-2.5">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-[#0494f4]" />
                          <span>Assets & Binaries ({rel.assets.length + 2})</span>
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Attached Release Assets */}
                          {rel.assets.map((asset) => (
                            <a
                              key={asset.id}
                              href={asset.browser_download_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-[#f8f9fa] dark:bg-[#292a2d] hover:bg-[#0494f4]/5 dark:hover:bg-[#0494f4]/10 border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] rounded-2xl flex items-center justify-between gap-3 transition group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 font-mono text-xs">
                                <Download className="w-4 h-4 text-[#0494f4] group-hover:scale-110 transition-transform shrink-0" />
                                <span className="font-semibold text-[#202124] dark:text-[#e8eaed] truncate">
                                  {asset.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 text-[11px] text-[#5f6368] dark:text-[#9aa0a6] font-mono">
                                <span>{formatFileSize(asset.size)}</span>
                                <span className="text-[10px] text-[#80868b]">({asset.download_count} dl)</span>
                              </div>
                            </a>
                          ))}

                          {/* Source Code Archives (ZIP & TAR) */}
                          <a
                            href={rel.zipball_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-[#f8f9fa] dark:bg-[#292a2d] hover:bg-[#0494f4]/5 dark:hover:bg-[#0494f4]/10 border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] rounded-2xl flex items-center justify-between gap-3 transition group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 font-mono text-xs">
                              <FileArchive className="w-4 h-4 text-[#34a853] group-hover:scale-110 transition-transform shrink-0" />
                              <span className="font-semibold text-[#202124] dark:text-[#e8eaed] truncate">
                                Source code (zip)
                              </span>
                            </div>
                            <span className="text-[11px] text-[#0494f4] font-semibold shrink-0">Download</span>
                          </a>

                          <a
                            href={rel.tarball_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-[#f8f9fa] dark:bg-[#292a2d] hover:bg-[#0494f4]/5 dark:hover:bg-[#0494f4]/10 border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] rounded-2xl flex items-center justify-between gap-3 transition group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 font-mono text-xs">
                              <FileArchive className="w-4 h-4 text-[#ea4335] group-hover:scale-110 transition-transform shrink-0" />
                              <span className="font-semibold text-[#202124] dark:text-[#e8eaed] truncate">
                                Source code (tar.gz)
                              </span>
                            </div>
                            <span className="text-[11px] text-[#0494f4] font-semibold shrink-0">Download</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Tags Tab */
        <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">
            Repository Git Tags ({tags.length})
          </h4>

          {tags.length === 0 ? (
            <p className="text-xs text-[#80868b] italic py-8 text-center">No Git tags recorded in this repository.</p>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.name}
                  className="bg-[#f8f9fa] dark:bg-[#292a2d] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-3.5 flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0 font-mono text-xs">
                    <Tag className="w-4 h-4 text-[#0494f4] shrink-0" />
                    <span className="font-bold text-[#202124] dark:text-[#e8eaed] truncate">{tag.name}</span>
                    <span className="text-[11px] text-[#80868b] hidden sm:inline">
                      commit {tag.commit.sha.substring(0, 7)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={tag.zipball_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] text-[#0494f4] text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                    >
                      <Download className="w-3 h-3" />
                      <span>ZIP</span>
                    </a>
                    <a
                      href={tag.tarball_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] text-[#0494f4] text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                    >
                      <Download className="w-3 h-3" />
                      <span>TAR.GZ</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Release Modal */}
      {showCreateModal && (
        <CreateReleaseModal
          repo={repo}
          branches={branches}
          selectedBranch={selectedBranch}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newRelease) => {
            setReleases((prev) => [newRelease, ...prev]);
            setExpandedReleases((prev) => ({ ...prev, [newRelease.id]: true }));
          }}
        />
      )}
    </div>
  );
};
