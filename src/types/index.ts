export type Severity = 'high' | 'medium' | 'low';

export type CategoryKey = 
  | 'error-handling' 
  | 'code-duplication' 
  | 'architecture' 
  | 'boilerplate' 
  | 'dependencies' 
  | 'config';

export interface EvidenceItem {
  file: string;
  line: number;
  preview?: string;
}

export interface CodeLine {
  lineNum: number;
  code: string;
  isHighlighted?: boolean;
  highlightReason?: string;
}

export interface CodeSnippet {
  file: string;
  startLine: number;
  lines: CodeLine[];
  language: string;
}

export interface Finding {
  id: string;
  title: string;
  category: CategoryKey;
  categoryName: string;
  severity: Severity;
  description: string;
  whyItMatters: string;
  riskExplanation: string;
  recommendation: string;
  evidence: EvidenceItem[];
  snippet: CodeSnippet;
  reviewed: boolean;
}

export interface RiskCategory {
  key: CategoryKey;
  title: string;
  score: number;
  maxScore: number;
  severity: Severity;
  explanation: string;
  findingsCount: number;
  icon: string;
}

export interface ArchitectureNode {
  id: string;
  name: string;
  role: string;
  type: 'gateway' | 'service' | 'auth' | 'database' | 'cache' | 'worker';
  x: number;
  y: number;
  incomingCoupling: number;
  outgoingCoupling: number;
  instabilityIndex: number;
  couplingLevel: 'high' | 'medium' | 'low';
  findingsCount: number;
  description: string;
  relatedFindings: string[];
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  isCoupledHigh: boolean;
  callFrequency: 'high' | 'medium' | 'low';
  protocol: string;
}

export interface CodebaseMetrics {
  filesAnalyzed: number;
  functions: number;
  classes: number;
  dependencies: number;
  duplicateClusters: number;
  exceptionHandlers: number;
  largeFunctions: number;
}

export interface Repository {
  id: string;
  name: string;
  branch: string;
  lastAnalyzed: string;
  fileCount: number;
  language: string;
  stars?: number;
  description: string;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  currentStepIndex: number;
  processedFiles: number;
  totalFiles: number;
  currentFile: string;
  completed: boolean;
}

export interface OverallScore {
  debtScore: number;
  maxScore: number;
  severity: Severity;
  severityLabel: string;
  patternCount: number;
  summary: string;
}

export interface AnalysisReport {
  id: string;
  repoId: string;
  repository: Repository;
  overallScore: OverallScore;
  categories: RiskCategory[];
  findings: Finding[];
  metrics: CodebaseMetrics;
  architecture: {
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
  };
  analyzedAt: string;
}

export interface JobProgress {
  jobId: string;
  status: 'queued' | 'analyzing' | 'completed' | 'failed';
  currentStepIndex: number;
  currentStepName: string;
  totalSteps: number;
  processedFiles: number;
  totalFiles: number;
  currentFile: string;
  percent: number;
  reportId?: string;
  error?: string;
}
