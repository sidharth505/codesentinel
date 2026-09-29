import React from 'react';
import { GitBranch, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Repository } from '../../types/index.ts';

interface RepositoryHeaderProps {
  repository: Repository;
  repositories: Repository[];
  onSelectRepo: (repo: Repository) => void;
  onRunAnalysis: () => void;
}

export const RepositoryHeader: React.FC<RepositoryHeaderProps> = ({
  repository,
  repositories,
  onSelectRepo,
  onRunAnalysis
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800/80 pb-6 mb-8">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight text-white hover:text-neutral-200 transition-colors"
            >
              <span>{repository.name}</span>
              <ChevronDown className="h-4 w-4 text-neutral-400 mt-1" />
            </button>

            {dropdownOpen && (
              <div 
                className="absolute left-0 top-full mt-2 w-72 rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 shadow-xl z-30"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="px-2 py-1.5 text-[11px] font-medium text-neutral-400">
                  Switch Repository
                </div>
                {repositories.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => {
                      onSelectRepo(repo);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                      repo.id === repository.id
                        ? 'bg-neutral-800 text-white font-medium'
                        : 'text-neutral-300 hover:bg-neutral-800/50 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-mono">{repo.name}</div>
                      <div className="text-[11px] text-neutral-400">{repo.language} · {repo.fileCount} files</div>
                    </div>
                    {repo.id === repository.id && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-neutral-800 bg-neutral-900/60 text-xs font-mono text-neutral-300">
            <GitBranch className="h-3 w-3 text-neutral-400" />
            {repository.branch}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
          {repository.lastAnalyzed && <span>Last analyzed: <span className="text-neutral-200 font-medium">{new Date(repository.lastAnalyzed).toLocaleString()}</span></span>}
          <span>{repository.fileCount} Python files analyzed</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRunAnalysis}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
        >
          Analyze Another Repository
        </button>
      </div>
    </div>
  );
};
