import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  Ban,
  Terminal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  Layers,
  GitBranch,
  GitCommit,
  AlertTriangle,
} from 'lucide-react';
import { GitHubRepo, GitHubWorkflowRun, GitHubWorkflowJob, GitHubWorkflowStep } from '../../types/github';
import { githubService } from '../../services/github';

interface WorkflowRunDetailModalProps {
  repo: GitHubRepo;
  run: GitHubWorkflowRun;
  onClose: () => void;
  onRefreshRun: () => void;
}

export const WorkflowRunDetailModal: React.FC<WorkflowRunDetailModalProps> = ({
  repo,
  run,
  onClose,
  onRefreshRun,
}) => {
  const [jobs, setJobs] = useState<GitHubWorkflowJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Selected Job for Logs
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobLogs, setJobLogs] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [run.id]);

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      setError(null);
      const jobList = await githubService.getWorkflowRunJobs(repo.owner.login, repo.name, run.id);
      setJobs(jobList);
      if (jobList.length > 0) {
        setSelectedJobId(jobList[0].id);
        fetchLogs(jobList[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchLogs = async (jobId: number) => {
    try {
      setLoadingLogs(true);
      setJobLogs(null);
      const text = await githubService.getJobLogs(repo.owner.login, repo.name, jobId);
      setJobLogs(text);
    } catch (err: any) {
      setJobLogs(`Log stream unavailable or still writing: ${err.message || 'Logs not found'}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSelectJob = (jobId: number) => {
    setSelectedJobId(jobId);
    fetchLogs(jobId);
  };

  const handleRerun = async (failedOnly = false) => {
    try {
      setActionLoading(true);
      if (failedOnly) {
        await githubService.rerunFailedJobs(repo.owner.login, repo.name, run.id);
      } else {
        await githubService.rerunWorkflow(repo.owner.login, repo.name, run.id);
      }
      onRefreshRun();
      onClose();
    } catch (err: any) {
      alert(`Rerun failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this workflow run?')) return;
    try {
      setActionLoading(true);
      await githubService.cancelWorkflowRun(repo.owner.login, repo.name, run.id);
      onRefreshRun();
      onClose();
    } catch (err: any) {
      alert(`Cancel failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const copyLogs = () => {
    if (!jobLogs) return;
    navigator.clipboard.writeText(jobLogs);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const getConclusionBadge = (status: string, conclusion: string | null) => {
    if (status === 'in_progress' || status === 'queued') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#fbbc04]/20 text-[#b06000] dark:text-[#fbbc04] font-bold rounded-xl text-xs">
          <RotateCw className="w-3.5 h-3.5 animate-spin" />
          <span>{status === 'in_progress' ? 'Running' : 'Queued'}</span>
        </span>
      );
    }

    switch (conclusion) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#34a853]/15 text-[#34a853] font-bold rounded-xl text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Success</span>
          </span>
        );
      case 'failure':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ea4335]/15 text-[#ea4335] font-bold rounded-xl text-xs">
            <XCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-500/15 text-gray-500 font-bold rounded-xl text-xs">
            <Ban className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-500/15 text-gray-500 font-bold rounded-xl text-xs">
            <span>{conclusion || status}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between gap-3 bg-white/50 dark:bg-[#292a2d]/50">
          <div className="flex items-center gap-3 min-w-0">
            {getConclusionBadge(run.status, run.conclusion)}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] truncate flex items-center gap-2">
                <span>{run.display_title || run.name}</span>
                <span className="text-xs text-[#80868b] font-mono">#{run.run_number}</span>
              </h2>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate flex items-center gap-2 font-mono">
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-[#0494f4]" /> {run.head_branch}
                </span>
                <span>•</span>
                <span>{run.head_sha.substring(0, 7)}</span>
                <span>•</span>
                <span>{run.event}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Run Actions */}
            {run.status === 'in_progress' || run.status === 'queued' ? (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-[#ea4335]/15 hover:bg-[#ea4335] text-[#ea4335] hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Cancel Run</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                {run.conclusion === 'failure' && (
                  <button
                    onClick={() => handleRerun(true)}
                    disabled={actionLoading}
                    title="Re-run only failed jobs"
                    className="px-3 py-1.5 bg-[#fbbc04]/20 hover:bg-[#fbbc04]/30 text-[#b06000] dark:text-[#fbbc04] text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden xs:inline">Rerun Failed</span>
                  </button>
                )}
                <button
                  onClick={() => handleRerun(false)}
                  disabled={actionLoading}
                  title="Re-run all jobs"
                  className="px-3 py-1.5 bg-[#0494f4] hover:bg-[#037acf] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">Rerun All</span>
                </button>
              </div>
            )}

            <a
              href={run.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#0494f4] transition"
              title="Open on GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Layout: 2 Columns (Jobs checklist & Logs Terminal) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#dadce0] dark:divide-[#3c4043]">
          {/* Left Column: Jobs List & Steps (5 cols) */}
          <div className="lg:col-span-4 p-4 space-y-3 bg-[#f8f9fa] dark:bg-[#292a2d] overflow-y-auto max-h-[70vh]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] flex items-center justify-between">
              <span>Jobs & Steps ({jobs.length})</span>
              <button
                onClick={loadJobs}
                className="text-[11px] text-[#0494f4] hover:underline cursor-pointer"
              >
                Refresh
              </button>
            </h3>

            {loadingJobs ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2">
                <div className="w-6 h-6 border-2 border-[#0494f4] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-xs text-[#80868b] italic py-4">No jobs registered for this run.</p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => {
                  const isSelected = selectedJobId === job.id;
                  return (
                    <div
                      key={job.id}
                      onClick={() => handleSelectJob(job.id)}
                      className={`border rounded-2xl p-3 transition cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-[#202124] border-[#0494f4] shadow-xs'
                          : 'bg-white/60 dark:bg-[#202124]/60 border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {job.conclusion === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#34a853] shrink-0" />
                          ) : job.conclusion === 'failure' ? (
                            <XCircle className="w-4 h-4 text-[#ea4335] shrink-0" />
                          ) : job.status === 'in_progress' ? (
                            <RotateCw className="w-4 h-4 text-[#fbbc04] animate-spin shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-[#202124] dark:text-[#e8eaed] truncate">
                            {job.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#80868b]">
                          {job.steps ? `${job.steps.length} steps` : ''}
                        </span>
                      </div>

                      {/* Steps Checklist Preview */}
                      {job.steps && job.steps.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50 space-y-1.5">
                          {job.steps.map((step) => (
                            <div
                              key={step.number}
                              className="flex items-center justify-between gap-2 text-[11px]"
                            >
                              <div className="flex items-center gap-1.5 truncate text-[#5f6368] dark:text-[#9aa0a6]">
                                {step.conclusion === 'success' ? (
                                  <Check className="w-3 h-3 text-[#34a853] shrink-0" />
                                ) : step.conclusion === 'failure' ? (
                                  <XCircle className="w-3 h-3 text-[#ea4335] shrink-0" />
                                ) : step.status === 'in_progress' ? (
                                  <RotateCw className="w-3 h-3 text-[#fbbc04] animate-spin shrink-0" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                                )}
                                <span className="truncate">{step.name}</span>
                              </div>
                              <span className="text-[9px] font-mono text-[#80868b]">#{step.number}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Log Terminal (8 cols) */}
          <div className="lg:col-span-8 p-4 flex flex-col bg-[#18181b] min-h-[400px] max-h-[70vh]">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a] text-xs font-mono text-[#a1a1aa]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#38bdf8]" />
                <span className="font-semibold text-white">Live Execution Logs</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyLogs}
                  disabled={!jobLogs}
                  className="px-2.5 py-1 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-lg flex items-center gap-1 transition text-[11px] cursor-pointer disabled:opacity-50"
                >
                  {copiedLogs ? <Check className="w-3 h-3 text-[#4ade80]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto mt-2 font-mono text-xs text-[#e4e4e7] p-2 leading-5">
              {loadingLogs ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-[#38bdf8] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-[#a1a1aa]">Streaming logs...</p>
                </div>
              ) : jobLogs ? (
                <pre className="whitespace-pre-wrap break-words">{jobLogs}</pre>
              ) : (
                <p className="text-[#71717a] italic py-8 text-center">Select a job on the left to view logs.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
