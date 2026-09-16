import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../auth';

const router = Router();

// POST /api/calls/initiate
// Enforces: established match relationship, neither party blocked
router.post('/initiate', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const callerId = req.user!.id;
    const { receiverId, conversationId } = req.body;

    if (!receiverId || !conversationId) {
      res.status(400).json({ error: 'receiverId and conversationId are required' });
      return;
    }

    // Security Check: Verify that caller and receiver have a valid established match
    const matches = db.getMatchesForUser(callerId);
    const hasMatch = matches.some(
      (m) => (m.user1Id === receiverId || m.user2Id === receiverId) && !m.isUnmatched
    );

    if (!hasMatch) {
      res.status(403).json({
        error: 'Video calling is only allowed between matched users with an established connection.',
      });
      return;
    }

    // Security Check: Verify neither party is blocked
    const isBlocked = db.isBlocked(callerId, receiverId);
    if (isBlocked) {
      res.status(403).json({ error: 'Cannot call this user because one of you has blocked the other.' });
      return;
    }

    const call = db.createCall(callerId, receiverId, conversationId);
    res.json({
      success: true,
      call,
      isDemoRecipient: receiverId.startsWith('user-seed-'),
    });
  } catch (err: any) {
    console.error('Initiate call error:', err);
    res.status(500).json({ error: 'Failed to initiate video call' });
  }
});

// POST /api/calls/:id/accept
router.post('/:id/accept', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const callId = req.params.id;
    const answeredAt = new Date().toISOString();
    const updated = db.updateCallStatus(callId, 'ACTIVE', { answeredAt });
    if (!updated) {
      res.status(404).json({ error: 'Call not found' });
      return;
    }
    res.json({ success: true, call: updated });
  } catch (err: any) {
    console.error('Accept call error:', err);
    res.status(500).json({ error: 'Failed to accept call' });
  }
});

// POST /api/calls/:id/decline
router.post('/:id/decline', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const callId = req.params.id;
    const endedAt = new Date().toISOString();
    const updated = db.updateCallStatus(callId, 'DECLINED', {
      endedAt,
      endedReason: 'declined_by_receiver',
    });
    if (!updated) {
      res.status(404).json({ error: 'Call not found' });
      return;
    }
    res.json({ success: true, call: updated });
  } catch (err: any) {
    console.error('Decline call error:', err);
    res.status(500).json({ error: 'Failed to decline call' });
  }
});

// POST /api/calls/:id/end
router.post('/:id/end', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const callId = req.params.id;
    const { durationSeconds } = req.body;
    const endedAt = new Date().toISOString();
    const updated = db.updateCallStatus(callId, 'ENDED', {
      endedAt,
      durationSeconds: durationSeconds || 0,
      endedReason: 'completed',
    });
    if (!updated) {
      res.status(404).json({ error: 'Call not found' });
      return;
    }
    res.json({ success: true, call: updated });
  } catch (err: any) {
    console.error('End call error:', err);
    res.status(500).json({ error: 'Failed to end call' });
  }
});

// GET /api/calls/history/:conversationId
router.get('/history/:conversationId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const calls = db.getCallsByConversation(req.params.conversationId);
    res.json(calls);
  } catch (err: any) {
    console.error('Call history error:', err);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

export default router;
