import React, { useState } from 'react';
import { X, FilePlus, Save } from 'lucide-react';

interface NewFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (filePath: string, content: string, commitMsg: string) => Promise<void>;
  currentDirectory?: string;
}

export const NewFileModal: React.FC<NewFileModalProps> = ({
  isOpen,
  onClose,
  onCreateFile,
  currentDirectory = '',
}) => {
  const [filePath, setFilePath] = useState(currentDirectory ? `${currentDirectory}/` : '');
  const [content, setContent] = useState('');
  const [commitMsg, setCommitMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPath = filePath.trim().replace(/^\/+/, '');
    if (!cleanPath) {
      setError('File path and name are required (e.g. src/index.ts)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onCreateFile(
        cleanPath,
        content,
        commitMsg.trim() || `Create ${cleanPath.split('/').pop() || cleanPath}`
      );
      onClose();
      setFilePath('');
      setContent('');
      setCommitMsg('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-auto transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0494f4]/15 text-[#0494f4] rounded-xl">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e8eaed]">Create New File</h2>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Directly commit a new file to repository</p>
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
              File Path <span className="text-[#ea4335]">*</span>
            </label>
            <input
              type="text"
              required
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="e.g. src/components/Button.tsx or README.md"
              className="w-full px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs sm:text-sm font-mono text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed]">File Content</label>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="// Paste or write initial code here..."
              spellCheck={false}
              className="w-full px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-mono text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4] resize-y"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed]">Commit Message (Optional)</label>
            <input
              type="text"
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              placeholder="e.g. feat: add new component"
              className="w-full px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4]"
            />
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
              disabled={loading || !filePath.trim()}
              className="px-5 py-2.5 bg-[#0494f4] hover:bg-[#0382d6] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Committing File...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Commit New File</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
