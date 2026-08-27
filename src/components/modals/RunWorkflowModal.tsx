import React, { useState } from 'react';
import { X, Play, GitBranch, AlertCircle, Sparkles, Sliders } from 'lucide-react';
import { GitHubRepo, GitHubBranch, GitHubWorkflow } from '../../types/github';
import { githubService } from '../../services/github';

interface RunWorkflowModalProps {
  repo: GitHubRepo;
  workflows: GitHubWorkflow[];
  branches: GitHubBranch[];
  selectedBranch: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RunWorkflowModal: React.FC<RunWorkflowModalProps> = ({
  repo,
  workflows,
  branches,
  selectedBranch,
  onClose,
  onSuccess,
}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | string>(
    workflows[0]?.id || ''
  );
  const [branch, setBranch] = useState(selectedBranch || repo.default_branch);
  const [inputsJson, setInputsJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflowId) {
      setError('Please select a workflow to trigger');
      return;
    }

    let parsedInputs: Record<string, string> | undefined;
    if (inputsJson.trim()) {
      try {
        parsedInputs = JSON.parse(inputsJson);
      } catch {
        setError('Inputs must be valid JSON key-value format (e.g. {"environment": "production"})');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      await githubService.dispatchWorkflow(repo.owner.login, repo.name, selectedWorkflowId, {
        ref: branch,
        inputs: parsedInputs,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch workflow run');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between gap-3 bg-white/50 dark:bg-[#292a2d]/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8.5 h-8.5 rounded-2xl bg-[#34a853]/15 text-[#34a853] flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e8eaed]">
                Run GitHub Workflow
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-[#ea4335]/10 border border-[#ea4335]/20 rounded-2xl text-[#ea4335] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Workflow Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">
              Select Workflow
            </label>
            <select
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl text-xs font-semibold text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4] cursor-pointer"
            >
              {workflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name} ({wf.path})
                </option>
              ))}
            </select>
          </div>

          {/* Branch / Ref Target */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">
              Target Branch / Ref
            </label>
            <div className="relative">
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
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

          {/* Optional Inputs JSON */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">
                Workflow Inputs (Optional JSON)
              </label>
              <span className="text-[11px] text-[#80868b]">e.g. key-value pairs</span>
            </div>
            <textarea
              rows={3}
              placeholder='{\n  "deploy_target": "production"\n}'
              value={inputsJson}
              onChange={(e) => setInputsJson(e.target.value)}
              className="w-full p-3 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl font-mono text-xs text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#f1f3f4] dark:bg-[#292a2d] hover:bg-[#e8eaed] dark:hover:bg-[#303134] text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] rounded-xl border border-[#dadce0] dark:border-[#3c4043] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || workflows.length === 0}
              className="px-5 py-2 bg-[#0494f4] hover:bg-[#037acf] active:scale-95 text-xs font-bold text-white rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Triggering...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Dispatch Workflow</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
