import React, { useState } from 'react';
import { X, PlusCircle, Lock, Globe, BookOpen } from 'lucide-react';
import { githubService } from '../../services/github';
import { GitHubRepo } from '../../types/github';

interface CreateRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (repo: GitHubRepo) => void;
}

export const CreateRepoModal: React.FC<CreateRepoModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [autoInit, setAutoInit] = useState(true);
  const [gitignoreTemplate, setGitignoreTemplate] = useState('Node');
  const [licenseTemplate, setLicenseTemplate] = useState('mit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Repository name is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newRepo = await githubService.createRepo({
        name: name.trim().replace(/\s+/g, '-'),
        description: description.trim(),
        private: isPrivate,
        auto_init: autoInit,
        gitignore_template: autoInit && gitignoreTemplate !== 'none' ? gitignoreTemplate : undefined,
        license_template: autoInit && licenseTemplate !== 'none' ? licenseTemplate : undefined,
      });

      onCreated(newRepo);
      onClose();
      // Reset form
      setName('');
      setDescription('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create repository.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-auto transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0494f4]/15 text-[#0494f4] rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e8eaed]">Create New Repository</h2>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Initialize a new Git repository on GitHub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] rounded-xl hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-[#ea4335]/10 border border-[#ea4335]/30 rounded-xl text-xs text-[#ea4335]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed]">
              Repository Name <span className="text-[#ea4335]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. gothwad-web-app"
              className="w-full px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs sm:text-sm text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed]">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary of your project..."
              className="w-full px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4] resize-none"
            />
          </div>

          {/* Visibility selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed]">Visibility</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition ${
                  !isPrivate
                    ? 'border-[#0494f4] bg-[#0494f4]/10 text-[#0494f4]'
                    : 'border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#202124] text-[#5f6368] dark:text-[#9aa0a6] hover:border-[#0494f4]'
                }`}
              >
                <Globe className="w-4 h-4 text-[#0494f4] shrink-0" />
                <div>
                  <div className="text-xs font-bold">Public</div>
                  <div className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Anyone on internet</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition ${
                  isPrivate
                    ? 'border-[#0494f4] bg-[#0494f4]/10 text-[#0494f4]'
                    : 'border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#202124] text-[#5f6368] dark:text-[#9aa0a6] hover:border-[#0494f4]'
                }`}
              >
                <Lock className="w-4 h-4 text-[#fbbc04] shrink-0" />
                <div>
                  <div className="text-xs font-bold">Private</div>
                  <div className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Only you and collaborators</div>
                </div>
              </button>
            </div>
          </div>

          {/* Auto init with README */}
          <div className="p-3 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoInit}
                onChange={(e) => setAutoInit(e.target.checked)}
                className="w-4 h-4 rounded text-[#0494f4] focus:ring-[#0494f4] bg-white dark:bg-[#292a2d] border-[#dadce0] dark:border-[#3c4043]"
              />
              <div className="text-xs">
                <span className="font-semibold text-[#202124] dark:text-[#e8eaed] flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#0494f4]" />
                  Initialize with a README
                </span>
                <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">Allows you to immediately clone and commit files.</p>
              </div>
            </label>

            {autoInit && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#dadce0] dark:border-[#3c4043]">
                <div>
                  <label className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mb-1 block">.gitignore template</label>
                  <select
                    value={gitignoreTemplate}
                    onChange={(e) => setGitignoreTemplate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-lg text-xs text-[#202124] dark:text-[#e8eaed]"
                  >
                    <option value="none">None</option>
                    <option value="Node">Node / JavaScript</option>
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                    <option value="Go">Go</option>
                    <option value="Rust">Rust</option>
                    <option value="Unity">Unity</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mb-1 block">License</label>
                  <select
                    value={licenseTemplate}
                    onChange={(e) => setLicenseTemplate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-lg text-xs text-[#202124] dark:text-[#e8eaed]"
                  >
                    <option value="none">None</option>
                    <option value="mit">MIT License</option>
                    <option value="apache-2.0">Apache 2.0</option>
                    <option value="gpl-3.0">GNU GPL v3</option>
                    <option value="unlicense">The Unlicense</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 bg-[#f1f3f4] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-[#202124] dark:text-[#e8eaed] text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2.5 bg-[#0494f4] hover:bg-[#0382d6] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Repo...</span>
                </>
              ) : (
                <span>Create Repository</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
