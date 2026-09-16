import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../auth';

const router = Router();

// Basic abusive content filter list
const BANNED_KEYWORDS = [
  'scam',
  'wire money',
  'crypto investment',
  'whatsapp me for cash',
  'venmo me first',
];

function containsAbusiveContent(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_KEYWORDS.some((kw) => lower.includes(kw));
}

// GET /api/conversations or /api/matches
const handleGetMatches = (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const matches = db.getMatchesForUser(userId);
    res.json(matches);
  } catch (err: any) {
    console.error('Conversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};
router.get('/conversations', authenticateToken, handleGetMatches);
router.get('/matches', authenticateToken, handleGetMatches);

// GET /api/conversations/:id/messages or /api/matches/:id/messages
const handleGetMessages = (req: AuthRequest, res: Response) => {
  try {
    const convId = req.params.id;
    const messages = db.getConversationMessages(convId);
    res.json(messages);
  } catch (err: any) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};
router.get('/conversations/:id/messages', authenticateToken, handleGetMessages);
router.get('/matches/:id/messages', authenticateToken, handleGetMessages);

// POST /api/conversations/:id/messages or /api/matches/:id/messages
const handleSendMessage = (req: AuthRequest, res: Response) => {
  try {
    const convId = req.params.id;
    const senderId = req.user!.id;
    const { text, imageUrl } = req.body;

    if (!text && !imageUrl) {
      res.status(400).json({ error: 'Message cannot be empty' });
      return;
    }

    if (text && containsAbusiveContent(text)) {
      res.status(400).json({
        error: 'Message violates community guidelines (prohibited solicitation or terms detected).',
      });
      return;
    }

    const message = db.addMessage(convId, senderId, text || '', imageUrl);
    res.status(201).json(message);
  } catch (err: any) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
router.post('/conversations/:id/messages', authenticateToken, handleSendMessage);
router.post('/matches/:id/messages', authenticateToken, handleSendMessage);

// DELETE or POST /api/matches/:id or /api/conversations/:id/unmatch
const handleUnmatch = (req: AuthRequest, res: Response) => {
  try {
    const matchId = req.params.id;
    const userId = req.user!.id;
    const success = db.unmatch(matchId, userId);
    if (!success) {
      res.status(404).json({ error: 'Match not found or already unmatched' });
      return;
    }
    res.json({ success: true, message: 'Unmatched successfully' });
  } catch (err: any) {
    console.error('Unmatch error:', err);
    res.status(500).json({ error: 'Failed to unmatch' });
  }
};
router.delete('/matches/:id', authenticateToken, handleUnmatch);
router.post('/matches/:id/unmatch', authenticateToken, handleUnmatch);
router.post('/conversations/:id/unmatch', authenticateToken, handleUnmatch);

// POST /api/conversations/:id/read
router.post('/conversations/:id/read', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const convId = req.params.id;
    db.markMessagesAsRead(convId, req.user!.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// DELETE /api/messages/:id
router.delete('/messages/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const success = db.deleteMessage(req.params.id, req.user!.id);
    if (!success) {
      res.status(404).json({ error: 'Message not found or unauthorized' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete message error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
