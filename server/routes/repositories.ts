import { Router, Request, Response } from 'express';
import { db } from '../storage/store.ts';

const router = Router();

// GET /api/repositories - List all repositories
router.get('/', (_req: Request, res: Response) => {
  const repos = db.getRepositories();
  res.json(repos);
});

// GET /api/repositories/:id - Get specific repository
router.get('/:id', (req: Request, res: Response) => {
  const repo = db.getRepository(req.params.id);
  if (!repo) {
    return res.status(404).json({ error: `Repository not found: ${req.params.id}` });
  }
  res.json(repo);
});

export default router;
