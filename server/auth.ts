import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { User, UserProfile } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'vibematch-super-secure-production-jwt-secret-key-2026';

export interface AuthRequest extends Request {
  user?: User;
  profile?: UserProfile;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function calculateAgeFromBirthdate(birthDateStr: string): number {
  const birth = new Date(birthDateStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const user = db.getUserById(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'This account has been banned due to violation of Community Guidelines' });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({ error: 'This account is temporarily suspended' });
      return;
    }

    req.user = user;
    req.profile = db.getProfileByUserId(user.id);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin authorization required' });
    return;
  }
  next();
}
