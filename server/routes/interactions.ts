import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../auth';

const router = Router();

// POST /api/likes
router.post('/likes', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user!.id;
    const targetId = req.body.targetId || req.body.targetUserId;

    if (!targetId) {
      res.status(400).json({ error: 'targetId is required' });
      return;
    }

    const result = db.recordLike(senderId, targetId);
    res.json({
      success: true,
      isMatch: !!result.match,
      match: result.match,
    });
  } catch (err: any) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Failed to record like' });
  }
});

// POST /api/super-likes
router.post('/super-likes', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user!.id;
    const targetId = req.body.targetId || req.body.targetUserId;

    if (!targetId) {
      res.status(400).json({ error: 'targetId is required' });
      return;
    }

    const result = db.recordSuperLike(senderId, targetId);
    res.json({
      success: true,
      isMatch: !!result.match,
      match: result.match,
    });
  } catch (err: any) {
    console.error('Super-like error:', err);
    res.status(500).json({ error: 'Failed to record super like' });
  }
});

// POST /api/passes
router.post('/passes', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user!.id;
    const targetId = req.body.targetId || req.body.targetUserId;

    if (!targetId) {
      res.status(400).json({ error: 'targetId is required' });
      return;
    }

    db.recordPass(senderId, targetId);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Pass error:', err);
    res.status(500).json({ error: 'Failed to record pass' });
  }
});

// GET /api/likes/inbound & /api/likes/received
router.get('/likes/inbound', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const profiles = db.getInboundLikes(req.user!.id);
    res.json(profiles);
  } catch (err: any) {
    console.error('Inbound likes error:', err);
    res.status(500).json({ error: 'Failed to fetch inbound likes' });
  }
});

router.get('/likes/received', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const profiles = db.getInboundLikes(req.user!.id);
    res.json(profiles);
  } catch (err: any) {
    console.error('Received likes error:', err);
    res.status(500).json({ error: 'Failed to fetch received likes' });
  }
});

// GET /api/likes/sent
router.get('/likes/sent', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const profiles = db.getSentLikes(req.user!.id);
    res.json(profiles);
  } catch (err: any) {
    console.error('Sent likes error:', err);
    res.status(500).json({ error: 'Failed to fetch sent likes' });
  }
});

// DELETE /api/likes/:targetId
router.delete('/likes/:targetId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const success = db.removeLike(req.user!.id, req.params.targetId);
    res.json({ success });
  } catch (err: any) {
    console.error('Remove like error:', err);
    res.status(500).json({ error: 'Failed to remove like' });
  }
});

// GET /api/matches
router.get('/matches', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const matches = db.getMatchesForUser(req.user!.id);
    res.json(matches);
  } catch (err: any) {
    console.error('Matches error:', err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// POST /api/matches/:id/unmatch
router.post('/matches/:id/unmatch', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const success = db.unmatch(req.params.id, req.user!.id);
    if (!success) {
      res.status(404).json({ error: 'Match not found or unauthorized' });
      return;
    }
    res.json({ success: true, message: 'Unmatched successfully' });
  } catch (err: any) {
    console.error('Unmatch error:', err);
    res.status(500).json({ error: 'Failed to unmatch' });
  }
});

export default router;
