import React from 'react';
import { ArrowRight, AlertOctagon, ShieldAlert } from 'lucide-react';
import { ScoreGauge } from '../common/ScoreGauge.tsx';
import { Severity } from '../../types/index.ts';

interface ScoreCardProps {
  score: number;
  maxScore?: number;
  severity: Severity;
  severityLabel: string;
  patternCount: number;
  categoryCount: number;
  summary: string;
  onViewReport: () => void;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  maxScore = 100,
  severity,
  severityLabel,
  patternCount,
  categoryCount,
  summary,
  onViewReport
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 lg:p-8 backdrop-blur-sm">
      {/* Subtle background ambient glow strictly behind the score */}
      <div 
        className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full opacity-15 blur-3xl"
        style={{
          backgroundColor: severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f59e0b' : '#10b981'
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        {/* Left Side: Score & Radial Gauge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <ScoreGauge
            score={score}
            maxScore={maxScore}
            size={148}
            strokeWidth={12}
            severity={severity}
          />

          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase font-mono">
                Silent Security Debt
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs font-mono text-neutral-400">AST & Dependency Audit</span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono tabular-nums">
                {score} <span className="text-lg font-normal text-neutral-500">/ {maxScore}</span>
              </h2>

              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border font-mono ${severity === 'high' ? 'border-red-500/30 bg-red-500/10 text-red-400' : severity === 'medium' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
                <AlertOctagon className="h-3.5 w-3.5" />
                <span>{severityLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-sm text-neutral-300">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <span className="font-medium text-white">{patternCount} findings</span>
              <span className="text-neutral-400">across {categoryCount} categories</span>
            </div>
          </div>
        </div>

        {/* Right Side: Context & Action */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 border-t lg:border-t-0 lg:border-l border-neutral-800/80 pt-4 lg:pt-0 lg:pl-8">
          <div className="text-left lg:text-right space-y-1">
            <p className="text-xs text-neutral-400 max-w-sm">
              {summary}
            </p>
          </div>

          <button
            onClick={onViewReport}
            className="group inline-flex items-center gap-2 rounded-lg bg-neutral-100 px-5 py-2.5 text-xs font-semibold text-neutral-950 hover:bg-white transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
          >
            <span>View Full Report</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
