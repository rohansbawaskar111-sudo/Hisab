import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../auth';

const router = Router();

// POST /api/reports
router.post('/reports', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const reporterId = req.user!.id;
    const reportedUserId = req.body.reportedUserId || req.body.targetUserId || req.body.targetId;
    const reason = req.body.reason;
    const details = req.body.details || req.body.description || '';
    const targetType = req.body.targetType || 'profile';
    const targetId = req.body.targetId || reportedUserId;

    if (!reportedUserId || !reason) {
      res.status(400).json({ error: 'Reported user ID and reason are required' });
      return;
    }

    const report = db.createReport({
      reporterId,
      reportedUserId,
      targetType,
      targetId,
      reason,
      details,
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted. Our trust & safety team reviews all reports within 24 hours.',
      report,
    });
  } catch (err: any) {
    console.error('Report submission error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// POST /api/blocks
router.post('/blocks', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const blockerId = req.user!.id;
    const blockedUserId = req.body.blockedUserId || req.body.targetUserId || req.body.targetId;

    if (!blockedUserId) {
      res.status(400).json({ error: 'blockedUserId is required' });
      return;
    }

    db.blockUser(blockerId, blockedUserId);
    res.json({
      success: true,
      message: 'User has been blocked. They will not be able to see your profile or message you.',
    });
  } catch (err: any) {
    console.error('Block user error:', err);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// POST /api/verification/request
router.post('/verification/request', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { selfieUrl, poseType } = req.body;

    if (!selfieUrl) {
      res.status(400).json({ error: 'Selfie photo is required for verification' });
      return;
    }

    const verification = db.createVerificationRequest(userId, selfieUrl, poseType || 'peace_sign');
    res.status(201).json({
      success: true,
      message: 'Verification request submitted! Our safety team will review your photo.',
      verification,
      request: verification,
    });
  } catch (err: any) {
    console.error('Verification request error:', err);
    res.status(500).json({ error: 'Failed to submit verification request' });
  }
});

// GET /api/verification/status
router.get('/verification/status', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const status = db.getVerificationStatus(req.user!.id);
    res.json({
      isVerified: req.user!.isVerified,
      request: status || null,
    });
  } catch (err: any) {
    console.error('Verification status error:', err);
    res.status(500).json({ error: 'Failed to fetch verification status' });
  }
});

// POST /api/account/export
router.post('/account/export', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = db.getUserById(userId);
    const profile = db.getProfileByUserId(userId);
    const preferences = db.getPreferences(userId);
    const matches = db.getMatchesForUser(userId);

    const exportData = {
      exportDate: new Date().toISOString(),
      account: {
        id: user?.id,
        email: user?.email,
        createdAt: user?.createdAt,
      },
      profile,
      preferences,
      matchesCount: matches.length,
    };

    res.json(exportData);
  } catch (err: any) {
    console.error('Account export error:', err);
    res.status(500).json({ error: 'Failed to export account data' });
  }
});

// DELETE /api/account
router.delete('/account', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    db.deleteUser(userId);
    res.json({ success: true, message: 'Account and associated data deleted permanently.' });
  } catch (err: any) {
    console.error('Account deletion error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
