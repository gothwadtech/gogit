import React, { useState } from 'react';
import {
  ArrowLeft,
  Settings,
  Sun,
  Moon,
  Laptop,
  Code2,
  GitBranch,
  Database,
  Info,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  CheckCircle2,
  Trash2,
  FileCode,
} from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { safeStorage } from '../../utils/safeStorage';

interface SettingsViewProps {
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClose }) => {
  const { theme, setTheme, isDark } = useTheme();

  // Local Editor Preferences
  const [editorFont, setEditorFont] = useState<string>(() => {
    return safeStorage.getItem('gogit_editor_font') || 'JetBrains Mono';
  });
  const [tabSize, setTabSize] = useState<number>(() => {
    return Number(safeStorage.getItem('gogit_tab_size')) || 2;
  });
  const [wordWrap, setWordWrap] = useState<boolean>(() => {
    return safeStorage.getItem('gogit_word_wrap') !== 'false';
  });
  const [defaultBranch, setDefaultBranch] = useState<string>(() => {
    return safeStorage.getItem('gogit_default_branch') || 'main';
  });
  const [savedBanner, setSavedBanner] = useState(false);

  const handleSaveEditorPref = (key: string, value: string) => {
    safeStorage.setItem(key, value);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  const handleClearAppCache = () => {
    if (confirm('Clear local repository tree cache? Your GitHub PAT login will remain safe.')) {
      // Clear non-token items
      const pat = safeStorage.getItem('gothwad_github_pat');
      const themeVal = safeStorage.getItem('gothwad_github_theme');
      safeStorage.clear();
      if (pat) safeStorage.setItem('gothwad_github_pat', pat);
      if (themeVal) safeStorage.setItem('gothwad_github_theme', themeVal);
      alert('Local tree cache cleared successfully!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9fa] dark:bg-[#202124] overflow-y-auto transition-colors duration-200">
      {/* Top Header with Back Navigation */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] rounded-b-2xl sm:rounded-b-3xl px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              id="close-settings-view-btn"
              className="p-2 hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#202124] dark:text-[#e8eaed] rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-5 w-px bg-[#dadce0] dark:border-[#3c4043]" />
            <h2 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#0494f4]" />
              <span>Settings & Studio Preferences</span>
            </h2>
          </div>

          {savedBanner && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#34a853]/15 text-[#34a853] text-xs font-bold rounded-xl border border-[#34a853]/30 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved!</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Settings Content */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5 pb-16">
        {/* 1. Theme Selection Card (Instant Live Mode) */}
        <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-sm space-y-4 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0494f4]/15 text-[#0494f4] rounded-xl">
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed]">
                Theme & Appearance
              </h3>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                Instantly switch between Light Theme, Google Dark Theme (#202124), or System Auto
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* Light Option */}
            <button
              type="button"
              id="theme-opt-light"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                theme === 'light'
                  ? 'border-2 border-[#0494f4] bg-[#0494f4]/10 text-[#0494f4] shadow-sm'
                  : 'border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] hover:border-[#0494f4]'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white text-[#fbbc04] shadow-sm shrink-0 border border-[#dadce0]">
                <Sun className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Light Theme</span>
                  {theme === 'light' && <Check className="w-3.5 h-3.5 text-[#0494f4]" />}
                </div>
                <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
                  Clean crisp light background
                </div>
              </div>
            </button>

            {/* Dark Option */}
            <button
              type="button"
              id="theme-opt-dark"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                theme === 'dark'
                  ? 'border-2 border-[#0494f4] bg-[#0494f4]/10 text-[#0494f4] shadow-sm'
                  : 'border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] hover:border-[#0494f4]'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-[#202124] text-[#0494f4] shadow-sm shrink-0 border border-[#3c4043]">
                <Moon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Dark Theme</span>
                  {theme === 'dark' && <Check className="w-3.5 h-3.5 text-[#0494f4]" />}
                </div>
                <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
                  Google Dark (#202124)
                </div>
              </div>
            </button>

            {/* System Option */}
            <button
              type="button"
              id="theme-opt-system"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                theme === 'system'
                  ? 'border-2 border-[#0494f4] bg-[#0494f4]/10 text-[#0494f4] shadow-sm'
                  : 'border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] hover:border-[#0494f4]'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] shadow-sm shrink-0 border border-[#dadce0] dark:border-[#3c4043]">
                <Laptop className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>System Auto</span>
                  {theme === 'system' && <Check className="w-3.5 h-3.5 text-[#0494f4]" />}
                </div>
                <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
                  Syncs with OS color mode
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Code Viewer & Editor Preferences */}
        <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-sm space-y-4 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#34a853]/15 text-[#34a853] rounded-xl">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed]">
                Code Editor & Viewer
              </h3>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                Configure typography, spacing, and formatting in the Monaco/Prism viewer
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Font Family */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6]">
                Monospace Font Family
              </label>
              <select
                value={editorFont}
                onChange={(e) => {
                  setEditorFont(e.target.value);
                  handleSaveEditorPref('gogit_editor_font', e.target.value);
                }}
                className="w-full px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-mono text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4] cursor-pointer"
              >
                <option value="JetBrains Mono">JetBrains Mono (Default)</option>
                <option value="Fira Code">Fira Code</option>
                <option value="Source Code Pro">Source Code Pro</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>

            {/* Tab Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6]">
                Tab Indentation Size
              </label>
              <select
                value={tabSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTabSize(val);
                  handleSaveEditorPref('gogit_tab_size', String(val));
                }}
                className="w-full px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-mono text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4] cursor-pointer"
              >
                <option value={2}>2 Spaces (Web Standard)</option>
                <option value={4}>4 Spaces</option>
                <option value={8}>8 Spaces</option>
              </select>
            </div>

            {/* Word Wrap */}
            <div className="flex items-center justify-between p-3.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl">
              <div>
                <span className="text-xs font-bold text-[#202124] dark:text-[#e8eaed] block">
                  Soft Word Wrap
                </span>
                <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                  Wrap long lines horizontally
                </span>
              </div>
              <input
                type="checkbox"
                checked={wordWrap}
                onChange={(e) => {
                  setWordWrap(e.target.checked);
                  handleSaveEditorPref('gogit_word_wrap', String(e.target.checked));
                }}
                className="w-4 h-4 accent-[#0494f4] cursor-pointer"
              />
            </div>

            {/* Default Git Branch */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6]">
                Default Branch For New Repos
              </label>
              <input
                type="text"
                value={defaultBranch}
                onChange={(e) => {
                  setDefaultBranch(e.target.value);
                  handleSaveEditorPref('gogit_default_branch', e.target.value);
                }}
                placeholder="main"
                className="w-full px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl text-xs font-mono text-[#202124] dark:text-[#e8eaed] focus:outline-none focus:border-[#0494f4]"
              />
            </div>
          </div>
        </div>

        {/* 3. Cache & Performance Management */}
        <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-sm space-y-4 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#fbbc04]/15 text-[#fbbc04] rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed]">
                Data Cache & Storage
              </h3>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                Manage browser local storage cache and tree sessions
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl">
            <div>
              <h4 className="text-xs font-bold text-[#202124] dark:text-[#e8eaed]">
                Clear Tree & File Cache
              </h4>
              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                Forces fresh fetch from GitHub REST API on next repo view.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearAppCache}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f1f3f4] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-xl border border-[#dadce0] dark:border-[#3c4043] transition cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#0494f4]" />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>

        {/* 4. About Gothwad GoGit */}
        <div className="bg-white dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-sm space-y-3 transition-colors duration-200 text-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#0494f4]" />
            <h3 className="font-bold text-[#202124] dark:text-[#e8eaed]">About Gothwad GoGit Studio</h3>
          </div>
          <p className="text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
            Full-featured GitHub mobile & web workspace. Provides instantaneous atomic ZIP code synchronization, commit time-travel diffing, Actions CI/CD workflows, releases publisher, issues manager, and gists engine.
          </p>
          <div className="pt-2 flex items-center justify-between text-[11px] text-[#80868b] border-t border-[#dadce0] dark:border-[#3c4043]">
            <span>Version 3.5.0-production</span>
            <span>REST API v3 / 2022-11-28</span>
          </div>
        </div>
      </main>
    </div>
  );
};
