import EventEmitter from 'events';
import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import { db } from '../storage/store.ts';
import { runASTAnalysis } from '../engine/ast_runner.ts';
import { enrichFindingWithGemini } from './gemini.ts';
import { 
  JobProgress, 
  Repository, 
  AnalysisReport, 
  Finding 
} from '../types/index.ts';

const PIPELINE_STEPS = [
  { id: 'upload', label: 'Repository uploaded' },
  { id: 'discover', label: 'Files discovered' },
  { id: 'structure', label: 'Analyzing code structure' },
  { id: 'patterns', label: 'Detecting architectural patterns' },
  { id: 'semantic', label: 'Preparing finding details' },
  { id: 'debt', label: 'Calculating security debt' },
  { id: 'report', label: 'Generating report' },
];

class JobRunner extends EventEmitter {
  private activeListeners: Map<string, Set<Response>> = new Map();

  constructor() {
    super();
  }

  public registerSSEListener(jobId: string, res: Response): void {
    if (!this.activeListeners.has(jobId)) {
      this.activeListeners.set(jobId, new Set());
    }
    const listeners = this.activeListeners.get(jobId)!;
    listeners.add(res);

    // Send initial status immediately
    const currentJob = db.getJob(jobId);
    if (currentJob) {
      res.write(`data: ${JSON.stringify(currentJob)}\n\n`);
    }

    res.on('close', () => {
      listeners.delete(res);
      if (listeners.size === 0) {
        this.activeListeners.delete(jobId);
      }
    });
  }

  private broadcast(job: JobProgress): void {
    db.saveJob(job);
    const listeners = this.activeListeners.get(job.jobId);
    if (listeners) {
      const payload = `data: ${JSON.stringify(job)}\n\n`;
      listeners.forEach((res) => {
        try {
          res.write(payload);
        } catch (err) {
          console.warn('Failed to write SSE event:', err);
        }
      });
    }
  }

  public async startAnalysisJob(
    jobId: string,
    repository: Repository,
    workspacePath: string
  ): Promise<string> {
    const totalFiles = 0;

    let progress: JobProgress = {
      jobId,
      status: 'analyzing',
      currentStepIndex: 0,
      currentStepName: PIPELINE_STEPS[0].label,
      totalSteps: PIPELINE_STEPS.length,
      processedFiles: 0,
      totalFiles,
      currentFile: '',
      percent: 0
    };
    this.broadcast(progress);

    try {
      // Step 1: Discover files
      progress.currentStepIndex = 1;
      progress.currentStepName = PIPELINE_STEPS[1].label;
      progress.percent = 15;

      const discoveredFiles: string[] = [];
      const scanDir = (dir: string) => {
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const full = path.join(dir, entry.name);
            const rel = path.relative(workspacePath, full);
            if (entry.isDirectory()) {
              if (!['.git', 'node_modules', '__pycache__', 'venv', '.venv'].includes(entry.name)) {
                scanDir(full);
              }
            } else {
              discoveredFiles.push(rel);
            }
          }
        } catch {}
      };
      scanDir(workspacePath);

      progress.totalFiles = discoveredFiles.filter((file) => file.endsWith('.py')).length;
      progress.processedFiles = 0;
      progress.currentFile = '';
      this.broadcast(progress);

      // Step 2: Code structure
      progress.currentStepIndex = 2;
      progress.currentStepName = PIPELINE_STEPS[2].label;
      progress.percent = 35;
      progress.currentFile = '';
      this.broadcast(progress);

      // Step 3: Detecting architectural patterns (Static AST Analysis)
      progress.currentStepIndex = 3;
      progress.currentStepName = PIPELINE_STEPS[3].label;
      progress.percent = 55;
      progress.currentFile = '';
      this.broadcast(progress);

      const astResult = await runASTAnalysis(workspacePath);

      // Step 4: Running AI-assisted semantic analysis (Gemini)
      progress.currentStepIndex = 4;
      progress.currentStepName = PIPELINE_STEPS[4].label;
      progress.percent = 75;
      progress.currentFile = '';
      this.broadcast(progress);

      // Enrich top findings with Gemini if available
      const enrichedFindings: Finding[] = [];
      for (let i = 0; i < astResult.findings.length; i++) {
        const rawFinding = astResult.findings[i];
        if (i < 3) {
          // Enrich top 3 findings with Gemini
          const enriched = await enrichFindingWithGemini(rawFinding);
          enrichedFindings.push(enriched);
        } else {
          enrichedFindings.push(rawFinding);
        }
      }

      // Step 5: Calculating security debt
      progress.currentStepIndex = 5;
      progress.currentStepName = PIPELINE_STEPS[5].label;
      progress.percent = 90;
      progress.processedFiles = progress.totalFiles;
      progress.currentFile = '';
      this.broadcast(progress);

      // Step 6: Generating report
      progress.currentStepIndex = 6;
      progress.currentStepName = PIPELINE_STEPS[6].label;
      progress.percent = 98;
      this.broadcast(progress);

      const reportId = `rep-${repository.id}-${Date.now().toString(36)}`;
      const finalReport: AnalysisReport = {
        id: reportId,
        repoId: repository.id,
        repository: {
          ...repository,
          lastAnalyzed: new Date().toISOString(),
          fileCount: astResult.metrics.filesAnalyzed
        },
        overallScore: astResult.overallScore,
        categories: astResult.categories,
        findings: enrichedFindings,
        metrics: {
          ...astResult.metrics
        },
        architecture: astResult.architecture,
        analyzedAt: new Date().toISOString()
      };

      db.saveReport(finalReport);

      // Completed!
      progress.status = 'completed';
      progress.percent = 100;
      progress.reportId = reportId;
      this.broadcast(progress);

      return reportId;
    } catch (err: any) {
      console.error(`Analysis job ${jobId} failed:`, err);
      progress.status = 'failed';
      progress.error = err.message || 'Analysis pipeline encountered an unexpected error';
      this.broadcast(progress);
      throw err;
    }
  }

}

export const jobRunner = new JobRunner();
