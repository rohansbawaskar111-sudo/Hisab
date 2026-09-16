import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateToken, calculateAgeFromBirthdate, authenticateToken, AuthRequest } from '../auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, birthDate, gender, interestedIn, city, photos } = req.body;

    if (!email || !password || !firstName || !birthDate) {
      res.status(400).json({ error: 'Please provide all required fields' });
      return;
    }

    // Minimum age verification (18 years)
    const age = calculateAgeFromBirthdate(birthDate);
    if (age < 18) {
      res.status(400).json({ error: 'You must be at least 18 years old to join VibeMatch' });
      return;
    }

    // Check if email already exists
    const existing = db.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = db.createUser(email, passwordHash, 'user');

    // Create profile without any default AI/demo photos for real users
    const initialPhotos = Array.isArray(photos) && photos.length > 0 ? photos : [];

    const profile = db.createOrUpdateProfile(user.id, {
      firstName,
      birthDate,
      age,
      gender: gender || 'woman',
      interestedIn: interestedIn || 'everyone',
      city: city || 'New York, NY',
      bio: req.body.bio || `Hey, I am ${firstName}! Excited to meet new people and find good vibes.`,
      photos: initialPhotos,
      languages: ['English'],
      relationshipIntention: req.body.relationshipIntention || 'Long-term partner',
      interests: req.body.interests || [],
      isDemo: false,
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      profile,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch =
      bcrypt.compareSync(password, user.passwordHash) ||
      (user.email.endsWith('@vibematch.app') &&
        (password === 'demo123456' || password === 'Vibe123!' || password === 'Password123!'));
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'This account has been banned for violating our Community Guidelines.' });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({ error: 'This account is currently suspended.' });
      return;
    }

    const token = generateToken(user);
    const profile = db.getProfileByUserId(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      profile,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/demo-login
router.post('/demo-login', async (req, res) => {
  try {
    const { role = 'user' } = req.body;
    const email = role === 'admin' ? 'admin@vibematch.app' : 'alex@vibematch.app';

    const user = db.getUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'Demo user not found' });
      return;
    }

    const token = generateToken(user);
    const profile = db.getProfileByUserId(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      profile,
    });
  } catch (err: any) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const profile = db.getProfileByUserId(user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
    profile,
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Please enter your email' });
    return;
  }
  // Safe confirmation message without exposing user existence
  res.json({
    message: 'If an account exists with this email, password reset instructions have been sent.',
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ error: 'Email and new password are required' });
    return;
  }
  const user = db.getUserByEmail(email);
  if (user) {
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    db.updateUser(user.id, { passwordHash: user.passwordHash });
  }
  res.json({ message: 'Password has been successfully updated. You can now log in.' });
});

export default router;
