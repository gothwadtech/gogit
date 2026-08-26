import React, { useState, useEffect } from 'react';
import {
  Code2,
  Star,
  Plus,
  Trash2,
  ExternalLink,
  FileCode,
  X,
  Layers,
} from 'lucide-react';
import { GitHubGist, GitHubRepo } from '../../types/github';
import { githubService } from '../../services/github';

interface GistsTabProps {
  onSelectRepo: (repo: GitHubRepo) => void;
}

export const GistsTab: React.FC<GistsTabProps> = ({ onSelectRepo }) => {
  const [subTab, setSubTab] = useState<'gists' | 'starred'>('gists');
  const [gists, setGists] = useState<GitHubGist[]>([]);
  const [starredRepos, setStarredRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);

  // New Gist Modal
  const [showNewGistModal, setShowNewGistModal] = useState(false);
  const [gistFilename, setGistFilename] = useState('snippet.js');
  const [gistDescription, setGistDescription] = useState('');
  const [gistContent, setGistContent] = useState('');
  const [gistIsPublic, setGistIsPublic] = useState(true);
  const [creatingGist, setCreatingGist] = useState(false);

  useEffect(() => {
    loadData();
  }, [subTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (subTab === 'gists') {
        const list = await githubService.getUserGists();
        setGists(list);
      } else {
        const starred = await githubService.getStarredRepos();
        setStarredRepos(starred);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
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
      loadData();
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

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto">
      {/* Top Header & Sub-tab switcher */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl">
          <button
            onClick={() => setSubTab('gists')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              subTab === 'gists'
                ? 'bg-[#0494f4] text-white shadow-sm'
                : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>My Gists</span>
          </button>

          <button
            onClick={() => setSubTab('starred')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              subTab === 'starred'
                ? 'bg-[#0494f4] text-white shadow-sm'
                : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-[#fbbc04]" />
            <span>Starred Repos</span>
          </button>
        </div>

        {subTab === 'gists' && (
          <button
            onClick={() => setShowNewGistModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0494f4] hover:bg-[#0382d6] active:scale-95 text-white text-xs font-bold rounded-2xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Gist</span>
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-3 py-10 text-center">
          <div className="w-8 h-8 border-3 border-[#0494f4]/20 border-t-[#0494f4] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Loading {subTab}...</p>
        </div>
      ) : subTab === 'gists' ? (
        gists.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 space-y-3 shadow-sm">
            <Code2 className="w-10 h-10 text-[#80868b] mx-auto opacity-60" />
            <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">No Gists created yet</h3>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-sm mx-auto">
              Gists let you share code snippets, notes, and configurations easily.
            </p>
            <button
              onClick={() => setShowNewGistModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0494f4] hover:bg-[#0382d6] text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Create First Gist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {gists.map((gist) => {
              const fileKeys = Object.keys(gist.files);
              const firstFile = gist.files[fileKeys[0]];

              return (
                <div
                  key={gist.id}
                  className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-[#0494f4] dark:hover:border-[#0494f4] transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-[#0494f4] shrink-0" />
                          <h4 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] truncate">
                            {firstFile?.filename || 'Untitled Gist'}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              gist.public
                                ? 'bg-[#34a853]/10 text-[#34a853] border-[#34a853]/20'
                                : 'bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] border-[#dadce0] dark:border-[#3c4043]'
                            }`}
                          >
                            {gist.public ? 'Public' : 'Secret'}
                          </span>
                        </div>
                        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1 line-clamp-2">
                          {gist.description || <span className="italic text-[#80868b]">No description</span>}
                        </p>
                      </div>

                      <a
                        href={gist.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#0494f4] rounded-xl"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#80868b] flex-wrap">
                      <span>{fileKeys.length} file(s)</span>
                      <span>• Created {new Date(gist.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
                    <a
                      href={firstFile?.raw_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#0494f4] hover:underline flex items-center gap-1 font-mono"
                    >
                      Raw View
                    </a>

                    <button
                      onClick={(e) => handleDeleteGist(gist.id, e)}
                      title="Delete Gist"
                      className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#ea4335] hover:bg-[#ea4335]/10 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : starredRepos.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 space-y-2 shadow-sm">
          <Star className="w-10 h-10 text-[#80868b] mx-auto opacity-60" />
          <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">No starred repositories</h3>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">You haven't starred any repositories on GitHub yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {starredRepos.map((repo) => (
            <div
              key={repo.id}
              className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-[#0494f4] dark:hover:border-[#0494f4] transition"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#0494f4] shrink-0" />
                      <h4 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] truncate">{repo.full_name}</h4>
                    </div>
                    <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1 line-clamp-2">{repo.description}</p>
                  </div>

                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#0494f4] rounded-xl"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                  {repo.language && <span className="text-[#202124] dark:text-[#e8eaed] font-mono">{repo.language}</span>}
                  <span className="flex items-center gap-1 text-[#fbbc04]">
                    <Star className="w-3 h-3" /> {repo.stargazers_count}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
                <button
                  onClick={() => onSelectRepo(repo)}
                  className="text-xs text-[#0494f4] font-semibold hover:underline"
                >
                  Explore in Codebase →
                </button>

                <button
                  onClick={(e) => handleUnstarRepo(repo, e)}
                  className="px-2.5 py-1 bg-[#f8f9fa] dark:bg-[#202124] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#fbbc04] text-xs rounded-xl border border-[#dadce0] dark:border-[#3c4043] transition flex items-center gap-1"
                >
                  <Star className="w-3 h-3 text-[#fbbc04] fill-[#fbbc04]" />
                  <span>Unstar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
                className="p-1 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]"
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
                  placeholder="e.g. index.js or notes.md"
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
                  className="px-4 py-2 bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGist || !gistFilename.trim() || !gistContent.trim()}
                  className="px-5 py-2 bg-[#0494f4] hover:bg-[#0382d6] text-white text-xs font-bold rounded-xl shadow-sm transition"
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
