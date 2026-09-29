import React from 'react';
import { Eye, FileCode2, CheckCircle2, ShieldAlert, AlertTriangle, AlertCircle } from 'lucide-react';
import { Finding } from '../../types/index.ts';

interface FindingCardProps {
  finding: Finding;
  onViewEvidence: (finding: Finding) => void;
  onToggleReviewed: (id: string) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  onViewEvidence,
  onToggleReviewed
}) => {
  const severityConfig = {
    high: {
      label: 'HIGH',
      badge: 'text-red-400 bg-red-500/10 border-red-500/20',
      icon: <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
    },
    medium: {
      label: 'MEDIUM',
      badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
    },
    low: {
      label: 'LOW',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: <AlertCircle className="h-3.5 w-3.5 text-emerald-400" />
    }
  };

  const config = severityConfig[finding.severity];

  return (
    <div className={`rounded-xl border p-5 transition-colors ${
      finding.reviewed
        ? 'border-neutral-800/60 bg-neutral-900/30 opacity-75'
        : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700/80 hover:bg-neutral-900/70'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${config.badge}`}>
            {config.icon}
            {config.label}
          </span>
          <span className="text-xs text-neutral-500">·</span>
          <span className="text-xs font-medium text-neutral-400">{finding.categoryName}</span>
          {finding.reviewed && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <CheckCircle2 className="h-3 w-3" />
              Reviewed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleReviewed(finding.id)}
            className={`text-xs px-2.5 py-1 rounded border transition-colors ${
              finding.reviewed
                ? 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                : 'border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
            }`}
          >
            {finding.reviewed ? 'Mark Unreviewed' : 'Mark as Reviewed'}
          </button>

          <button
            onClick={() => onViewEvidence(finding)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 text-xs font-medium transition-colors shadow-sm"
          >
            <Eye className="h-3.5 w-3.5 text-neutral-300" />
            <span>View Evidence</span>
          </button>
        </div>
      </div>

      <h4 className="text-base font-semibold text-white mb-1.5">
        {finding.title}
      </h4>

      <p className="text-sm text-neutral-300 mb-4 leading-relaxed">
        {finding.description}
      </p>

      {/* Evidence Pill/List Row */}
      <div className="border-t border-neutral-800/80 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <FileCode2 className="h-3.5 w-3.5 text-neutral-500" />
          <span className="text-xs font-mono font-medium text-neutral-400">
            Evidence:
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {finding.evidence.map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 rounded bg-neutral-950/80 border border-neutral-800 px-2.5 py-1 text-xs font-mono text-neutral-300 hover:border-neutral-700 transition-colors"
            >
              <span className="text-neutral-400">{item.file}</span>
              <span className="text-neutral-600">:</span>
              <span className="text-amber-400 font-bold">{item.line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
