import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../auth';

const router = Router();

// GET /api/notifications
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const notifs = db.getNotifications(req.user!.id);
    res.json(notifs);
  } catch (err: any) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const success = db.markNotificationAsRead(req.params.id, req.user!.id);
    res.json({ success });
  } catch (err: any) {
    console.error('Read notification error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    db.markAllNotificationsAsRead(req.user!.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Read all error:', err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;
