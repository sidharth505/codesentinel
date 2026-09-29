import { Router, Request, Response } from 'express';
import { db } from '../storage/store.ts';
import { generateRemediationCode } from '../services/gemini.ts';

const router = Router();

// PATCH /api/findings/:id/review - Toggle or set reviewed status
router.patch('/:id/review', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reviewed } = req.body;

  if (typeof reviewed !== 'boolean') {
    return res.status(400).json({ error: 'reviewed (boolean) is required in request body' });
  }

  const updatedFinding = db.updateFindingInAllReports(id, reviewed);
  if (!updatedFinding) {
    return res.status(404).json({ error: `Finding with ID ${id} not found` });
  }

  res.json({
    id: updatedFinding.id,
    reviewed: updatedFinding.reviewed,
    message: 'Finding reviewed status updated'
  });
});

// POST /api/findings/:id/refactor - Generate on-demand remediation code
router.post('/:id/refactor', async (req: Request, res: Response) => {
  const { id } = req.params;

  let targetFinding = null;
  for (const repo of db.getRepositories()) {
    const report = db.getReportByRepoId(repo.id);
    if (report) {
      const found = report.findings.find(f => f.id === id);
      if (found) {
        targetFinding = found;
        break;
      }
    }
  }

  if (!targetFinding) {
    return res.status(404).json({ error: `Finding with ID ${id} not found` });
  }

  try {
    const remediation = await generateRemediationCode(targetFinding);
    res.json(remediation);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate remediation code' });
  }
});

export default router;
