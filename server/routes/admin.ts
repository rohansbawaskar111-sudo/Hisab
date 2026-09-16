import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireAdmin, AuthRequest } from '../auth';

const router = Router();

// Apply auth and admin check to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', (_req: AuthRequest, res: Response) => {
  try {
    const stats = db.getAdminStats();
    res.json(stats);
  } catch (err: any) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/users
router.get('/users', (_req: AuthRequest, res: Response) => {
  try {
    const users = db.getAllUsersAdmin();
    res.json(users);
  } catch (err: any) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users/:id/action
router.post('/users/:id/action', (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const targetUserId = req.params.id;
    const { action, reason } = req.body;

    if (!action || !['warn', 'suspend', 'ban', 'restore'].includes(action)) {
      res.status(400).json({ error: 'Valid action (warn, suspend, ban, restore) is required' });
      return;
    }

    const success = db.updateAdminUserStatus(adminId, targetUserId, action, reason || 'Admin moderation');
    if (!success) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ success: true, message: `User status successfully updated to: ${action}` });
  } catch (err: any) {
    console.error('Admin user action error:', err);
    res.status(500).json({ error: 'Failed to perform user action' });
  }
});

// GET /api/admin/reports
router.get('/reports', (_req: AuthRequest, res: Response) => {
  try {
    const reports = db.getReports();
    res.json(reports);
  } catch (err: any) {
    console.error('Admin reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/admin/reports/:id/resolve
router.post('/reports/:id/resolve', (req: AuthRequest, res: Response) => {
  try {
    const { actionTaken } = req.body;
    const success = db.resolveReport(req.params.id, actionTaken || 'Reviewed and addressed');
    if (!success) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Resolve report error:', err);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});

// GET /api/admin/verifications
router.get('/verifications', (_req: AuthRequest, res: Response) => {
  try {
    const verifs = db.getVerificationRequests();
    res.json(verifs);
  } catch (err: any) {
    console.error('Admin verifications error:', err);
    res.status(500).json({ error: 'Failed to fetch verification requests' });
  }
});

// POST /api/admin/verifications/:id/resolve or :id/review
const handleResolveVerification = (req: AuthRequest, res: Response) => {
  try {
    const { status, notes, reviewerNotes } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Status must be approved or rejected' });
      return;
    }

    const success = db.resolveVerification(req.params.id, status, notes || reviewerNotes);
    if (!success) {
      res.status(404).json({ error: 'Verification request not found' });
      return;
    }

    res.json({ success: true, message: `Verification has been ${status}` });
  } catch (err: any) {
    console.error('Resolve verification error:', err);
    res.status(500).json({ error: 'Failed to resolve verification request' });
  }
};
router.post('/verifications/:id/resolve', handleResolveVerification);
router.post('/verifications/:id/review', handleResolveVerification);

// POST /api/admin/reset-data
router.post('/reset-data', (_req: AuthRequest, res: Response) => {
  try {
    db.seedInitialData(true);
    res.json({ success: true, message: 'Database reset to fresh demo seed data.' });
  } catch (err: any) {
    console.error('Reset data error:', err);
    res.status(500).json({ error: 'Failed to reset seed data' });
  }
});

export default router;
