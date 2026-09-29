import { Router, Request, Response } from 'express';
import { db } from '../storage/store.ts';

const router = Router();

// GET /api/reports/:id - Get full report by ID
router.get('/:id', (req: Request, res: Response) => {
  const report = db.getReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: `Report not found: ${req.params.id}` });
  }
  res.json(report);
});

// GET /api/reports/latest/:repoId - Get latest report for a repository
router.get('/latest/:repoId', (req: Request, res: Response) => {
  const report = db.getReportByRepoId(req.params.repoId);
  if (!report) {
    return res.status(404).json({ error: `No report found for repository: ${req.params.repoId}` });
  }
  res.json(report);
});

// GET /api/reports/:id/export - Export report as Markdown or JSON
router.get('/:id/export', (req: Request, res: Response) => {
  const report = db.getReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: `Report not found: ${req.params.id}` });
  }

  const format = (req.query.format as string) || 'markdown';

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="codesentinel-report-${report.repository.name}.json"`);
    return res.send(JSON.stringify(report, null, 2));
  }

  // Generate clean Markdown audit report
  let md = `# CodeSentinel Security Debt Audit Report\n\n`;
  md += `**Repository:** ${report.repository.name} (${report.repository.language})\n`;
  md += `**Branch:** ${report.repository.branch}\n`;
  md += `**Audit Date:** ${new Date(report.analyzedAt).toUTCString()}\n`;
  md += `**Overall Security Debt Score:** ${report.overallScore.debtScore}/100 (${report.overallScore.severityLabel})\n\n`;

  md += `## Executive Summary\n${report.overallScore.summary}\n\n`;

  md += `## Codebase Composition Metrics\n`;
  md += `- Files Analyzed: ${report.metrics.filesAnalyzed}\n`;
  md += `- Functions: ${report.metrics.functions}\n`;
  md += `- Classes: ${report.metrics.classes}\n`;
  md += `- Exception Handlers: ${report.metrics.exceptionHandlers}\n`;
  md += `- Duplicate Clusters: ${report.metrics.duplicateClusters}\n\n`;

  md += `## Risk Category Breakdown\n`;
  for (const cat of report.categories) {
    md += `### ${cat.title} — ${cat.score}/${cat.maxScore} (${cat.severity.toUpperCase()})\n`;
    md += `${cat.explanation}\n\n`;
  }

  md += `## Detected Architectural & Security Findings\n\n`;
  for (const f of report.findings) {
    md += `### [${f.severity.toUpperCase()}] ${f.title} (${f.id})\n`;
    md += `**Category:** ${f.categoryName}\n\n`;
    md += `**Description:** ${f.description}\n\n`;
    md += `**Why It Matters:** ${f.whyItMatters}\n\n`;
    md += `**Risk Explanation:** ${f.riskExplanation}\n\n`;
    md += `**Recommendation:** ${f.recommendation}\n\n`;
    md += `**Evidence:**\n`;
    for (const ev of f.evidence) {
      md += `- \`${ev.file}:${ev.line}\`: \`${ev.preview || ''}\`\n`;
    }
    md += `\n---\n\n`;
  }

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="codesentinel-report-${report.repository.name}.md"`);
  res.send(md);
});

export default router;
