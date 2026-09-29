import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CONFIG } from '../config.ts';
import { db } from '../storage/store.ts';
import { extractZipSafely } from '../services/archive.ts';
import { fetchGitHubRepository } from '../services/github.ts';
import { jobRunner } from '../services/job_runner.ts';
import { Repository } from '../types/index.ts';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(CONFIG.WORKSPACES_DIR, 'uploads'),
  limits: { fileSize: CONFIG.MAX_UPLOAD_SIZE_MB * 1024 * 1024 }
});

// POST /api/analyze/upload - Upload a ZIP or tarball
router.post('/upload', upload.single('archive'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a .zip archive.' });
    }

    const jobId = `job-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const workspacePath = path.join(CONFIG.WORKSPACES_DIR, jobId);

    // Extract archive safely
    const originalName = req.file.originalname || 'uploaded-codebase.zip';
    const cleanRepoName = originalName.replace(/\.(zip|tar\.gz|tar)$/i, '');
    const { extractedPath, fileCount } = extractZipSafely(req.file.path, workspacePath);

    // Remove uploaded temporary zip file
    try {
      fs.unlinkSync(req.file.path);
    } catch {}

    const repository: Repository = {
      id: cleanRepoName.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      name: cleanRepoName,
      branch: 'main',
      lastAnalyzed: '',
      fileCount,
      language: 'Python',
      description: `Uploaded codebase archive (${originalName})`
    };

    db.saveRepository(repository);

    // Launch async analysis job
    jobRunner.startAnalysisJob(jobId, repository, extractedPath).catch((err) => {
      console.error(`Background job ${jobId} failed:`, err);
    });

    res.json({
      jobId,
      repository,
      message: 'Analysis job started successfully'
    });
  } catch (err: any) {
    console.error('Upload analysis failed:', err);
    res.status(500).json({ error: err.message || 'Failed to start archive analysis' });
  }
});

// POST /api/analyze/github - Connect a GitHub repository URL
router.post('/github', async (req: Request, res: Response) => {
  try {
    const { repoUrl, branch } = req.body;
    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ error: 'repoUrl is required' });
    }

    const jobId = `job-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const workspacePath = path.join(CONFIG.WORKSPACES_DIR, jobId);

    const { extractedPath, repoInfo, fileCount } = await fetchGitHubRepository(repoUrl, workspacePath);

    const repository: Repository = {
      id: repoInfo.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      name: repoInfo.name,
      branch: branch || repoInfo.branch || 'main',
      lastAnalyzed: '',
      fileCount,
      language: 'Python',
      description: `Imported from ${repoUrl}`
    };

    db.saveRepository(repository);

    // Launch async analysis job
    jobRunner.startAnalysisJob(jobId, repository, extractedPath).catch((err) => {
      console.error(`Background GitHub job ${jobId} failed:`, err);
    });

    res.json({
      jobId,
      repository,
      message: 'GitHub analysis job started successfully'
    });
  } catch (err: any) {
    console.error('GitHub analysis failed:', err);
    res.status(500).json({ error: err.message || 'Failed to start GitHub repository analysis' });
  }
});

// GET /api/analyze/stream/:jobId - Server-Sent Events (SSE) Stream
router.get('/stream/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  jobRunner.registerSSEListener(jobId, res);
});

// GET /api/analyze/status/:jobId - REST Status Polling
router.get('/status/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = db.getJob(jobId);
  if (!job) {
    return res.status(404).json({ error: `Job not found: ${jobId}` });
  }
  res.json(job);
});

export default router;
