import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  Circle, 
  Terminal
} from 'lucide-react';
import { Repository, JobProgress } from '../../types/index.ts';
import { subscribeToAnalysisProgress } from '../../services/api.ts';

interface AnalysisProgressProps {
  repository: Repository;
  jobId?: string | null;
  onComplete: (reportId?: string) => void;
  onError: (error: Error) => void;
}

interface StepItem {
  id: string;
  label: string;
}

const PIPELINE_STEPS: StepItem[] = [
  { id: 'upload', label: 'Repository uploaded' },
  { id: 'discover', label: 'Files discovered' },
  { id: 'structure', label: 'Analyzing code structure' },
  { id: 'patterns', label: 'Detecting architectural patterns' },
  { id: 'semantic', label: 'Preparing finding details' },
  { id: 'debt', label: 'Calculating security debt' },
  { id: 'report', label: 'Generating report' },
];

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  repository,
  jobId,
  onComplete,
  onError
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [fileProgress, setFileProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  const [livePercent, setLivePercent] = useState<number | null>(null);

  useEffect(() => {
    if (!jobId) {
      onError(new Error('The analysis job was not created.'));
      return;
    }

    return subscribeToAnalysisProgress(
      jobId,
      (progress: JobProgress) => {
        setCurrentStepIndex(progress.currentStepIndex);
        setFileProgress(progress.processedFiles);
        setTotalFiles(progress.totalFiles);
        setCurrentFileName(progress.currentFile);
        setLivePercent(progress.percent);
      },
      onComplete,
      (err) => onError(err instanceof Error ? err : new Error('Analysis failed'))
    );
  }, [jobId, onComplete, onError]);

  const percentage = livePercent ?? 0;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/80 text-xs font-mono text-neutral-300">
          <Terminal className="h-3.5 w-3.5 text-neutral-400" />
          <span>CodeSentinel Core Pipeline</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Analyzing {repository.name}
        </h2>
        <p className="text-xs text-neutral-400">
          Processing repository files and generating findings
        </p>
      </div>

      {/* Main Progress Container */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-6">
        {/* Progress Bar & Counters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-300 font-medium">
              Analyzing <strong className="text-white">{fileProgress}</strong> / {totalFiles} files
            </span>
            <span className="text-amber-400 font-bold tabular-nums">
              {Math.min(percentage, 100)}%
            </span>
          </div>

          <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-neutral-500 truncate">
            {currentFileName && <>
              <span className="text-neutral-400">Inspecting:</span>
              <span className="text-neutral-300 truncate">{currentFileName}</span>
            </>}
          </div>
        </div>

        {/* Step-by-Step Status List */}
        <div className="space-y-3 pt-2 border-t border-neutral-800/80">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between py-1.5 px-3 rounded-lg text-xs font-mono transition-colors ${
                  isCurrent 
                    ? 'bg-neutral-800/80 text-white font-medium border border-neutral-700/60'
                    : isCompleted
                    ? 'text-neutral-300'
                    : 'text-neutral-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isCompleted && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  {isCurrent && (
                    <Loader2 className="h-4 w-4 text-amber-400 animate-spin shrink-0" />
                  )}
                  {isPending && (
                    <Circle className="h-4 w-4 text-neutral-700 shrink-0" />
                  )}

                  <span>{step.label}</span>
                </div>

                <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                  {isCompleted ? 'Done' : isCurrent ? 'Running' : 'Queued'}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
