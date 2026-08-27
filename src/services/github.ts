import {
  GitHubUser,
  GitHubRepo,
  GitHubBranch,
  GitHubTreeItem,
  GitHubFileContent,
  GitHubIssue,
  GitHubPullRequest,
  GitHubGist,
  GitHubRateLimit,
  BatchCommitProgress,
  BatchCommitResult,
  GitHubCommitItem,
  GitHubCommitDetail,
  GitHubWorkflow,
  GitHubWorkflowRun,
  GitHubWorkflowJob,
  GitHubRelease,
  GitHubTag,
} from '../types/github';
import { safeStorage } from '../utils/safeStorage';
import { contentToBase64, formatBytes } from '../utils/encoding';

const GITHUB_API_BASE = 'https://api.github.com';

class GitHubService {
  private token: string = '';
  private userScopes: string[] = [];

  constructor() {
    const savedToken = safeStorage.getItem('gothwad_github_pat');
    if (savedToken) {
      this.token = savedToken.trim();
    }
  }

  public setToken(token: string) {
    this.token = token.trim();
    if (this.token) {
      safeStorage.setItem('gothwad_github_pat', this.token);
    } else {
      safeStorage.removeItem('gothwad_github_pat');
    }
  }

  public getToken(): string {
    return this.token;
  }

  public hasToken(): boolean {
    return Boolean(this.token && this.token.length > 5);
  }

  public getScopes(): string[] {
    return this.userScopes;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    });

    const scopesHeader = response.headers.get('x-oauth-scopes');
    if (scopesHeader) {
      this.userScopes = scopesHeader.split(',').map((s) => s.trim());
    }

    if (!response.ok) {
      let errorMsg = `GitHub API Error (${response.status} ${response.statusText})`;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.message) {
          errorMsg = errorJson.message;
          if (errorJson.errors && Array.isArray(errorJson.errors)) {
            const details = errorJson.errors
              .map((e: { message?: string; field?: string; code?: string }) => e.message || e.field || e.code)
              .join(', ');
            if (details) errorMsg += `: ${details}`;
          }
        }
      } catch {
        // use fallback errorMsg
      }
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  // 1. User & Auth
  public async getAuthenticatedUser(): Promise<GitHubUser> {
    return this.request<GitHubUser>('/user');
  }

  public async getRateLimit(): Promise<{ core: GitHubRateLimit; graphql?: GitHubRateLimit }> {
    const res = await this.request<{ resources: { core: GitHubRateLimit; graphql: GitHubRateLimit } }>('/rate_limit');
    return {
      core: res.resources.core,
      graphql: res.resources.graphql,
    };
  }

  // 2. Repositories
  public async getUserRepos(params?: {
    visibility?: 'all' | 'public' | 'private';
    affiliation?: string;
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<GitHubRepo[]> {
    const query = new URLSearchParams({
      per_page: String(params?.per_page || 100),
      page: String(params?.page || 1),
      sort: params?.sort || 'updated',
      direction: params?.direction || 'desc',
      visibility: params?.visibility || 'all',
      affiliation: params?.affiliation || 'owner,collaborator,organization_member',
    });
    return this.request<GitHubRepo[]>(`/user/repos?${query.toString()}`);
  }

  public async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    return this.request<GitHubRepo>(`/repos/${owner}/${repo}`);
  }

  public async createRepo(data: {
    name: string;
    description?: string;
    private: boolean;
    auto_init?: boolean;
    gitignore_template?: string;
    license_template?: string;
  }): Promise<GitHubRepo> {
    return this.request<GitHubRepo>('/user/repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  public async updateRepo(
    owner: string,
    repo: string,
    data: {
      name?: string;
      description?: string;
      private?: boolean;
      default_branch?: string;
      has_issues?: boolean;
      has_wiki?: boolean;
    }
  ): Promise<GitHubRepo> {
    return this.request<GitHubRepo>(`/repos/${owner}/${repo}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  public async deleteRepo(owner: string, repo: string): Promise<void> {
    return this.request<void>(`/repos/${owner}/${repo}`, {
      method: 'DELETE',
    });
  }

  // 3. Branches & Git Tree
  public async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    return this.request<GitHubBranch[]>(`/repos/${owner}/${repo}/branches?per_page=100`);
  }

  public async getTree(owner: string, repo: string, treeSha: string, recursive: boolean = true): Promise<GitHubTreeItem[]> {
    const url = `/repos/${owner}/${repo}/git/trees/${treeSha}${recursive ? '?recursive=1' : ''}`;
    const res = await this.request<{ sha: string; tree: GitHubTreeItem[]; truncated: boolean }>(url);
    return res.tree || [];
  }

  // 4. File Contents
  public async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<{ content: string; sha: string; size: number; isBinary: boolean; rawUrl?: string }> {
    const url = `/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}${ref ? `?ref=${ref}` : ''}`;
    const res = await this.request<GitHubFileContent>(url);

    if (res.type !== 'file' || !res.content) {
      return {
        content: '',
        sha: res.sha,
        size: res.size,
        isBinary: true,
        rawUrl: res.download_url || undefined,
      };
    }

    try {
      // Decode base64 UTF-8 safely
      const cleanBase64 = res.content.replace(/\s/g, '');
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decoder = new TextDecoder('utf-8', { fatal: true });
      const decoded = decoder.decode(bytes);
      return {
        content: decoded,
        sha: res.sha,
        size: res.size,
        isBinary: false,
        rawUrl: res.download_url || undefined,
      };
    } catch {
      // Binary or non UTF-8 file
      return {
        content: res.content,
        sha: res.sha,
        size: res.size,
        isBinary: true,
        rawUrl: res.download_url || undefined,
      };
    }
  }

  public async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string | Uint8Array,
    message: string,
    sha?: string,
    branch?: string
  ): Promise<{ content: GitHubFileContent; commit: { sha: string } }> {
    const { base64 } = contentToBase64(content);

    const body: Record<string, unknown> = {
      message,
      content: base64,
    };
    if (sha) body.sha = sha;
    if (branch) body.branch = branch;

    const url = `/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
    return this.request<{ content: GitHubFileContent; commit: { sha: string } }>(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  public async deleteFile(
    owner: string,
    repo: string,
    path: string,
    sha: string,
    message: string,
    branch?: string
  ): Promise<void> {
    const body: Record<string, unknown> = {
      message,
      sha,
    };
    if (branch) body.branch = branch;

    const url = `/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
    await this.request<void>(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  // 5. High-Speed Resilient Atomic Batch Commit for Multiple Files & Deletions (ZIP Sync)
  public async batchCommitFiles(
    owner: string,
    repo: string,
    branch: string,
    files: Array<{
      path: string;
      content: string | Uint8Array;
      isBinary?: boolean;
    }>,
    commitMessage: string,
    deletedPaths: string[] = [],
    onProgress?: (progress: BatchCommitProgress) => void
  ): Promise<BatchCommitResult> {
    const totalFiles = files.length;
    const totalDeletes = deletedPaths.length;
    if (totalFiles === 0 && totalDeletes === 0) {
      throw new Error('No files selected for commit or deletion.');
    }

    onProgress?.({
      step: 'preparing',
      completedFiles: 0,
      totalFiles: totalFiles + totalDeletes,
      percent: 5,
      message: `Fetching latest commit on branch '${branch}'...`,
    });

    // 1. Get branch reference head
    const refData = await this.request<{ object: { sha: string } }>(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
    const latestCommitSha = refData.object.sha;

    // 2. Get commit's base tree SHA
    const commitData = await this.request<{ tree: { sha: string } }>(
      `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`
    );
    const baseTreeSha = commitData.tree.sha;

    // 3. Create Blobs with parallel concurrency and retry mechanism
    const treeEntries: Array<{ path: string; mode: string; type: 'blob'; sha: string | null }> = [];
    const successfulFiles: Array<{ path: string; size: number; sha: string }> = [];
    const failedFiles: Array<{ path: string; error: string }> = [];

    const CONCURRENCY_LIMIT = 4;
    let completedBlobCount = 0;

    // Helper with exponential retry to upload a single blob safely
    const uploadSingleBlobWithRetry = async (
      file: { path: string; content: string | Uint8Array; isBinary?: boolean },
      retries: number = 3
    ): Promise<{ path: string; mode: '100644'; type: 'blob'; sha: string; size: number } | null> => {
      let lastError: unknown;
      const { base64, byteSize } = contentToBase64(file.content);

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const blobRes = await this.request<{ sha: string }>(`/repos/${owner}/${repo}/git/blobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: base64,
              encoding: 'base64',
            }),
          });

          if (!blobRes || !blobRes.sha) {
            throw new Error(`Invalid response from GitHub Blobs API for ${file.path}`);
          }

          completedBlobCount++;
          const percent = Math.round(10 + (completedBlobCount / Math.max(totalFiles, 1)) * 60);
          onProgress?.({
            step: 'blobs',
            currentFile: file.path,
            completedFiles: completedBlobCount,
            totalFiles: totalFiles + totalDeletes,
            percent,
            message: `Uploaded [${completedBlobCount}/${totalFiles}] ${file.path} (${formatBytes(byteSize)})`,
            failedCount: failedFiles.length,
          });

          return {
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blobRes.sha,
            size: byteSize,
          };
        } catch (err: unknown) {
          lastError = err;
          if (attempt < retries) {
            // Wait with backoff before retry (300ms, 800ms)
            await new Promise((resolve) => setTimeout(resolve, attempt * 350));
          }
        }
      }

      const errorMsg = lastError instanceof Error ? lastError.message : 'Upload failed';
      failedFiles.push({ path: file.path, error: errorMsg });
      console.warn(`[BatchCommit] Failed to upload blob for ${file.path}:`, errorMsg);
      return null;
    };

    // Execute uploads in batches with controlled concurrency
    for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
      const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
      const results = await Promise.all(chunk.map((f) => uploadSingleBlobWithRetry(f)));
      for (const res of results) {
        if (res) {
          treeEntries.push({
            path: res.path,
            mode: res.mode,
            type: res.type,
            sha: res.sha,
          });
          successfulFiles.push({
            path: res.path,
            size: res.size,
            sha: res.sha,
          });
        }
      }
    }

    // Add deleted paths with sha: null
    for (const delPath of deletedPaths) {
      treeEntries.push({
        path: delPath,
        mode: '100644',
        type: 'blob',
        sha: null,
      });
    }

    // If all files failed and there are no deletions, abort
    if (treeEntries.length === 0) {
      const firstErr = failedFiles[0]?.error || 'Failed to upload files';
      throw new Error(`All file uploads failed. ${firstErr}`);
    }

    // 4. Create new Git Tree
    onProgress?.({
      step: 'tree',
      completedFiles: totalFiles,
      totalFiles: totalFiles + totalDeletes,
      percent: 75,
      message: `Constructing Git Tree (${successfulFiles.length} files, ${totalDeletes} removed)...`,
      failedCount: failedFiles.length,
    });

    const newTreeRes = await this.request<{ sha: string }>(`/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeEntries,
      }),
    });

    // 5. Create Commit
    onProgress?.({
      step: 'commit',
      completedFiles: totalFiles + totalDeletes,
      totalFiles: totalFiles + totalDeletes,
      percent: 88,
      message: 'Creating commit object...',
      failedCount: failedFiles.length,
    });

    const defaultMsg =
      successfulFiles.length > 0 && totalDeletes > 0
        ? `feat: sync ${successfulFiles.length} files and remove ${totalDeletes} legacy files via Gothwad ZIP Sync`
        : successfulFiles.length > 0
        ? `feat: sync ${successfulFiles.length} files via Gothwad ZIP Sync`
        : `chore: remove ${totalDeletes} legacy files`;

    const newCommitRes = await this.request<{ sha: string; html_url: string }>(`/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMessage || defaultMsg,
        tree: newTreeRes.sha,
        parents: [latestCommitSha],
      }),
    });

    // 6. Update branch HEAD reference
    onProgress?.({
      step: 'push',
      completedFiles: totalFiles + totalDeletes,
      totalFiles: totalFiles + totalDeletes,
      percent: 95,
      message: `Pushing atomic commit to branch '${branch}'...`,
      failedCount: failedFiles.length,
    });

    await this.request<{ object: { sha: string } }>(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sha: newCommitRes.sha,
        force: false,
      }),
    });

    const isFullySuccessful = failedFiles.length === 0;

    onProgress?.({
      step: 'completed',
      completedFiles: totalFiles + totalDeletes,
      totalFiles: totalFiles + totalDeletes,
      percent: 100,
      message: isFullySuccessful
        ? `Successfully synchronized ${successfulFiles.length} files (${totalDeletes} removed) to ${owner}/${repo} (${branch})!`
        : `Synchronized ${successfulFiles.length} files. (${failedFiles.length} files skipped due to errors).`,
      failedCount: failedFiles.length,
    });

    return {
      success: isFullySuccessful,
      commitSha: newCommitRes.sha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitRes.sha}`,
      totalAttempted: totalFiles,
      successfulCount: successfulFiles.length,
      failedCount: failedFiles.length,
      successfulFiles,
      failedFiles,
      deletedCount: totalDeletes,
      deletedPaths,
    };
  }

  /**
   * Fast Bulk Delete for multiple legacy files in a single atomic commit
   */
  public async deleteBatchFiles(
    owner: string,
    repo: string,
    branch: string,
    deletedPaths: string[],
    commitMessage?: string,
    onProgress?: (progress: BatchCommitProgress) => void
  ): Promise<BatchCommitResult> {
    return this.batchCommitFiles(
      owner,
      repo,
      branch,
      [],
      commitMessage || `chore: remove ${deletedPaths.length} legacy files from repository`,
      deletedPaths,
      onProgress
    );
  }

  // 6. Issues & Pull Requests
  public async getRepoIssues(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<GitHubIssue[]> {
    const issues = await this.request<GitHubIssue[]>(
      `/repos/${owner}/${repo}/issues?state=${state}&per_page=50&sort=updated`
    );
    // Filter out pull requests from issues endpoint if needed, or keep tag
    return issues;
  }

  public async createIssue(
    owner: string,
    repo: string,
    data: { title: string; body?: string; labels?: string[] }
  ): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  public async closeIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(`/repos/${owner}/${repo}/issues/${issueNumber}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'closed' }),
    });
  }

  public async getRepoPullRequests(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<GitHubPullRequest[]> {
    return this.request<GitHubPullRequest[]>(
      `/repos/${owner}/${repo}/pulls?state=${state}&per_page=50&sort=updated`
    );
  }

  public async createPullRequest(
    owner: string,
    repo: string,
    data: { title: string; head: string; base: string; body?: string; draft?: boolean }
  ): Promise<GitHubPullRequest> {
    return this.request<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  // 7. Gists
  public async getUserGists(): Promise<GitHubGist[]> {
    return this.request<GitHubGist[]>('/gists?per_page=50');
  }

  public async createGist(data: {
    description: string;
    public: boolean;
    files: Record<string, { content: string }>;
  }): Promise<GitHubGist> {
    return this.request<GitHubGist>('/gists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  public async deleteGist(gistId: string): Promise<void> {
    return this.request<void>(`/gists/${gistId}`, {
      method: 'DELETE',
    });
  }

  // 8. Starred Repos
  public async getStarredRepos(): Promise<GitHubRepo[]> {
    return this.request<GitHubRepo[]>('/user/starred?per_page=50');
  }

  public async starRepo(owner: string, repo: string): Promise<void> {
    return this.request<void>(`/user/starred/${owner}/${repo}`, {
      method: 'PUT',
      headers: { 'Content-Length': '0' },
    });
  }

  public async unstarRepo(owner: string, repo: string): Promise<void> {
    return this.request<void>(`/user/starred/${owner}/${repo}`, {
      method: 'DELETE',
    });
  }

  // 9. Commits & Time-Travel Graph (Feature 6)
  public async getCommits(
    owner: string,
    repo: string,
    params: { sha?: string; path?: string; per_page?: number; page?: number } = {}
  ): Promise<GitHubCommitItem[]> {
    const query = new URLSearchParams();
    if (params.sha) query.set('sha', params.sha);
    if (params.path) query.set('path', params.path);
    query.set('per_page', String(params.per_page || 30));
    if (params.page) query.set('page', String(params.page));

    return this.request<GitHubCommitItem[]>(`/repos/${owner}/${repo}/commits?${query.toString()}`);
  }

  public async getCommitDetail(owner: string, repo: string, ref: string): Promise<GitHubCommitDetail> {
    return this.request<GitHubCommitDetail>(`/repos/${owner}/${repo}/commits/${ref}`);
  }

  public async getTreeAtCommit(owner: string, repo: string, commitSha: string): Promise<GitHubTreeItem[]> {
    const commit = await this.getCommitDetail(owner, repo, commitSha);
    const treeSha = commit.commit.tree.sha;
    return this.getTree(owner, repo, treeSha);
  }

  // 10. GitHub Actions CI/CD (Feature 4)
  public async getWorkflows(owner: string, repo: string): Promise<GitHubWorkflow[]> {
    const res = await this.request<{ total_count: number; workflows: GitHubWorkflow[] }>(
      `/repos/${owner}/${repo}/actions/workflows`
    );
    return res.workflows || [];
  }

  public async getWorkflowRuns(
    owner: string,
    repo: string,
    params: { workflow_id?: number | string; branch?: string; event?: string; status?: string; per_page?: number } = {}
  ): Promise<{ total_count: number; workflow_runs: GitHubWorkflowRun[] }> {
    const query = new URLSearchParams();
    if (params.branch) query.set('branch', params.branch);
    if (params.event) query.set('event', params.event);
    if (params.status) query.set('status', params.status);
    query.set('per_page', String(params.per_page || 30));

    const endpoint = params.workflow_id
      ? `/repos/${owner}/${repo}/actions/workflows/${params.workflow_id}/runs?${query.toString()}`
      : `/repos/${owner}/${repo}/actions/runs?${query.toString()}`;

    return this.request<{ total_count: number; workflow_runs: GitHubWorkflowRun[] }>(endpoint);
  }

  public async getWorkflowRun(owner: string, repo: string, runId: number): Promise<GitHubWorkflowRun> {
    return this.request<GitHubWorkflowRun>(`/repos/${owner}/${repo}/actions/runs/${runId}`);
  }

  public async getWorkflowRunJobs(owner: string, repo: string, runId: number): Promise<GitHubWorkflowJob[]> {
    const res = await this.request<{ total_count: number; jobs: GitHubWorkflowJob[] }>(
      `/repos/${owner}/${repo}/actions/runs/${runId}/jobs`
    );
    return res.jobs || [];
  }

  public async dispatchWorkflow(
    owner: string,
    repo: string,
    workflowId: number | string,
    data: { ref: string; inputs?: Record<string, string> }
  ): Promise<void> {
    return this.request<void>(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  public async rerunWorkflow(owner: string, repo: string, runId: number, enableDebug = false): Promise<void> {
    return this.request<void>(`/repos/${owner}/${repo}/actions/runs/${runId}/rerun`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable_debug_logging: enableDebug }),
    });
  }

  public async rerunFailedJobs(owner: string, repo: string, runId: number): Promise<void> {
    return this.request<void>(`/repos/${owner}/${repo}/actions/runs/${runId}/rerun-failed-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  }

  public async cancelWorkflowRun(owner: string, repo: string, runId: number): Promise<void> {
    return this.request<void>(`/repos/${owner}/${repo}/actions/runs/${runId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  public async getJobLogs(owner: string, repo: string, jobId: number): Promise<string> {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch logs: ${res.statusText}`);
    }
    return res.text();
  }

  // 11. GitHub Releases & Tags (Feature 8)
  public async getReleases(owner: string, repo: string, per_page = 30): Promise<GitHubRelease[]> {
    return this.request<GitHubRelease[]>(`/repos/${owner}/${repo}/releases?per_page=${per_page}`);
  }

  public async getRelease(owner: string, repo: string, releaseId: number): Promise<GitHubRelease> {
    return this.request<GitHubRelease>(`/repos/${owner}/${repo}/releases/${releaseId}`);
  }

  public async getTags(owner: string, repo: string): Promise<GitHubTag[]> {
    return this.request<GitHubTag[]>(`/repos/${owner}/${repo}/tags?per_page=50`);
  }

  public async createRelease(
    owner: string,
    repo: string,
    data: {
      tag_name: string;
      target_commitish?: string;
      name?: string;
      body?: string;
      draft?: boolean;
      prerelease?: boolean;
      generate_release_notes?: boolean;
    }
  ): Promise<GitHubRelease> {
    return this.request<GitHubRelease>(`/repos/${owner}/${repo}/releases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  public async deleteRelease(owner: string, repo: string, releaseId: number): Promise<void> {
    return this.request<void>(`/repos/${owner}/${repo}/releases/${releaseId}`, {
      method: 'DELETE',
    });
  }

  public async generateReleaseNotes(
    owner: string,
    repo: string,
    tag_name: string,
    target_commitish?: string,
    previous_tag_name?: string
  ): Promise<{ name: string; body: string }> {
    return this.request<{ name: string; body: string }>(`/repos/${owner}/${repo}/releases/generate-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name,
        target_commitish,
        previous_tag_name,
      }),
    });
  }

  // 12. Full Pull Requests Operations & Reviews
  public async getPullRequest(owner: string, repo: string, pullNumber: number): Promise<GitHubPullRequest> {
    return this.request<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls/${pullNumber}`);
  }

  public async mergePullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    data: {
      commit_title?: string;
      commit_message?: string;
      merge_method?: 'merge' | 'squash' | 'rebase';
    } = {}
  ): Promise<{ sha: string; merged: boolean; message: string }> {
    return this.request<{ sha: string; merged: boolean; message: string }>(
      `/repos/${owner}/${repo}/pulls/${pullNumber}/merge`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
  }

  public async closePullRequest(owner: string, repo: string, pullNumber: number): Promise<GitHubPullRequest> {
    return this.request<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls/${pullNumber}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'closed' }),
    });
  }

  public async getPullRequestFiles(owner: string, repo: string, pullNumber: number): Promise<any[]> {
    return this.request<any[]>(`/repos/${owner}/${repo}/pulls/${pullNumber}/files`);
  }

  // 13. Explore, Search & User Activity
  public async searchRepositories(
    query: string,
    sort: 'stars' | 'forks' | 'updated' = 'stars',
    order: 'desc' | 'asc' = 'desc',
    page = 1,
    per_page = 25
  ): Promise<{ total_count: number; items: GitHubRepo[] }> {
    const q = encodeURIComponent(query || 'stars:>1000');
    return this.request<{ total_count: number; items: GitHubRepo[] }>(
      `/search/repositories?q=${q}&sort=${sort}&order=${order}&page=${page}&per_page=${per_page}`
    );
  }

  public async getTrendingRepositories(language?: string): Promise<GitHubRepo[]> {
    let q = 'stars:>500';
    if (language && language !== 'all') {
      q += ` language:${language}`;
    }
    const res = await this.searchRepositories(q, 'stars', 'desc', 1, 30);
    return res.items || [];
  }

  public async getUserEvents(username: string, page = 1): Promise<any[]> {
    return this.request<any[]>(`/users/${username}/events?per_page=30&page=${page}`);
  }

  public async getUserOrgs(): Promise<any[]> {
    return this.request<any[]>('/user/orgs?per_page=50');
  }
}

export const githubService = new GitHubService();
