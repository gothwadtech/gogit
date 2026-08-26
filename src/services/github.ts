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
} from '../types/github';

const GITHUB_API_BASE = 'https://api.github.com';

class GitHubService {
  private token: string = '';
  private userScopes: string[] = [];

  constructor() {
    const savedToken = localStorage.getItem('gothwad_github_pat');
    if (savedToken) {
      this.token = savedToken.trim();
    }
  }

  public setToken(token: string) {
    this.token = token.trim();
    if (this.token) {
      localStorage.setItem('gothwad_github_pat', this.token);
    } else {
      localStorage.removeItem('gothwad_github_pat');
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
    contentUtf8: string,
    message: string,
    sha?: string,
    branch?: string
  ): Promise<{ content: GitHubFileContent; commit: { sha: string } }> {
    // UTF-8 to Base64
    const encoder = new TextEncoder();
    const bytes = encoder.encode(contentUtf8);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Content = btoa(binary);

    const body: Record<string, unknown> = {
      message,
      content: base64Content,
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

  // 5. High-Speed Atomic Batch Commit for Multiple Files & Deletions (ZIP Sync)
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
  ): Promise<{ commitSha: string; commitUrl: string }> {
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

    // 3. Create Blobs with live progress
    const treeEntries: Array<{ path: string; mode: string; type: 'blob'; sha: string | null }> = [];

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const percent = Math.round(10 + (i / Math.max(totalFiles, 1)) * 60);

      onProgress?.({
        step: 'blobs',
        currentFile: file.path,
        completedFiles: i,
        totalFiles: totalFiles + totalDeletes,
        percent,
        message: `Uploading blob ${i + 1}/${totalFiles}: ${file.path}`,
      });

      let blobContent = '';
      let encoding = 'utf-8';

      if (typeof file.content === 'string') {
        blobContent = file.content;
        encoding = 'utf-8';
      } else {
        // Binary Uint8Array -> base64
        let binary = '';
        const bytes = file.content;
        for (let j = 0; j < bytes.length; j++) {
          binary += String.fromCharCode(bytes[j]);
        }
        blobContent = btoa(binary);
        encoding = 'base64';
      }

      const blobRes = await this.request<{ sha: string }>(`/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: blobContent,
          encoding,
        }),
      });

      treeEntries.push({
        path: file.path,
        mode: '100644', // normal file
        type: 'blob',
        sha: blobRes.sha,
      });
    }

    // Add deleted paths to the tree entries with sha: null (Git Tree API deletes file from base_tree)
    for (const delPath of deletedPaths) {
      treeEntries.push({
        path: delPath,
        mode: '100644',
        type: 'blob',
        sha: null,
      });
    }

    // 4. Create new Git Tree
    onProgress?.({
      step: 'tree',
      completedFiles: totalFiles,
      totalFiles: totalFiles + totalDeletes,
      percent: 75,
      message: `Building Git Tree (${totalFiles} updated, ${totalDeletes} removed)...`,
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
    });

    const defaultMsg =
      totalFiles > 0 && totalDeletes > 0
        ? `feat: sync ${totalFiles} files and remove ${totalDeletes} legacy files via Gothwad ZIP Sync`
        : totalFiles > 0
        ? `feat: sync ${totalFiles} files via Gothwad ZIP Sync`
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
      message: `Pushing changes to branch '${branch}'...`,
    });

    await this.request<{ object: { sha: string } }>(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sha: newCommitRes.sha,
        force: false,
      }),
    });

    onProgress?.({
      step: 'completed',
      completedFiles: totalFiles + totalDeletes,
      totalFiles: totalFiles + totalDeletes,
      percent: 100,
      message: `Successfully synchronized (${totalFiles} updated, ${totalDeletes} deleted) to ${owner}/${repo} (${branch})!`,
    });

    return {
      commitSha: newCommitRes.sha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitRes.sha}`,
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
  ): Promise<{ commitSha: string; commitUrl: string }> {
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
}

export const githubService = new GitHubService();
