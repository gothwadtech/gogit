import React, { useState } from 'react';
import {
  Github,
  ExternalLink,
  Key,
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { githubService } from '../services/github';
import { GitHubUser } from '../types/github';
import { useTheme } from '../context/ThemeContext';

interface AuthScreenProps {
  onSuccess: (user: GitHubUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const { theme, setTheme, isDark } = useTheme();
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Pre-configured GitHub PAT creation link with all essential scopes for full access
  const githubPatUrl =
    'https://github.com/settings/tokens/new?description=Gothwad%20Github%20Full%20Access&scopes=repo,workflow,write:packages,delete_repo,admin:org,admin:public_key,admin:repo_hook,user,project,gist,codespace';

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = tokenInput.trim();
    if (!token) {
      setError('Please paste or enter your GitHub Personal Access Token (PAT).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      githubService.setToken(token);
      const user = await githubService.getAuthenticatedUser();
      onSuccess(user);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to authenticate with GitHub. Please check your token.'
      );
      githubService.setToken(''); // Reset on failure
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTokenInput(text.trim());
        setError(null);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] flex flex-col items-center justify-center p-4 selection:bg-[#0494f4]/20 selection:text-[#0494f4] relative transition-colors duration-200">
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setTheme('light')}
          title="Light Theme"
          className={`p-1.5 rounded-xl transition ${
            theme === 'light'
              ? 'bg-[#0494f4] text-white shadow-sm'
              : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
          }`}
        >
          <Sun className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          title="Dark Theme"
          className={`p-1.5 rounded-xl transition ${
            theme === 'dark'
              ? 'bg-[#0494f4] text-white shadow-sm'
              : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
          }`}
        >
          <Moon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setTheme('system')}
          title="System Auto"
          className={`p-1.5 rounded-xl transition ${
            theme === 'system'
              ? 'bg-[#0494f4] text-white shadow-sm'
              : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed]'
          }`}
        >
          <Laptop className="w-4 h-4" />
        </button>
      </div>

      <div className="w-full max-w-lg space-y-6">
        {/* App Logo & Title */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0494f4] text-white shadow-md">
            <Github className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202124] dark:text-[#e8eaed]">
              Gothwad Github
            </h1>
            <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1 max-w-md mx-auto">
              Mobile GitHub Studio: Full Repository Manager, In-Browser Code Editor & ZIP Codebase Sync Engine
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 sm:p-7 shadow-sm space-y-5 transition-colors duration-200">
          {/* Quick Create Token Link Banner */}
          <div className="bg-[#f1f3f4] dark:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#0494f4]/15 text-[#0494f4] rounded-xl shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-1.5">
                  1-Click Full-Access PAT Creator
                </h2>
                <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-0.5 leading-relaxed">
                  Need a token? Click below to open GitHub with all essential permissions (<code className="text-[#0494f4]">repo</code>, <code className="text-[#0494f4]">delete_repo</code>, <code className="text-[#0494f4]">workflow</code>, <code className="text-[#0494f4]">gist</code>, <code className="text-[#0494f4]">user</code>) pre-selected!
                </p>
              </div>
            </div>

            <a
              id="github-create-pat-link"
              href={githubPatUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#0494f4] hover:bg-[#0382d6] text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-98"
            >
              <span>Generate Full-Access Token on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* PAT Input Form */}
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="pat-input" className="text-xs font-semibold text-[#202124] dark:text-[#e8eaed] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#0494f4]" />
                  Personal Access Token (PAT)
                </label>
                <button
                  type="button"
                  onClick={handleQuickPaste}
                  className="text-[11px] text-[#0494f4] hover:underline transition font-medium"
                >
                  Paste from clipboard
                </button>
              </div>

              <div className="relative">
                <input
                  id="pat-input"
                  type={showToken ? 'text' : 'password'}
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full pl-3.5 pr-10 py-3 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] focus:border-[#0494f4] focus:ring-1 focus:ring-[#0494f4] rounded-xl text-xs sm:text-sm font-mono text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] transition"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[#ea4335]/10 border border-[#ea4335]/30 rounded-xl text-xs text-[#ea4335] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <button
              id="connect-github-btn"
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="w-full py-3 px-4 bg-[#0494f4] hover:bg-[#0382d6] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 active:scale-98"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying GitHub Token...</span>
                </>
              ) : (
                <>
                  <span>Connect to GitHub</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy & Security Note */}
          <div className="pt-2 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#34a853]" />
              <span>Token stays client-side in browser storage</span>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-[#0494f4] hover:underline flex items-center gap-1 font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showGuide ? 'Hide Guide' : 'Setup Guide'}</span>
            </button>
          </div>
        </div>

        {/* Step-by-step Setup Guide (Collapsible) */}
        {showGuide && (
          <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-5 shadow-sm space-y-3 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            <h3 className="font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-[#fbbc04]" />
              Quick 30-Second Guide (Token kaise banaye):
            </h3>
            <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
              <li>
                Click on the <span className="text-[#0494f4] font-semibold">"Generate Full-Access Token on GitHub"</span> button above.
              </li>
              <li>
                GitHub will open with all permissions checked (<code>repo</code>, <code>delete_repo</code>, <code>workflow</code>, <code>gist</code>, <code>user</code>).
              </li>
              <li>
                Scroll down to the bottom of the GitHub page and click the green <strong className="text-[#34a853]">"Generate token"</strong> button.
              </li>
              <li>
                Copy the generated token string (starts with <code className="text-[#0494f4]">ghp_</code>) and paste it in the box above.
              </li>
            </ol>
            <div className="mt-2 p-2.5 bg-[#f1f3f4] dark:bg-[#303134] rounded-xl border border-[#dadce0] dark:border-[#3c4043] text-[11px]">
              ⚡ <strong>Why PAT?</strong> It grants you direct access to create, edit, commit files, unzip and push codebases, and manage issues securely without third-party server proxies.
            </div>
          </div>
        )}

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
          <div className="p-2.5 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl">
            <CheckCircle2 className="w-4 h-4 text-[#0494f4] mx-auto mb-1" />
            <span>Create & Manage Repos</span>
          </div>
          <div className="p-2.5 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl">
            <CheckCircle2 className="w-4 h-4 text-[#0494f4] mx-auto mb-1" />
            <span>In-Browser Code Editor</span>
          </div>
          <div className="p-2.5 bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl">
            <CheckCircle2 className="w-4 h-4 text-[#0494f4] mx-auto mb-1" />
            <span>Smart ZIP Sync & Diff</span>
          </div>
        </div>
      </div>
    </div>
  );
};
