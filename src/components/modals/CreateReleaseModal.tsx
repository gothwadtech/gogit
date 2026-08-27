import React, { useState } from 'react';
import { X, Tag, Sparkles, AlertCircle, FileText, Check, Layers, GitBranch } from 'lucide-react';
import { GitHubRepo, GitHubBranch, GitHubRelease } from '../../types/github';
import { githubService } from '../../services/github';

interface CreateReleaseModalProps {
  repo: GitHubRepo;
  branches: GitHubBranch[];
  selectedBranch: string;
  onClose: () => void;
  onSuccess: (newRelease: GitHubRelease) => void;
}

export const CreateReleaseModal: React.FC<CreateReleaseModalProps> = ({
  repo,
  branches,
  selectedBranch,
  onClose,
  onSuccess,
}) => {
  const [tagName, setTagName] = useState('');
  const [targetBranch, setTargetBranch] = useState(selectedBranch || repo.default_branch);
  const [releaseTitle, setReleaseTitle] = useState('');
  const [body, setBody] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [isPrerelease, setIsPrerelease] = useState(false);

  const [loading, setLoading] = useState(false);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateNotes = async () => {
    if (!tagName.trim()) {
      setError('Please specify a Tag version (e.g. v1.0.0) first to generate release notes');
      return;
    }

    try {
      setGeneratingNotes(true);
      setError(null);
      const notes = await githubService.generateReleaseNotes(
        repo.owner.login,
        repo.name,
        tagName.trim(),
        targetBranch
      );
      if (notes.name && !releaseTitle) {
        setReleaseTitle(notes.name);
      }
      if (notes.body) {
        setBody(notes.body);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to auto-generate release notes');
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) {
      setError('Tag name is required (e.g. v1.0.0)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const release = await githubService.createRelease(repo.owner.login, repo.name, {
        tag_name: tagName.trim(),
        target_commitish: targetBranch,
        name: releaseTitle.trim() || tagName.trim(),
        body: body.trim() || undefined,
        draft: isDraft,
        prerelease: isPrerelease,
      });

      onSuccess(release);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish release');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between gap-3 bg-white/50 dark:bg-[#292a2d]/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8.5 h-8.5 rounded-2xl bg-[#0494f4]/10 text-[#0494f4] flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e8eaed]">
                Publish New Release
              </h2>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate font-mono">
                {repo.full_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-[#ea4335]/10 border border-[#ea4335]/20 rounded-2xl text-[#ea4335] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tag & Branch Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tag Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">
                Tag Version *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. v1.0.0 or 2.1.0"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl font-mono text-xs text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4]"
                  required
                />
                <Tag className="w-4 h-4 text-[#0494f4] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Target Branch */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">
                Target Branch
              </label>
              <div className="relative">
                <select
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl text-xs font-semibold text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4] cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <GitBranch className="w-4 h-4 text-[#0494f4] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Release Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">
              Release Title
            </label>
            <input
              type="text"
              placeholder="e.g. Major Feature Update & Bug Fixes"
              value={releaseTitle}
              onChange={(e) => setReleaseTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl text-xs font-medium text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4]"
            />
          </div>

          {/* Description & Auto Changelog button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">
                Release Notes / Changelog
              </label>
              <button
                type="button"
                onClick={handleGenerateNotes}
                disabled={generatingNotes || !tagName.trim()}
                className="px-2.5 py-1 bg-[#0494f4]/10 hover:bg-[#0494f4]/20 text-[#0494f4] text-[11px] font-bold rounded-lg flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
              >
                <Sparkles className={`w-3.5 h-3.5 ${generatingNotes ? 'animate-spin' : ''}`} />
                <span>{generatingNotes ? 'Generating...' : 'Auto-Generate Notes'}</span>
              </button>
            </div>
            <textarea
              rows={6}
              placeholder="Describe what's new in this release, features added, and fixes..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-3 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl font-mono text-xs text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4] leading-relaxed"
            />
          </div>

          {/* Checkbox Options */}
          <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-[#202124] dark:text-[#e8eaed]">
              <input
                type="checkbox"
                checked={isPrerelease}
                onChange={(e) => setIsPrerelease(e.target.checked)}
                className="w-4 h-4 rounded text-[#0494f4] accent-[#0494f4] cursor-pointer"
              />
              <span>Set as a Pre-release</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-[#202124] dark:text-[#e8eaed]">
              <input
                type="checkbox"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                className="w-4 h-4 rounded text-[#0494f4] accent-[#0494f4] cursor-pointer"
              />
              <span>Save as Draft</span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#dadce0] dark:border-[#3c4043]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#f1f3f4] dark:bg-[#292a2d] hover:bg-[#e8eaed] dark:hover:bg-[#303134] text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] rounded-xl border border-[#dadce0] dark:border-[#3c4043] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !tagName.trim()}
              className="px-5 py-2 bg-[#0494f4] hover:bg-[#037acf] active:scale-95 text-xs font-bold text-white rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Tag className="w-3.5 h-3.5" />
                  <span>{isDraft ? 'Save Draft' : 'Publish Release'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
