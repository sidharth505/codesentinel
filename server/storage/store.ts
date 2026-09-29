import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.ts';
import { Repository, AnalysisReport, JobProgress, Finding } from '../types/index.ts';

interface DatabaseSchema {
  repositories: Record<string, Repository>;
  reports: Record<string, AnalysisReport>;
  jobs: Record<string, JobProgress>;
}

class Store {
  private dbPath: string;
  private data: DatabaseSchema;

  constructor() {
    this.dbPath = path.join(CONFIG.STORAGE_DIR, 'db.json');
    this.data = this.load();
    this.removeLegacyPlaceholderReports();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Could not parse database file, resetting store:', err);
    }
    return {
      repositories: {},
      reports: {},
      jobs: {}
    };
  }

  private save(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  private removeLegacyPlaceholderReports(): void {
    const demoRepositoryIds = new Set([
      'payment-platform',
      'agentic-workflow-engine',
      'identity-auth-service'
    ]);
    let changed = false;
    const invalidReportIds = new Set<string>();

    for (const repositoryId of demoRepositoryIds) {
      if (this.data.repositories[repositoryId]) {
        delete this.data.repositories[repositoryId];
        changed = true;
      }
    }
    for (const [reportId, report] of Object.entries(this.data.reports)) {
      if (demoRepositoryIds.has(report.repoId) || 'comparison' in report || 'timeline' in report) {
        invalidReportIds.add(reportId);
        delete this.data.reports[reportId];
        changed = true;
      }
    }
    for (const [jobId, job] of Object.entries(this.data.jobs)) {
      if (
        (job.reportId && invalidReportIds.has(job.reportId)) ||
        ((job.status === 'completed' || job.status === 'failed') && (!job.reportId || !this.data.reports[job.reportId]))
      ) {
        delete this.data.jobs[jobId];
        changed = true;
      }
    }
    for (const repository of Object.values(this.data.repositories)) {
      if (!this.getReportByRepoId(repository.id) && repository.lastAnalyzed) {
        repository.lastAnalyzed = '';
        changed = true;
      }
    }
    if (changed) this.save();
  }

  // Repository Methods
  public getRepositories(): Repository[] {
    return Object.values(this.data.repositories).filter((repo) => Boolean(this.getReportByRepoId(repo.id)));
  }

  public getRepository(id: string): Repository | null {
    return this.data.repositories[id] || null;
  }

  public saveRepository(repo: Repository): void {
    this.data.repositories[repo.id] = repo;
    this.save();
  }

  // Report Methods
  public getReport(id: string): AnalysisReport | null {
    return this.data.reports[id] || null;
  }

  public getReportByRepoId(repoId: string): AnalysisReport | null {
    const reports = Object.values(this.data.reports);
    // Return latest report for this repo
    const matches = reports.filter(r => r.repoId === repoId);
    if (matches.length === 0) return null;
    return matches.sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())[0];
  }

  public saveReport(report: AnalysisReport): void {
    this.data.reports[report.id] = report;
    // Also ensure repo is updated
    this.data.repositories[report.repoId] = report.repository;
    this.save();
  }

  public updateFindingReview(reportId: string, findingId: string, reviewed: boolean): Finding | null {
    const report = this.data.reports[reportId];
    if (!report) return null;

    const finding = report.findings.find(f => f.id === findingId);
    if (!finding) return null;

    finding.reviewed = reviewed;
    this.save();
    return finding;
  }

  public updateFindingInAllReports(findingId: string, reviewed: boolean): Finding | null {
    let updated: Finding | null = null;
    for (const report of Object.values(this.data.reports)) {
      const finding = report.findings.find(f => f.id === findingId);
      if (finding) {
        finding.reviewed = reviewed;
        updated = finding;
      }
    }
    if (updated) {
      this.save();
    }
    return updated;
  }

  // Job Methods
  public getJob(jobId: string): JobProgress | null {
    return this.data.jobs[jobId] || null;
  }

  public saveJob(job: JobProgress): void {
    this.data.jobs[job.jobId] = job;
    this.save();
  }
}

export const db = new Store();
