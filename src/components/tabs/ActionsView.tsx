import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  RotateCw,
  Clock,
  Ban,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  GitBranch,
  Layers,
  Terminal,
  Activity,
  Sliders,
} from 'lucide-react';
import { GitHubRepo, GitHubBranch, GitHubWorkflow, GitHubWorkflowRun } from '../../types/github';
import { githubService } from '../../services/github';
import { RunWorkflowModal } from '../modals/RunWorkflowModal';
import { WorkflowRunDetailModal } from '../modals/WorkflowRunDetailModal';

interface ActionsViewProps {
  repo: GitHubRepo;
  branches: GitHubBranch[];
  selectedBranch: string;
}

export const ActionsView: React.FC<ActionsViewProps> = ({
  repo,
  branches,
  selectedBranch,
}) => {
  const [workflows, setWorkflows] = useState<GitHubWorkflow[]>([]);
  const [runs, setRuns] = useState<GitHubWorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');

  // Modals
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState<GitHubWorkflowRun | null>(null);

  useEffect(() => {
    loadWorkflowsAndRuns();
  }, [repo.name]);

  const loadWorkflowsAndRuns = async () => {
    try {
      setLoading(true);
      setError(null);
      const [wfList, runsRes] = await Promise.all([
        githubService.getWorkflows(repo.owner.login, repo.name).catch(() => []),
        githubService.getWorkflowRuns(repo.owner.login, repo.name, { per_page: 50 }).catch(() => ({
          total_count: 0,
          workflow_runs: [],
        })),
      ]);

      setWorkflows(wfList);
      setRuns(runsRes.workflow_runs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load GitHub Actions workflows');
    } finally {
      setLoading(false);
    }
  };

  const filteredRuns = runs.filter((r) => {
    if (selectedWorkflowId !== 'all' && String(r.workflow_id) !== String(selectedWorkflowId)) {
      return false;
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'success' && r.conclusion !== 'success') return false;
      if (statusFilter === 'failure' && r.conclusion !== 'failure') return false;
      if (statusFilter === 'in_progress' && r.status !== 'in_progress') return false;
      if (statusFilter === 'queued' && r.status !== 'queued') return false;
    }
    if (eventFilter !== 'all' && r.event !== eventFilter) {
      return false;
    }
    return true;
  });

  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === 'in_progress' || status === 'queued') {
      return <RotateCw className="w-4 h-4 text-[#fbbc04] animate-spin shrink-0" />;
    }
    if (conclusion === 'success') {
      return <CheckCircle2 className="w-4 h-4 text-[#34a853] shrink-0" />;
    }
    if (conclusion === 'failure') {
      return <XCircle className="w-4 h-4 text-[#ea4335] shrink-0" />;
    }
    if (conclusion === 'cancelled') {
      return <Ban className="w-4 h-4 text-gray-500 shrink-0" />;
    }
    return <Clock className="w-4 h-4 text-gray-400 shrink-0" />;
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
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
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed]">
                GitHub Actions & CI/CD Hub
              </h3>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                Monitor test suites, build pipelines, rerun jobs, and dispatch manual workflows.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRunModal(true)}
              disabled={workflows.length === 0}
              className="px-3.5 py-2 bg-[#0494f4] hover:bg-[#037acf] active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Workflow</span>
            </button>

            <button
              onClick={loadWorkflowsAndRuns}
              disabled={loading}
              title="Refresh Actions"
              className="p-2 bg-[#f1f3f4] dark:bg-[#292a2d] hover:bg-[#e8eaed] dark:hover:bg-[#303134] text-[#202124] dark:text-[#e8eaed] rounded-xl border border-[#dadce0] dark:border-[#3c4043] transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0494f4] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Workflows Pills */}
        {workflows.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedWorkflowId('all')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
                selectedWorkflowId === 'all'
                  ? 'bg-[#0494f4] text-white shadow-xs'
                  : 'bg-[#f1f3f4] dark:bg-[#292a2d] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
              }`}
            >
              All Workflows ({workflows.length})
            </button>
            {workflows.map((wf) => (
              <button
                key={wf.id}
                onClick={() => setSelectedWorkflowId(wf.id)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                  selectedWorkflowId === wf.id
                    ? 'bg-[#0494f4] text-white shadow-xs'
                    : 'bg-[#f1f3f4] dark:bg-[#292a2d] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
                }`}
              >
                <span>{wf.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-semibold text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failed</option>
            <option value="in_progress">Running</option>
            <option value="queued">Queued</option>
          </select>

          {/* Event Filter */}
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#f8f9fa] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-semibold text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4] cursor-pointer"
          >
            <option value="all">All Trigger Events</option>
            <option value="push">Push</option>
            <option value="pull_request">Pull Request</option>
            <option value="workflow_dispatch">Manual Dispatch</option>
            <option value="schedule">Scheduled Cron</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-[#ea4335]/10 border border-[#ea4335]/20 rounded-2xl text-[#ea4335] text-xs">
          {error}
        </div>
      )}

      {/* Runs List */}
      <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] flex items-center justify-between">
          <span>Workflow Runs ({filteredRuns.length})</span>
          {runs.length > 0 && (
            <span className="text-[11px] font-normal text-[#80868b]">Showing latest runs</span>
          )}
        </h4>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#0494f4] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Loading workflow runs...</p>
          </div>
        ) : workflows.length === 0 && runs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Terminal className="w-8 h-8 text-[#80868b] mx-auto opacity-60" />
            <p className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed]">
              No GitHub Actions Workflows Found
            </p>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-sm mx-auto">
              Add workflow YAML files to <code className="font-mono text-[#0494f4]">.github/workflows/</code> to enable CI/CD automation.
            </p>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            No runs match the selected filters.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredRuns.map((run) => {
              const actorLogin = run.actor?.login || run.triggering_actor?.login || 'github-actions';
              const actorAvatar = run.actor?.avatar_url || run.triggering_actor?.avatar_url;

              return (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(run)}
                  className="bg-[#f8f9fa] dark:bg-[#292a2d] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#0494f4] rounded-2xl p-3.5 sm:p-4 transition cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5">{getStatusIcon(run.status, run.conclusion)}</div>

                      <div className="space-y-1 min-w-0">
                        <h5 className="text-xs sm:text-sm font-semibold text-[#202124] dark:text-[#e8eaed] truncate group-hover:text-[#0494f4] transition-colors">
                          {run.display_title || run.name}
                        </h5>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5f6368] dark:text-[#9aa0a6] font-mono">
                          <span className="font-bold text-[#202124] dark:text-[#e8eaed]">{run.name}</span>
                          <span>#{run.run_number}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#0494f4]">
                            <GitBranch className="w-3 h-3" /> {run.head_branch}
                          </span>
                          <span>•</span>
                          <span>{run.head_sha.substring(0, 7)}</span>
                        </div>

                        {/* Actor & Timestamp */}
                        <div className="flex items-center gap-2 text-[11px] text-[#80868b] pt-0.5">
                          <div className="flex items-center gap-1.5">
                            {actorAvatar ? (
                              <img src={actorAvatar} alt={actorLogin} className="w-4 h-4 rounded-full object-cover" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-[#dadce0] dark:bg-[#3c4043] flex items-center justify-center text-[9px]">
                                {actorLogin.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium text-[#202124] dark:text-[#e8eaed]">{actorLogin}</span>
                          </div>
                          <span>•</span>
                          <span>triggered via {run.event}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(run.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#80868b] group-hover:translate-x-0.5 transition-transform shrink-0 mt-2" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trigger Run Modal */}
      {showRunModal && (
        <RunWorkflowModal
          repo={repo}
          workflows={workflows}
          branches={branches}
          selectedBranch={selectedBranch}
          onClose={() => setShowRunModal(false)}
          onSuccess={() => {
            loadWorkflowsAndRuns();
          }}
        />
      )}

      {/* Run Detail Modal */}
      {selectedRun && (
        <WorkflowRunDetailModal
          repo={repo}
          run={selectedRun}
          onClose={() => setSelectedRun(null)}
          onRefreshRun={() => loadWorkflowsAndRuns()}
        />
      )}
    </div>
  );
};
