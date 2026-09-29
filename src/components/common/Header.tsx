import React from 'react';
import { Shield, GitBranch, Terminal, RefreshCw } from 'lucide-react';
import { Repository } from '../../types/index.ts';

interface HeaderProps {
  currentView: 'dashboard' | 'architecture' | 'how-it-works' | 'report' | 'upload';
  setCurrentView: (view: 'dashboard' | 'architecture' | 'how-it-works' | 'report' | 'upload') => void;
  activeRepo: Repository | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  activeRepo
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-md"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 group-hover:border-neutral-700 transition-colors">
            <Shield className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white group-hover:text-neutral-100">
              CodeSentinel
            </span>
          </div>
        </button>

        {/* Zone 2: 4-5 Clean Text Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`transition-colors relative py-1 text-left ${
              currentView === 'dashboard'
                ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-neutral-200'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setCurrentView('architecture')}
            className={`transition-colors relative py-1 text-left ${
              currentView === 'architecture'
                ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-neutral-200'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Architecture
          </button>

          <button
            onClick={() => setCurrentView('how-it-works')}
            className={`transition-colors relative py-1 text-left ${
              currentView === 'how-it-works'
                ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-neutral-200'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            How It Works
          </button>

          <button
            onClick={() => setCurrentView('report')}
            className={`transition-colors relative py-1 text-left ${
              currentView === 'report'
                ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-neutral-200'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Reports
          </button>
        </nav>

        {/* Zone 3: Active Repo & Primary Action */}
        <div className="flex items-center gap-3">
          {/* Active Repo Quick Pill */}
          {activeRepo && <div className="hidden sm:flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/90 px-3 py-1.5 text-xs text-neutral-300">
            <GitBranch className="h-3.5 w-3.5 text-neutral-400" />
            <span className="font-mono font-medium text-neutral-200 max-w-[140px] truncate">{activeRepo.name}</span>
            <span className="text-neutral-500 font-mono">({activeRepo.branch})</span>
          </div>}

          <button
            onClick={() => setCurrentView('upload')}
            className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3.5 py-2 text-xs font-semibold text-neutral-900 hover:bg-white transition-colors whitespace-nowrap shadow-sm"
          >
            <Terminal className="h-3.5 w-3.5 text-neutral-800" />
            <span>Analyze Codebase</span>
          </button>
        </div>
      </div>
    </header>
  );
};
