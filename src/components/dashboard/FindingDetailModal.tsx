import React from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  FileCode, 
  Copy, 
  Check, 
  Lightbulb, 
  AlertOctagon,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Finding } from '../../types/index.ts';
import { requestRemediation } from '../../services/api.ts';

interface FindingDetailModalProps {
  finding: Finding | null;
  onClose: () => void;
  onToggleReviewed: (id: string) => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  onClose,
  onToggleReviewed
}) => {
  const [copied, setCopied] = React.useState(false);
  const [activeEvidenceIndex, setActiveEvidenceIndex] = React.useState(0);
  const [generatedRemediation, setGeneratedRemediation] = React.useState<Awaited<ReturnType<typeof requestRemediation>> | null>(null);
  const [isGeneratingRemediation, setIsGeneratingRemediation] = React.useState(false);
  const [remediationError, setRemediationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setGeneratedRemediation(null);
    setRemediationError(null);
  }, [finding?.id]);

  if (!finding) return null;

  const severityConfig = {
    high: {
      label: 'HIGH',
      badge: 'text-red-400 bg-red-500/10 border-red-500/20',
      icon: <ShieldAlert className="h-4 w-4 text-red-400" />
    },
    medium: {
      label: 'MEDIUM',
      badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      icon: <AlertTriangle className="h-4 w-4 text-amber-400" />
    },
    low: {
      label: 'LOW',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: <AlertCircle className="h-4 w-4 text-emerald-400" />
    }
  };

  const config = severityConfig[finding.severity];
  const activeEvidence = finding.evidence[activeEvidenceIndex] || finding.evidence[0];

  const handleCopyRecommendation = () => {
    navigator.clipboard.writeText(finding.recommendation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateRemediation = async () => {
    setIsGeneratingRemediation(true);
    setRemediationError(null);
    try {
      setGeneratedRemediation(await requestRemediation(finding.id));
    } catch (err) {
      setRemediationError(err instanceof Error ? err.message : 'Could not generate remediation');
    } finally {
      setIsGeneratingRemediation(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-neutral-800/90 p-6 bg-neutral-900/90">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${config.badge}`}>
                {config.icon}
                {config.label}
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs font-mono text-neutral-400">{finding.categoryName}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs font-mono text-neutral-500">ID: {finding.id}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {finding.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Why It Matters */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              <AlertOctagon className="h-4 w-4 text-amber-400" />
              <span>Why It Matters</span>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {finding.whyItMatters}
            </p>
          </div>

          {/* Evidence Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider">
                <FileCode className="h-4 w-4 text-neutral-400" />
                <span>Evidence Occurrences ({finding.evidence.length})</span>
              </div>
              <span className="text-xs text-neutral-500">Select file to inspect AST line</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {finding.evidence.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveEvidenceIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                    activeEvidenceIndex === idx
                      ? 'bg-neutral-800 text-white border border-neutral-700 font-medium'
                      : 'bg-neutral-950/80 text-neutral-400 border border-neutral-850 hover:bg-neutral-850 hover:text-neutral-200'
                  }`}
                >
                  <span>{item.file}</span>
                  <span className="text-neutral-600">:</span>
                  <span className="text-amber-400">{item.line}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Code Snippet with Syntax Highlighting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-neutral-200 font-semibold">{activeEvidence.file}</span>
                <span className="text-neutral-600">·</span>
                <span>Line <strong className="text-amber-400">{activeEvidence.line}</strong></span>
              </div>
              <span className="font-mono text-neutral-500">{finding.snippet.language} source context</span>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-[#07090e] p-4 overflow-x-auto font-mono text-xs leading-relaxed">
              <div className="space-y-1">
                {finding.snippet.lines.map((line) => (
                  <div
                    key={line.lineNum}
                    className={`flex items-start gap-4 py-0.5 px-2 rounded -mx-2 ${
                      line.isHighlighted
                        ? 'bg-red-500/15 border-l-2 border-red-500 text-neutral-100 font-medium'
                        : 'text-neutral-400 hover:bg-neutral-900/40'
                    }`}
                  >
                    <span className="select-none text-neutral-600 w-8 text-right shrink-0 tabular-nums">
                      {line.lineNum}
                    </span>
                    <pre className="text-neutral-200 overflow-x-auto">
                      <code>{line.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Explanation */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider">
              Risk Explanation
            </h4>
            <p className="text-sm text-neutral-300 leading-relaxed bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/80">
              {finding.riskExplanation}
            </p>
          </div>

          {/* Remediation Recommendation */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                <Lightbulb className="h-4 w-4" />
                <span>Recommendation</span>
              </div>
              <button
                onClick={handleCopyRecommendation}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Remediation'}</span>
              </button>
            </div>
            <p className="text-sm text-neutral-200 leading-relaxed">
              {finding.recommendation}
            </p>
            <div className="pt-3">
              <button
                onClick={handleGenerateRemediation}
                disabled={isGeneratingRemediation}
                className="inline-flex items-center gap-2 border border-emerald-500/30 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50"
              >
                {isGeneratingRemediation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {isGeneratingRemediation ? 'Generating...' : 'Generate refactored code'}
              </button>
              {remediationError && <p role="alert" className="mt-2 text-xs text-red-300">{remediationError}</p>}
            </div>
            {generatedRemediation && (
              <div className="mt-4 space-y-3 border-t border-emerald-500/20 pt-4">
                <p className="text-xs text-neutral-200">{generatedRemediation.explanation}</p>
                <pre className="max-h-64 overflow-auto bg-neutral-950 p-3 text-xs leading-relaxed text-neutral-200">
                  <code>{generatedRemediation.refactoredSnippet.lines.map((line) => line.code).join('\n')}</code>
                </pre>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-800/90 p-5 bg-neutral-900/90">
          <button
            onClick={() => onToggleReviewed(finding.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${
              finding.reviewed
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{finding.reviewed ? 'Marked as Reviewed' : 'Mark as Reviewed'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-900 hover:bg-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
