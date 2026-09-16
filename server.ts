import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

import authRouter from './server/routes/auth';
import profilesRouter from './server/routes/profiles';
import interactionsRouter from './server/routes/interactions';
import chatRouter from './server/routes/chat';
import notificationsRouter from './server/routes/notifications';
import safetyRouter from './server/routes/safety';
import adminRouter from './server/routes/admin';
import uploadRouter from './server/routes/upload';
import callsRouter from './server/routes/calls';
import aiRouter from './server/routes/ai';
import { db } from './server/db';

const PORT = 3000;
const app = express();
const server = http.createServer(app);

// Enable JSON body parsing with reasonable size for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
const uploadsPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Health Check API
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'VibeMatch',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routes
app.use('/api/auth', authRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api', interactionsRouter);
app.use('/api', chatRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/safety', safetyRouter);
app.use('/api', safetyRouter); // also handles /api/reports, /api/blocks, /api/verification
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/calls', callsRouter);
app.use('/api/ai', aiRouter);

// Centralized error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[VibeMatch Error Handler]:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'An unexpected error occurred. Please try again later.',
  });
});

// WebSocket Server for real-time messaging & typing indicators
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Map<string, WebSocket>(); // userId -> ws

wss.on('connection', (ws: WebSocket) => {
  let currentUserId: string | null = null;

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'authenticate') {
        currentUserId = msg.userId;
        if (currentUserId) {
          clients.set(currentUserId, ws);
          // Broadcast online status
          ws.send(JSON.stringify({ type: 'authenticated', userId: currentUserId }));
        }
      } else if (msg.type === 'typing' && currentUserId) {
        const { recipientId, isTyping, conversationId } = msg;
        const recipientSocket = clients.get(recipientId);
        if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
          recipientSocket.send(
            JSON.stringify({
              type: 'user_typing',
              conversationId,
              userId: currentUserId,
              isTyping,
            })
          );
        }
      } else if (msg.type === 'new_message' && currentUserId) {
        const { recipientId, message } = msg;
        const recipientSocket = clients.get(recipientId);
        if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
          recipientSocket.send(
            JSON.stringify({
              type: 'message_received',
              message,
            })
          );
        }

        // Auto-reply simulation for demo / seed profiles
        if (recipientId && recipientId.startsWith('user-seed-')) {
          const senderSocket = clients.get(currentUserId);
          const seedProfile = db.getProfileByUserId(recipientId);
          const seedName = seedProfile?.firstName || 'Match';

          // Step 1: Simulate typing indicator
          setTimeout(() => {
            if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
              senderSocket.send(
                JSON.stringify({
                  type: 'user_typing',
                  conversationId: message.conversationId,
                  userId: recipientId,
                  isTyping: true,
                })
              );
            }
          }, 600);

          // Step 2: Send smart contextual reply from seed profile
          setTimeout(() => {
            const replies: string[] = [
              `That's so awesome! I completely agree with you 😊`,
              `Haha you seem like great energy! What's your favorite spot in town?`,
              `I love that! We definitely share a great vibe ✨`,
              `Tell me more! Are you more of a coffee or chai person? ☕`,
              `Sounds like a plan! Let's definitely catch up sometime!`,
            ];
            let replyText = replies[Math.floor(Math.random() * replies.length)];
            if (seedName === 'Aanya') {
              replyText = `That's lovely! FC Road cafes have the best vibe on Sunday mornings. Have you tried the pour-over there? ☕✨`;
            } else if (seedName === 'Riya') {
              replyText = `Totally! Bandra has the best hidden thrift stores and seaside sunsets. Loving this conversation! 🎨`;
            } else if (seedName === 'Neha') {
              replyText = `Wine, good food and great stories are the best combo! What's your go-to comfort food? 🍷`;
            } else if (seedName === 'Sneha') {
              replyText = `I appreciate that! There's something so peaceful about historic architecture and good books 🏛️`;
            }

            const autoMsg = db.addMessage(message.conversationId, recipientId, replyText);

            if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
              senderSocket.send(
                JSON.stringify({
                  type: 'user_typing',
                  conversationId: message.conversationId,
                  userId: recipientId,
                  isTyping: false,
                })
              );
              senderSocket.send(
                JSON.stringify({
                  type: 'message_received',
                  message: autoMsg,
                })
              );
            }
          }, 1800);
        }
      } else if (msg.type === 'call_user' && currentUserId) {
        const { recipientId, callId, conversationId } = msg;
        const callerProfile = db.getProfileByUserId(currentUserId);
        const recipientSocket = clients.get(recipientId);

        if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
          recipientSocket.send(
            JSON.stringify({
              type: 'incoming_call',
              callId,
              conversationId,
              caller: callerProfile,
            })
          );
        }

        // Interactive simulation for demo profiles
        if (recipientId && recipientId.startsWith('user-seed-')) {
          const senderSocket = clients.get(currentUserId);
          setTimeout(() => {
            if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
              db.updateCallStatus(callId, 'ACTIVE', { answeredAt: new Date().toISOString() });
              senderSocket.send(
                JSON.stringify({
                  type: 'call_accepted',
                  callId,
                  recipientId,
                })
              );
            }
          }, 2400);
        }
      } else if (msg.type === 'call_response' && currentUserId) {
        const { callerId, callId, accepted } = msg;
        const callerSocket = clients.get(callerId);
        if (callerSocket && callerSocket.readyState === WebSocket.OPEN) {
          callerSocket.send(
            JSON.stringify({
              type: accepted ? 'call_accepted' : 'call_declined',
              callId,
              responderId: currentUserId,
            })
          );
        }
      } else if (msg.type === 'call_signal' && currentUserId) {
        const { targetUserId, signal, callId } = msg;
        const targetSocket = clients.get(targetUserId);
        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
          targetSocket.send(
            JSON.stringify({
              type: 'call_signal',
              signal,
              callId,
              fromUserId: currentUserId,
            })
          );
        }
      } else if (msg.type === 'call_hangup' && currentUserId) {
        const { targetUserId, callId, durationSeconds } = msg;
        if (callId) {
          db.updateCallStatus(callId, 'ENDED', {
            endedAt: new Date().toISOString(),
            durationSeconds: durationSeconds || 0,
            endedReason: 'hangup',
          });
        }
        const targetSocket = clients.get(targetUserId);
        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
          targetSocket.send(
            JSON.stringify({
              type: 'call_ended',
              callId,
              byUserId: currentUserId,
            })
          );
        }
      }
    } catch (e) {
      console.error('[WS Message Error]:', e);
    }
  });

  ws.on('close', () => {
    if (currentUserId) {
      clients.delete(currentUserId);
    }
  });
});

// Setup Vite development middleware or static production serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[VibeMatch] Server is running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('[Server Startup Error]:', err);
});
