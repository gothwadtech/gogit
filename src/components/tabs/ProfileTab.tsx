import React, { useState } from 'react';
import {
  User,
  Shield,
  Key,
  Database,
  ExternalLink,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { GitHubUser, GitHubRateLimit } from '../../types/github';
import { githubService } from '../../services/github';
import { useTheme } from '../../context/ThemeContext';

interface ProfileTabProps {
  user: GitHubUser;
  rateLimit: GitHubRateLimit | null;
  onRefresh: () => void;
  onLogout: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  rateLimit,
  onLogout,
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const [newToken, setNewToken] = useState('');
  const [updatingToken, setUpdatingToken] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim()) return;

    try {
      setUpdatingToken(true);
      setUpdateMsg(null);
      githubService.setToken(newToken.trim());
      await githubService.getAuthenticatedUser();
      setUpdateMsg({ type: 'success', text: 'Token updated successfully! Reloading...' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      setUpdateMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Invalid token provided',
      });
    } finally {
      setUpdatingToken(false);
    }
  };

  const rateRemaining = rateLimit?.remaining ?? 5000;
  const rateTotal = rateLimit?.limit ?? 5000;
  const ratePercentage = Math.round((rateRemaining / rateTotal) * 100);

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 sm:p-7 shadow-sm space-y-5 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <img
            src={user.avatar_url}
            alt={user.login}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-[#0494f4] shadow-md"
          />

          <div className="flex-1 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#202124] dark:text-[#e8eaed]">
                  {user.name || user.login}
                </h2>
                <p className="text-xs sm:text-sm text-[#0494f4] font-mono">@{user.login}</p>
              </div>

              <a
                href={user.html_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#f1f3f4] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-[#202124] dark:text-[#e8eaed] text-xs font-semibold rounded-xl border border-[#dadce0] dark:border-[#3c4043] transition"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {user.bio && (
              <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] pt-1 max-w-xl leading-relaxed">
                {user.bio}
              </p>
            )}

            <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs text-[#5f6368] dark:text-[#9aa0a6] pt-2 flex-wrap">
              {user.company && <span>💼 {user.company}</span>}
              {user.location && <span>📍 {user.location}</span>}
              <span>📅 Joined {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-3 text-center">
            <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] block">Public Repos</span>
            <span className="text-lg font-bold text-[#202124] dark:text-[#e8eaed] font-mono">{user.public_repos}</span>
          </div>

          <div className="bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-3 text-center">
            <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] block">Private Repos</span>
            <span className="text-lg font-bold text-[#202124] dark:text-[#e8eaed] font-mono">
              {user.total_private_repos ?? 'Full Access'}
            </span>
          </div>

          <div className="bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-3 text-center">
            <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] block">Followers</span>
            <span className="text-lg font-bold text-[#202124] dark:text-[#e8eaed] font-mono">{user.followers}</span>
          </div>

          <div className="bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-3 text-center">
            <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] block">Following</span>
            <span className="text-lg font-bold text-[#202124] dark:text-[#e8eaed] font-mono">{user.following}</span>
          </div>
        </div>
      </div>

      {/* Theme Selection Settings */}
      <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0494f4]/15 text-[#0494f4] rounded-xl">
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed]">
                Theme Preferences
              </h3>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                Choose between Light Theme, Google Dark Theme (#202124), or System Auto
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
              theme === 'light'
                ? 'border-[#0494f4] bg-[#0494f4]/10 text-[#0494f4]'
                : 'border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] hover:border-[#0494f4]'
            }`}
          >
            <div className="p-2 rounded-xl bg-white text-[#fbbc04] shadow-sm shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">Light Theme</div>
              <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">Clean white surface</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
              theme === 'dark'
                ? 'border-[#0494f4] bg-[#0494f4]/10 text-[#0494f4]'
                : 'border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] hover:border-[#0494f4]'
            }`}
          >
            <div className="p-2 rounded-xl bg-[#202124] text-[#0494f4] shadow-sm shrink-0 border border-[#3c4043]">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">Dark Theme</div>
              <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">Google Dark (#202124)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
              theme === 'system'
                ? 'border-[#0494f4] bg-[#0494f4]/10 text-[#0494f4]'
                : 'border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] hover:border-[#0494f4]'
            }`}
          >
            <div className="p-2 rounded-xl bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] shadow-sm shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">System Auto</div>
              <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">Follows device settings</div>
            </div>
          </button>
        </div>
      </div>

      {/* API Rate Limits Card */}
      <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-sm space-y-3 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#0494f4]" />
            <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">GitHub API Rate Limit</h3>
          </div>
          <span className="text-xs font-mono text-[#0494f4] font-semibold">
            {rateRemaining.toLocaleString()} / {rateTotal.toLocaleString()} ({ratePercentage}%)
          </span>
        </div>

        <div className="w-full h-2.5 bg-[#f1f3f4] dark:bg-[#303134] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0494f4] rounded-full transition-all duration-300"
            style={{ width: `${ratePercentage}%` }}
          />
        </div>

        {rateLimit && (
          <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
            Quota resets at {new Date(rateLimit.reset * 1000).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Security & Active PAT Management */}
      <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-[#0494f4]" />
          <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">Update Personal Access Token (PAT)</h3>
        </div>

        <form onSubmit={handleUpdateToken} className="space-y-3">
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            You can replace your current PAT at any time without losing any settings.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              placeholder="Paste new GitHub PAT..."
              className="flex-1 px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs sm:text-sm font-mono text-[#202124] dark:text-[#e8eaed] placeholder:text-[#80868b] focus:outline-none focus:border-[#0494f4]"
            />
            <button
              type="submit"
              disabled={updatingToken || !newToken.trim()}
              className="px-5 py-2.5 bg-[#0494f4] hover:bg-[#0382d6] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition shrink-0"
            >
              {updatingToken ? 'Validating...' : 'Update PAT'}
            </button>
          </div>

          {updateMsg && (
            <p
              className={`text-xs ${
                updateMsg.type === 'success' ? 'text-[#34a853]' : 'text-[#ea4335]'
              }`}
            >
              {updateMsg.text}
            </p>
          )}
        </form>

        {/* Scopes Overview */}
        <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#202124] dark:text-[#e8eaed]">
            <Shield className="w-3.5 h-3.5 text-[#34a853]" />
            <span>Recommended Scopes for Full Functionality:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono text-[#5f6368] dark:text-[#9aa0a6]">
            <div className="p-1.5 bg-[#f8f9fa] dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-[#3c4043]">
              ✔ repo (all)
            </div>
            <div className="p-1.5 bg-[#f8f9fa] dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-[#3c4043]">
              ✔ delete_repo
            </div>
            <div className="p-1.5 bg-[#f8f9fa] dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-[#3c4043]">
              ✔ workflow
            </div>
            <div className="p-1.5 bg-[#f8f9fa] dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-[#3c4043]">
              ✔ gist
            </div>
            <div className="p-1.5 bg-[#f8f9fa] dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-[#3c4043]">
              ✔ user
            </div>
            <div className="p-1.5 bg-[#f8f9fa] dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-[#3c4043]">
              ✔ admin:org
            </div>
          </div>
        </div>
      </div>

      {/* Disconnect Account */}
      <div className="p-4 bg-[#ea4335]/10 border border-[#ea4335]/30 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-[#ea4335]">Disconnect GitHub Account</h4>
          <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
            Removes the PAT from this browser session. You will need to enter your token again to log in.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#ea4335] hover:bg-[#d93025] text-white text-xs font-bold rounded-xl shadow-sm transition shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Disconnect / Logout</span>
        </button>
      </div>
    </div>
  );
};
