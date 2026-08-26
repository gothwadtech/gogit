import React, { useState } from 'react';
import { Copy, Check, Edit3, Save, X, Download, FileCode } from 'lucide-react';

interface CodeViewerProps {
  filename: string;
  content: string;
  isBinary?: boolean;
  rawUrl?: string;
  onSave?: (newContent: string, commitMessage: string) => Promise<void>;
  onDelete?: () => void;
  canEdit?: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  filename,
  content,
  isBinary = false,
  rawUrl,
  onSave,
  onDelete,
  canEdit = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [commitMsg, setCommitMsg] = useState(`Update ${filename}`);
  const [isSaving, setIsSaving] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [wrapText, setWrapText] = useState(true);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(isEditing ? editContent : content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (rawUrl) {
      window.open(rawUrl, '_blank');
      return;
    }
    const blob = new Blob([isEditing ? editContent : content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveClick = async () => {
    if (!onSave) return;
    try {
      setIsSaving(true);
      await onSave(editContent, commitMsg || `Update ${filename}`);
      setIsEditing(false);
      setShowCommitModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to commit changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isBinary) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'].includes(ext || '');

    return (
      <div id="binary-file-viewer" className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 text-center shadow-sm">
        {isImage && rawUrl ? (
          <div className="flex flex-col items-center gap-4">
            <div className="max-h-80 max-w-full overflow-hidden rounded-2xl border border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#202124] p-2">
              <img src={rawUrl} alt={filename} className="max-h-72 object-contain mx-auto" />
            </div>
            <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-mono">{filename}</span>
            <a
              href={rawUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#f1f3f4] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-[#202124] dark:text-[#e8eaed] text-sm font-medium rounded-xl transition"
            >
              <Download className="w-4 h-4 text-[#0494f4]" />
              Download Image
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#f1f3f4] dark:bg-[#303134] flex items-center justify-center text-[#0494f4]">
              <FileCode className="w-7 h-7" />
            </div>
            <p className="text-sm text-[#202124] dark:text-[#e8eaed] font-medium">{filename}</p>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Binary file format (cannot be displayed as text)</p>
            {rawUrl && (
              <a
                href={rawUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#0494f4] hover:bg-[#0382d6] text-white text-xs font-semibold rounded-xl transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Raw File
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  const lines = (isEditing ? editContent : content).split('\n');

  return (
    <div id={`code-viewer-${filename.replace(/[^a-zA-Z0-9]/g, '-')}`} className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl overflow-hidden shadow-sm flex flex-col transition-colors duration-200">
      {/* File Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043] gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-[#0494f4] font-bold truncate max-w-[200px] sm:max-w-xs">{filename}</span>
          <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] font-mono">({lines.length} lines)</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setWrapText(!wrapText)}
            title="Toggle word wrap"
            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
              wrapText
                ? 'bg-[#0494f4] text-white'
                : 'bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6]'
            }`}
          >
            Wrap
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#f1f3f4] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-[#202124] dark:text-[#e8eaed] text-[11px] font-medium rounded-lg transition"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#34a853]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 bg-[#f1f3f4] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-[#202124] dark:text-[#e8eaed] text-[11px] rounded-lg transition"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {canEdit && (
            <>
              {isEditing ? (
                <>
                  <button
                    onClick={() => setShowCommitModal(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-[#0494f4] hover:bg-[#0382d6] text-white text-[11px] font-semibold rounded-lg transition shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Commit</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditContent(content);
                      setIsEditing(false);
                    }}
                    className="p-1.5 bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] rounded-lg transition"
                    title="Cancel edit"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditContent(content);
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#0494f4]/15 text-[#0494f4] hover:bg-[#0494f4]/25 text-[11px] font-semibold rounded-lg transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#0494f4]" />
                  <span>Edit</span>
                </button>
              )}
            </>
          )}

          {onDelete && !isEditing && (
            <button
              onClick={onDelete}
              className="p-1.5 bg-[#ea4335]/10 text-[#ea4335] hover:bg-[#ea4335]/20 rounded-lg transition text-[11px]"
              title="Delete file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Editor / Viewer Body */}
      {isEditing ? (
        <div className="relative flex-1 bg-white dark:bg-[#202124] p-2">
          <textarea
            id="code-editor-textarea"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            spellCheck={false}
            className={`w-full min-h-[350px] sm:min-h-[450px] p-3 font-mono text-xs sm:text-sm bg-[#f8f9fa] dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] border border-[#0494f4]/40 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#0494f4] resize-y leading-relaxed ${
              wrapText ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
            }`}
          />
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto bg-white dark:bg-[#202124] p-3 font-mono text-xs sm:text-sm leading-relaxed">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-[#f1f3f4] dark:hover:bg-[#292a2d] transition-colors">
                  <td className="w-10 pr-3 text-right select-none text-[#80868b] text-[11px] font-mono align-top py-0.5 border-r border-[#dadce0] dark:border-[#3c4043]">
                    {idx + 1}
                  </td>
                  <td className={`pl-3 text-[#202124] dark:text-[#e8eaed] py-0.5 align-top ${wrapText ? 'break-all' : 'whitespace-pre'}`}>
                    {line || '\u00A0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Commit Changes Confirmation Modal */}
      {showCommitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
                <Save className="w-4 h-4 text-[#0494f4]" />
                Commit Changes to GitHub
              </h3>
              <button
                onClick={() => setShowCommitModal(false)}
                className="p-1 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed]">Commit Message</label>
              <input
                type="text"
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder={`Update ${filename}`}
                className="w-full px-3 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4]"
              />
            </div>

            <div className="text-xs text-[#5f6368] dark:text-[#9aa0a6] bg-[#f8f9fa] dark:bg-[#202124] p-3 rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
              This will create a new commit directly on the active branch in your GitHub repository.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCommitModal(false)}
                disabled={isSaving}
                className="px-4 py-2 bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0494f4] hover:bg-[#0382d6] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-sm"
              >
                {isSaving ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? 'Committing...' : 'Confirm Commit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
