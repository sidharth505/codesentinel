import React, { useState } from 'react';
import { 
  Download, 
  Printer, 
  Share2, 
  ShieldAlert, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Layers,
  ArrowRight,
  Code
} from 'lucide-react';
import { Repository, Finding, RiskCategory } from '../../types/index.ts';
import { ScoreGauge } from '../common/ScoreGauge.tsx';

interface ReportViewProps {
  repository: Repository;
  reportId: string | null;
  analyzedAt: string;
  overallScore: {
    debtScore: number;
    maxScore: number;
    severityLabel: string;
    patternCount: number;
    summary: string;
  };
  categories: RiskCategory[];
  findings: Finding[];
  onViewFindingDetail: (finding: Finding) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  repository,
  reportId,
  analyzedAt,
  overallScore,
  categories,
  findings,
  onViewFindingDetail
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = (format: 'json' | 'markdown') => {
    if (!reportId) return;
    window.location.href = `/api/reports/${reportId}/export?format=${format}`;
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 space-y-10">
      {/* Report Header Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-8 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
              <FileText className="h-4 w-4 text-red-400" />
              <span>OFFICIAL AUDIT REPORT</span>
              <span className="text-neutral-600">·</span>
              <span>Ref: {reportId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              CodeSentinel Security Debt Report
            </h1>
            <p className="text-xs text-neutral-400 font-mono">
              Target Codebase: <strong className="text-white">{repository.name}</strong> ({repository.branch}) · Language: {repository.language} · Analyzed {new Date(analyzedAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print View</span>
            </button>

            <button
              onClick={() => handleExport('json')}
              disabled={!reportId}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-neutral-100 text-neutral-900 hover:bg-white disabled:opacity-50 transition-colors shadow-sm"
            >
              {downloadSuccess ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Download className="h-3.5 w-3.5" />}
              <span>{downloadSuccess ? 'Report Exported' : 'Export JSON'}</span>
            </button>
            <button
              onClick={() => handleExport('markdown')}
              disabled={!reportId}
              className="inline-flex items-center gap-1.5 border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 disabled:opacity-50 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Markdown</span>
            </button>
          </div>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex items-center gap-5">
            <ScoreGauge
              score={overallScore.debtScore}
              maxScore={overallScore.maxScore}
              size={110}
              strokeWidth={10}
              severity={overallScore.severityLabel === 'HIGH RISK' ? 'high' : overallScore.severityLabel === 'MEDIUM RISK' ? 'medium' : 'low'}
            />
            <div>
              <div className="text-xs font-mono text-neutral-400 uppercase">Overall Score</div>
              <div className="text-3xl font-extrabold font-mono text-white">
                {overallScore.debtScore} <span className="text-sm font-normal text-neutral-500">/ 100</span>
              </div>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${overallScore.severityLabel === 'HIGH RISK' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : overallScore.severityLabel === 'MEDIUM RISK' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                {overallScore.severityLabel}
              </span>
            </div>
          </div>

          <div className="space-y-1 text-xs text-neutral-300 md:col-span-2 border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-6">
            <div className="text-sm font-bold text-white mb-1">
              Audit Scope & Findings
            </div>
            <p className="leading-relaxed">
              Analysis covered <strong>{repository.fileCount} Python files</strong> and identified <strong>{overallScore.patternCount} findings</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Executive Summary */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-neutral-800 pb-2">
          <span>1. Executive Summary</span>
        </h2>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-3 text-sm text-neutral-300 leading-relaxed">
          <p>
            {overallScore.summary}
          </p>
        </div>
      </section>

      {/* Section 2: Risk Breakdown */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-neutral-800 pb-2">
          <span>2. Risk Breakdown</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.key} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{cat.title}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  cat.severity === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  cat.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {cat.severity.toUpperCase()}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {cat.score} <span className="text-xs font-normal text-neutral-500">/ {cat.maxScore}</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                {cat.explanation}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 & 4: Detected Patterns & Evidence */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-neutral-800 pb-2">
          <span>3. Findings & Evidence</span>
        </h2>
        <div className="space-y-4">
          {findings.map((finding) => (
            <div
              key={finding.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    finding.severity === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    finding.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {finding.severity.toUpperCase()}
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {finding.title}
                  </h3>
                </div>

                <button
                  onClick={() => onViewFindingDetail(finding)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  <span>Inspect AST Diff</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                {finding.description}
              </p>

              {/* Evidence line items */}
              <div className="rounded-lg bg-neutral-950 p-3 border border-neutral-800/80 space-y-1.5">
                <span className="text-[11px] font-mono text-neutral-400 block uppercase">
                  Evidence Trace ({finding.evidence.length} occurrences):
                </span>
                <div className="space-y-1">
                  {finding.evidence.map((ev, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-mono text-neutral-400">
                      <span>{ev.file}:{ev.line}</span>
                      {ev.preview && <span className="text-neutral-500 text-[11px] truncate max-w-xs">{ev.preview}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendations */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-neutral-800 pb-2">
          <span>4. Recommendations</span>
        </h2>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
          <div className="space-y-3 text-xs text-neutral-300">
            {findings.length ? findings.map((finding, index) => (
              <div key={finding.id} className="flex items-start gap-3">
                <span className="font-mono text-neutral-500 font-bold">{String(index + 1).padStart(2, '0')}.</span>
                <div><strong className="text-white block font-sans">{finding.title}</strong>{finding.recommendation}</div>
              </div>
            )) : <p className="text-neutral-400">No recommendations were generated because no findings matched the current analysis rules.</p>}
          </div>
        </div>
      </section>
    </div>
  );
};
