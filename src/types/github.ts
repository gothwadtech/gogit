export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  total_private_repos?: number;
  owned_private_repos?: number;
  disk_usage?: number;
  collaborators?: number;
  plan?: {
    name: string;
    space: number;
    collaborators: number;
    private_repos: number;
  };
}

export interface GitHubRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
    type: string;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  visibility?: string;
  topics?: string[];
  permissions?: {
    admin: boolean;
    maintain?: boolean;
    push: boolean;
    triage?: boolean;
    pull: boolean;
  };
  license?: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  content?: string;
  encoding?: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  user: {
    login: string;
    avatar_url: string;
  };
  state: 'open' | 'closed';
  locked: boolean;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  body: string | null;
  html_url: string;
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description?: string;
  }>;
  pull_request?: {
    url: string;
    html_url: string;
  };
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: {
    login: string;
    avatar_url: string;
  };
  body: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  html_url: string;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  draft?: boolean;
  comments?: number;
  review_comments?: number;
  commits?: number;
  additions?: number;
  deletions?: number;
  changed_files?: number;
}

export interface GitHubGist {
  id: string;
  description: string | null;
  public: boolean;
  created_at: string;
  updated_at: string;
  comments: number;
  html_url: string;
  files: {
    [filename: string]: {
      filename: string;
      type: string;
      language: string | null;
      raw_url: string;
      size: number;
      content?: string;
    };
  };
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
  resource: string;
}

export interface ZipExtractedFile {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  isBinary: boolean;
  content: string | Uint8Array; // utf-8 string or binary Uint8Array
  base64?: string;
  calculatedSha?: string;
  selected?: boolean;
}

export type DiffStatus = 'new' | 'modified' | 'unchanged' | 'repo_only';

export interface ZipDiffResult {
  path: string;
  zipFile?: ZipExtractedFile;
  repoSha?: string;
  repoSize?: number;
  zipSha?: string;
  zipSize?: number;
  status: DiffStatus;
  selected: boolean;
}

export interface BatchCommitProgress {
  step: 'idle' | 'preparing' | 'blobs' | 'tree' | 'commit' | 'push' | 'completed' | 'error';
  currentFile?: string;
  completedFiles: number;
  totalFiles: number;
  percent: number;
  message: string;
  failedCount?: number;
}

export interface BatchCommitResult {
  success: boolean;
  commitSha: string;
  commitUrl: string;
  totalAttempted: number;
  successfulCount: number;
  failedCount: number;
  successfulFiles: Array<{ path: string; size: number; sha: string }>;
  failedFiles: Array<{ path: string; error: string }>;
  deletedCount: number;
  deletedPaths: string[];
}

// Commits & Time-Travel Graph Types
export interface GitHubCommitAuthor {
  name: string;
  email: string;
  date: string;
}

export interface GitHubCommitItem {
  sha: string;
  node_id: string;
  commit: {
    author: GitHubCommitAuthor;
    committer: GitHubCommitAuthor;
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    url: string;
    comment_count: number;
    verification?: {
      verified: boolean;
      reason: string;
    };
  };
  url: string;
  html_url: string;
  comments_url: string;
  author: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  } | null;
  committer: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  } | null;
  parents: Array<{
    sha: string;
    url: string;
    html_url: string;
  }>;
}

export interface GitHubCommitFile {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
  previous_filename?: string;
}

export interface GitHubCommitDetail extends GitHubCommitItem {
  stats: {
    total: number;
    additions: number;
    deletions: number;
  };
  files: GitHubCommitFile[];
}

// GitHub Actions & CI/CD Types
export interface GitHubWorkflow {
  id: number;
  node_id: string;
  name: string;
  path: string;
  state: 'active' | 'deleted' | 'disabled_fork' | 'disabled_inactivity' | 'disabled_manually';
  created_at: string;
  updated_at: string;
  url: string;
  html_url: string;
  badge_url: string;
}

export interface GitHubWorkflowStep {
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
  number: number;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface GitHubWorkflowJob {
  id: number;
  run_id: number;
  workflow_name?: string;
  head_branch: string;
  run_attempt?: number;
  node_id: string;
  head_sha: string;
  url: string;
  html_url: string;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
  started_at: string;
  completed_at: string | null;
  name: string;
  steps?: GitHubWorkflowStep[];
  check_run_url?: string;
  labels: string[];
  runner_id?: number | null;
  runner_name?: string | null;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  node_id: string;
  head_branch: string;
  head_sha: string;
  path: string;
  display_title: string;
  run_number: number;
  event: string;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'requested' | 'pending';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | 'stale' | null;
  workflow_id: number;
  url: string;
  html_url: string;
  jobs_url: string;
  logs_url: string;
  check_suite_url: string;
  artifacts_url: string;
  cancel_url: string;
  rerun_url: string;
  workflow_url: string;
  head_commit: {
    id: string;
    tree_id: string;
    message: string;
    timestamp: string;
    author: {
      name: string;
      email: string;
    };
    committer: {
      name: string;
      email: string;
    };
  } | null;
  actor: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  } | null;
  triggering_actor?: {
    login: string;
    avatar_url: string;
  } | null;
  run_attempt: number;
  created_at: string;
  updated_at: string;
  run_started_at: string;
}

// GitHub Releases & Tags Types
export interface GitHubReleaseAsset {
  id: number;
  node_id: string;
  name: string;
  label: string | null;
  state: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
  content_type: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  target_commitish: string;
  name: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  body: string | null;
  assets: GitHubReleaseAsset[];
  tarball_url: string;
  zipball_url: string;
}

export interface GitHubOrg {
  login: string;
  id: number;
  avatar_url: string;
  description: string | null;
  url: string;
}

export interface GitHubEvent {
  id: string;
  type: string;
  actor: {
    id: number;
    login: string;
    avatar_url: string;
  };
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload?: {
    action?: string;
    ref?: string;
    ref_type?: string;
    description?: string;
    commits?: Array<{ sha: string; message: string }>;
    issue?: { number: number; title: string; html_url: string };
    pull_request?: { number: number; title: string; html_url: string };
  };
  public: boolean;
  created_at: string;
}

export interface GitHubSearchResult<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

export interface GitHubTag {
  name: string;
  zipball_url: string;
  tarball_url: string;
  commit: {
    sha: string;
    url: string;
  };
  node_id: string;
}

