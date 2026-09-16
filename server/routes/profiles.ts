import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../auth';
import { DiscoveryFilters } from '../../src/types';

const router = Router();

// GET /api/interests
router.get('/interests', (_req, res) => {
  res.json(db.getInterests());
});

// GET /api/profiles/discover
router.get('/discover', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const query = req.query;

    const filters: Partial<DiscoveryFilters> = {};
    if (query.minAge) filters.minAge = parseInt(query.minAge as string, 10);
    if (query.maxAge) filters.maxAge = parseInt(query.maxAge as string, 10);
    if (query.maxDistanceKm) filters.maxDistanceKm = parseInt(query.maxDistanceKm as string, 10);
    if (query.gender) filters.gender = query.gender as any;
    if (query.verifiedOnly) filters.verifiedOnly = query.verifiedOnly === 'true';

    const feed = db.getDiscoverFeed(userId, filters);
    res.json(feed);
  } catch (err: any) {
    console.error('Discover feed error:', err);
    res.status(500).json({ error: 'Failed to fetch discovery feed' });
  }
});

// GET /api/profiles/adult-dating (Strict 18+ enforcement on backend)
router.get('/adult-dating', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const feed = db.getAdultDatingFeed(userId, req.query);
    res.json(feed);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED_UNDER_18') {
      res.status(403).json({
        error: 'Age eligibility required: You must be verified as 18 or older to access 18+ Adult Dating mode.',
      });
      return;
    }
    console.error('Adult dating feed error:', err);
    res.status(500).json({ error: 'Failed to fetch adult dating feed' });
  }
});

// GET /api/profiles/search?q=
router.get('/search', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const q = (req.query.q || req.query.query || '') as string;
    const isAdultOnly = req.query.isAdultOnly === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const results = db.searchUsers(q, userId, { isAdultOnly, limit });
    res.json(results);
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// GET /api/profiles/me
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const profile = db.getProfileByUserId(req.user!.id);
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  res.json(profile);
});

// PUT /api/profiles/me
router.put('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const updated = db.createOrUpdateProfile(userId, req.body);
    res.json(updated);
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/profiles/me/photos
// Adds or uploads a photo to profile, setting it as primary by default
router.post('/me/photos', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { url, isPrimary, replacePhotoId, isAiGenerated, style, visibility } = req.body;
    if (!url) {
      res.status(400).json({ error: 'Photo URL is required' });
      return;
    }

    const photo = db.addProfilePhoto(userId, {
      url,
      isPrimary: isPrimary !== undefined ? isPrimary : true,
      replacePhotoId,
      isAiGenerated: Boolean(isAiGenerated),
      style,
      visibility,
    });

    const updatedProfile = db.getProfileByUserId(userId);
    res.json({ success: true, photo, profile: updatedProfile });
  } catch (err: any) {
    console.error('Add photo error:', err);
    res.status(500).json({ error: err.message || 'Failed to add photo' });
  }
});

// PUT /api/profiles/me/photos/:photoId/primary
// Marks a specific photo as primary (#1) and adjusts all others
router.put('/me/photos/:photoId/primary', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const photoId = req.params.photoId;
    const success = db.setPrimaryPhoto(userId, photoId);
    if (!success) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }
    const updatedProfile = db.getProfileByUserId(userId);
    res.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    console.error('Set primary photo error:', err);
    res.status(500).json({ error: 'Failed to set primary photo' });
  }
});

// PUT /api/profiles/me/photos/:photoId/replace
// Replaces an existing photo with a new URL and busts cache
router.put('/me/photos/:photoId/replace', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const photoId = req.params.photoId;
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'Photo URL is required' });
      return;
    }

    const photo = db.replaceProfilePhoto(userId, photoId, url);
    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }
    const updatedProfile = db.getProfileByUserId(userId);
    res.json({ success: true, photo, profile: updatedProfile });
  } catch (err: any) {
    console.error('Replace photo error:', err);
    res.status(500).json({ error: 'Failed to replace photo' });
  }
});

// DELETE /api/profiles/me/photos/:photoId
// Deletes a photo from profile and re-assigns primary if needed
router.delete('/me/photos/:photoId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const photoId = req.params.photoId;
    const success = db.deleteProfilePhoto(userId, photoId);
    if (!success) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }
    const updatedProfile = db.getProfileByUserId(userId);
    res.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    console.error('Delete photo error:', err);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// GET /api/profiles/:id
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  const profile = db.getProfileByUserId(targetId);

  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  // Calculate distance relative to current user
  const me = db.getProfileByUserId(req.user!.id);
  if (me) {
    profile.distanceKm = db.calculateDistance(
      me.locationLat || 40.7128,
      me.locationLng || -74.006,
      profile.locationLat || 40.7128,
      profile.locationLng || -74.006
    );
    profile.compatibilityScore = db.calculateCompatibility(me, profile);
  }

  res.json(profile);
});

// GET /api/preferences
router.get('/preferences/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const pref = db.getPreferences(req.user!.id);
  res.json(pref);
});

// PUT /api/preferences
router.put('/preferences/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const updated = db.updatePreferences(req.user!.id, req.body);
  res.json(updated);
});

export default router;
