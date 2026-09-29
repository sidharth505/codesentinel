/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Header 
} from './components/common/Header.tsx';
import { 
  RepositoryHeader 
} from './components/dashboard/RepositoryHeader.tsx';
import { 
  ScoreCard 
} from './components/dashboard/ScoreCard.tsx';
import { 
  RiskCard 
} from './components/dashboard/RiskCard.tsx';
import { 
  FindingCard 
} from './components/dashboard/FindingCard.tsx';
import { 
  FindingDetailModal 
} from './components/dashboard/FindingDetailModal.tsx';
import { 
  ArchitectureGraph 
} from './components/dashboard/ArchitectureGraph.tsx';
import { 
  CodebaseMetrics 
} from './components/dashboard/CodebaseMetrics.tsx';
import { 
  UploadCard,
  AnalysisRequestOptions
} from './components/upload/UploadCard.tsx';
import { 
  AnalysisProgress 
} from './components/upload/AnalysisProgress.tsx';
import { 
  ReportView 
} from './components/report/ReportView.tsx';
import { 
  HowItWorksView 
} from './components/how-it-works/HowItWorksView.tsx';

import { 
  Repository, 
  Finding, 
  CategoryKey, 
  Severity,
  AnalysisReport,
  OverallScore
} from './types/index.ts';

import { 
  fetchRepositories,
  fetchLatestReport,
  fetchReport,
  uploadArchive,
  analyzeGitHub,
  toggleFindingReview
} from './services/api.ts';

import { Search, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Navigation & View States
  const [currentView, setCurrentView] = useState<'dashboard' | 'architecture' | 'how-it-works' | 'report' | 'upload'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [activeAnalyzedAt, setActiveAnalyzedAt] = useState<string | null>(null);
  const [activeRepo, setActiveRepo] = useState<Repository | null>(null);
  const [savedRepositories, setSavedRepositories] = useState<Repository[]>([]);

  // Dynamic Data States
  const [overallScore, setOverallScore] = useState<OverallScore | null>(null);
  const [riskCategories, setRiskCategories] = useState<AnalysisReport['categories']>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [codebaseMetrics, setCodebaseMetrics] = useState<AnalysisReport['metrics'] | null>(null);
  const [architectureNodes, setArchitectureNodes] = useState<AnalysisReport['architecture']['nodes']>([]);
  const [architectureEdges, setArchitectureEdges] = useState<AnalysisReport['architecture']['edges']>([]);

  // Findings & Filtering States
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<CategoryKey | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFindingModal, setActiveFindingModal] = useState<Finding | null>(null);

  // Load repositories on mount
  useEffect(() => {
    fetchRepositories().then(async (repositories) => {
      setSavedRepositories(repositories);
      if (repositories.length > 0) {
        try {
          loadReportIntoState(await fetchLatestReport(repositories[0].id));
          setCurrentView('dashboard');
        } catch (err) {
          setAnalysisError(err instanceof Error ? err.message : 'Failed to load the latest report');
        }
      }
    }).catch((err) => {
      setAnalysisError(err instanceof Error ? err.message : 'Failed to load repositories');
    });
  }, []);

  // Toggle reviewed status for finding
  const handleToggleReviewed = (findingId: string) => {
    const currentFinding = findings.find(f => f.id === findingId);
    const newStatus = currentFinding ? !currentFinding.reviewed : true;

    setFindings(prev => prev.map(f => {
      if (f.id === findingId) {
        return { ...f, reviewed: newStatus };
      }
      return f;
    }));

    if (activeFindingModal && activeFindingModal.id === findingId) {
      setActiveFindingModal(prev => prev ? { ...prev, reviewed: newStatus } : null);
    }

    // Persist to backend store
    toggleFindingReview(findingId, newStatus);
  };

  const loadReportIntoState = (report: AnalysisReport) => {
    setActiveReportId(report.id);
    setActiveAnalyzedAt(report.analyzedAt);
    setActiveRepo(report.repository);
    setOverallScore(report.overallScore);
    setRiskCategories(report.categories);
    setFindings(report.findings);
    setCodebaseMetrics(report.metrics);
    setArchitectureNodes(report.architecture.nodes);
    setArchitectureEdges(report.architecture.edges);
  };

  // Start analysis from an archive or GitHub URL.
  const handleStartAnalysis = async (repo: Repository, options?: AnalysisRequestOptions) => {
    setActiveRepo(repo);
    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      if (options?.file) {
        const res = await uploadArchive(options.file);
        setActiveJobId(res.jobId);
        setActiveRepo(res.repository);
      } else if (options?.githubUrl) {
        const res = await analyzeGitHub(options.githubUrl);
        setActiveJobId(res.jobId);
        setActiveRepo(res.repository);
      } else {
        throw new Error('Choose a repository archive or GitHub URL to analyze.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start analysis';
      console.error('Backend start analysis error:', err);
      setActiveJobId(null);
      setIsAnalyzing(false);
      setAnalysisError(message);
      setCurrentView('upload');
    }
  };

  const handleAnalysisComplete = async (reportId?: string) => {
    if (reportId) {
      try {
        const report = await fetchReport(reportId);
        loadReportIntoState(report);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis completed but the report could not be loaded';
        setAnalysisError(message);
        setCurrentView('upload');
      }
    }
    setIsAnalyzing(false);
    setActiveJobId(null);
    setCurrentView('dashboard');
  };

  // Filter findings based on active controls
  const filteredFindings = findings.filter(f => {
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (selectedCategoryKey && f.category !== selectedCategoryKey) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = f.title.toLowerCase().includes(q);
      const matchDesc = f.description.toLowerCase().includes(q);
      const matchFile = f.evidence.some(e => e.file.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchFile) return false;
    }
    return true;
  });

  const reviewedCount = findings.filter(f => f.reviewed).length;

  return (
    <div className="min-h-screen bg-[#090a0f] text-neutral-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentView={currentView}
        setCurrentView={(view) => {
          setIsAnalyzing(false);
          setCurrentView(view);
        }}
        activeRepo={activeRepo}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* State 1: Analysis Progress Loading Screen */}
        {isAnalyzing && activeRepo ? (
          <AnalysisProgress
            repository={activeRepo}
            jobId={activeJobId}
            onComplete={handleAnalysisComplete}
            onError={(error) => {
              setIsAnalyzing(false);
              setActiveJobId(null);
              setAnalysisError(error.message);
              setCurrentView('upload');
            }}
          />
        ) : currentView === 'upload' ? (
          /* State 2: Upload / Landing Page */
          <div className="space-y-4">
            {analysisError && (
              <div role="alert" className="max-w-4xl mx-auto border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
                {analysisError}
              </div>
            )}
            <UploadCard onStartAnalysis={handleStartAnalysis} />
          </div>
        ) : currentView === 'how-it-works' ? (
          /* State 3: Educational How It Works View */
          <HowItWorksView
            onGoToDashboard={() => setCurrentView('dashboard')}
            onGoToUpload={() => setCurrentView('upload')}
          />
        ) : currentView === 'report' && activeRepo && overallScore ? (
          /* State 4: Printable / Exportable Official Report View */
          <ReportView
            repository={activeRepo}
            reportId={activeReportId}
            analyzedAt={activeAnalyzedAt || ''}
            overallScore={overallScore}
            categories={riskCategories}
            findings={findings}
            onViewFindingDetail={(finding) => setActiveFindingModal(finding)}
          />
        ) : currentView === 'architecture' ? (activeRepo && architectureNodes.length > 0 ? (
          /* State 5: Dedicated Architecture View */
          <div className="py-4 space-y-6">
            <ArchitectureGraph
              nodes={architectureNodes}
              edges={architectureEdges}
              onSelectFinding={(fid) => {
                const found = findings.find(f => f.id === fid);
                if (found) setActiveFindingModal(found);
              }}
            />
          </div>) : (
            <div className="mx-auto max-w-2xl py-20 text-center">
              <h1 className="text-xl font-semibold text-white">No module dependency data</h1>
              <p className="mt-2 text-sm text-neutral-400">This report does not contain a module graph.</p>
            </div>
          )) : activeRepo && overallScore && codebaseMetrics ? (
          /* State 6: Main Dashboard (Default primary view) */
          <div className="space-y-10 py-2">
            {/* Repository Context Header */}
            <RepositoryHeader
              repository={activeRepo}
              repositories={savedRepositories}
              onSelectRepo={async (repo) => {
                try {
                  loadReportIntoState(await fetchLatestReport(repo.id));
                } catch (err) {
                  setAnalysisError(err instanceof Error ? err.message : 'Failed to load repository report');
                  setCurrentView('upload');
                }
              }}
              onRunAnalysis={() => setCurrentView('upload')}
            />

            {/* Large Score Card */}
            <ScoreCard
              score={overallScore.debtScore}
              maxScore={overallScore.maxScore}
              severity={overallScore.severity}
              severityLabel={overallScore.severityLabel}
              patternCount={overallScore.patternCount}
              categoryCount={riskCategories.length}
              summary={overallScore.summary}
              onViewReport={() => setCurrentView('report')}
            />

            {/* Risk Category Cards (6 Dimensions) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Risk Category Breakdown
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Click any category to filter the detected patterns below.
                  </p>
                </div>

                {selectedCategoryKey && (
                  <button
                    onClick={() => setSelectedCategoryKey(null)}
                    className="text-xs font-mono text-amber-400 hover:text-amber-300 underline"
                  >
                    Clear category filter
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {riskCategories.map((cat) => (
                  <RiskCard
                    key={cat.key}
                    category={cat}
                    isSelected={selectedCategoryKey === cat.key}
                    onSelect={(key) => {
                      setSelectedCategoryKey(selectedCategoryKey === key ? null : key);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Detected Patterns (Findings Section) */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Findings
                    </h3>
                    <span className="text-xs font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                      {filteredFindings.length} of {findings.length}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Source-backed patterns detected by the current analysis rules.
                  </p>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search box */}
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter by file or keyword..."
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-800 bg-neutral-900/80 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 font-mono w-48 sm:w-56"
                    />
                  </div>

                  {/* Severity Tabs Segmented Control */}
                  <div className="flex items-center p-0.5 rounded-lg border border-neutral-800 bg-neutral-950 font-mono text-xs">
                    {(['all', 'high', 'medium', 'low'] as const).map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setSeverityFilter(sev)}
                        className={`px-3 py-1 rounded-md capitalize transition-colors ${
                          severityFilter === sev
                            ? 'bg-neutral-800 text-white font-medium shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reviewed Stats Banner */}
              {reviewedCount > 0 && (
                <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-neutral-900/40 border border-neutral-800 text-xs text-neutral-400 font-mono">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{reviewedCount} of {findings.length} findings marked as reviewed</span>
                  </div>
                  <button
                    onClick={() => {
                      setFindings(prev => prev.map(f => ({ ...f, reviewed: false })));
                      findings.forEach(f => toggleFindingReview(f.id, false));
                    }}
                    className="text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Reset reviewed status
                  </button>
                </div>
              )}

              {/* Findings Cards List */}
              {filteredFindings.length > 0 ? (
                <div className="space-y-4">
                  {filteredFindings.map((finding) => (
                    <FindingCard
                      key={finding.id}
                      finding={finding}
                      onViewEvidence={(f) => setActiveFindingModal(f)}
                      onToggleReviewed={handleToggleReviewed}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-12 text-center space-y-2">
                  <AlertCircle className="h-6 w-6 text-neutral-500 mx-auto" />
                  <p className="text-sm font-medium text-white">No patterns match your filter</p>
                  <p className="text-xs text-neutral-500">
                    Try adjusting your severity filter or search terms.
                  </p>
                  <button
                    onClick={() => {
                      setSeverityFilter('all');
                      setSelectedCategoryKey(null);
                      setSearchQuery('');
                    }}
                    className="mt-2 text-xs text-amber-400 hover:underline font-mono"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>

            {/* Architecture Overview Section */}
            <div className="pt-4">
              <ArchitectureGraph
                nodes={architectureNodes}
                edges={architectureEdges}
                onSelectFinding={(fid) => {
                  const found = findings.find(f => f.id === fid);
                  if (found) setActiveFindingModal(found);
                }}
              />
            </div>

            {/* Codebase Composition Metrics */}
            <div className="pt-4">
              <CodebaseMetrics metrics={codebaseMetrics} />
            </div>

          </div>
        ) : (
          <div className="mx-auto max-w-2xl py-20 text-center">
            <h1 className="text-xl font-semibold text-white">No analysis report selected</h1>
            <p className="mt-2 text-sm text-neutral-400">Upload a repository archive or connect a GitHub repository to see its results.</p>
            <button onClick={() => setCurrentView('upload')} className="mt-6 border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800">Analyze a repository</button>
          </div>
        )}
      </main>

      {/* Finding Detail Evidence Inspection Modal */}
      <FindingDetailModal
        finding={activeFindingModal}
        onClose={() => setActiveFindingModal(null)}
        onToggleReviewed={handleToggleReviewed}
      />

      {/* Quiet Developer Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-mono">
          <div>
            CodeSentinel · Python Static Analysis
          </div>
          <div className="flex items-center gap-6 text-neutral-400">
            <span>Python AST Analyzer</span>
            <span className="text-neutral-700">·</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
