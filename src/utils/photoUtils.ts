import { UserProfile, Photo } from '../types';

// Clean neutral silhouette avatar as scalable vector SVG data URL
export const GENERIC_AVATAR_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <rect width="200" height="200" fill="#141926"/>
    <circle cx="100" cy="74" r="38" fill="#374151"/>
    <path d="M38 180 C38 134 65 122 100 122 C135 122 162 134 162 180 Z" fill="#374151"/>
  </svg>`
)}`;

// Demo/AI placeholder photo reserved exclusively for seeded demo profiles (isDemo=true)
export const DEMO_PLACEHOLDER_PHOTO =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

/**
 * Retrieves the primary photo object for a user profile.
 * Follows strict single-primary logic: photo with isPrimary/isMain is favored,
 * otherwise index 0 if valid.
 */
export function getPrimaryPhoto(profile: Partial<UserProfile> | null | undefined): Photo | null {
  if (!profile || !profile.photos || profile.photos.length === 0) return null;
  const validPhotos = profile.photos.filter((p) => p && typeof p.url === 'string' && p.url.trim() !== '');
  if (validPhotos.length === 0) return null;

  const primary = validPhotos.find((p) => p.isPrimary || p.isMain);
  return primary || validPhotos[0];
}

/**
 * Core Fallback Rule Implementation:
 * IF user has uploaded photo: show uploaded photo
 * ELSE IF user is a demo user ("isDemo=true"): show demo/AI placeholder photo
 * ELSE: show a neutral generic placeholder/avatar
 */
export function getProfileDisplayPhotoUrl(profile: Partial<UserProfile> | null | undefined): string {
  if (!profile) return GENERIC_AVATAR_PLACEHOLDER;

  const primary = getPrimaryPhoto(profile);

  // 1. User has an actual photo (either uploaded or generated for them)
  if (primary && primary.url) {
    return primary.url;
  }

  // 2. Demo profile fallback
  if (profile.isDemo) {
    return DEMO_PLACEHOLDER_PHOTO;
  }

  // 3. Neutral generic placeholder for real users with no uploaded photo
  return GENERIC_AVATAR_PLACEHOLDER;
}

/**
 * Returns an array of display photos for carousels / detail views.
 * Sorts primary photo to index 0.
 * Falls back to demo photo if isDemo, or generic placeholder if real user with 0 photos.
 */
export function getProfilePhotos(profile: Partial<UserProfile> | null | undefined): Photo[] {
  if (!profile) {
    return [
      {
        id: 'generic-avatar-placeholder',
        profileId: '',
        url: GENERIC_AVATAR_PLACEHOLDER,
        isMain: true,
        isPrimary: true,
        order: 0,
        createdAt: '',
      },
    ];
  }

  const validPhotos = (profile.photos || []).filter((p) => p && typeof p.url === 'string' && p.url.trim() !== '');

  if (validPhotos.length > 0) {
    return [...validPhotos].sort((a, b) => {
      const aPrimary = a.isPrimary || a.isMain;
      const bPrimary = b.isPrimary || b.isMain;
      if (aPrimary && !bPrimary) return -1;
      if (!aPrimary && bPrimary) return 1;
      return (a.order || 0) - (b.order || 0);
    });
  }

  if (profile.isDemo) {
    return [
      {
        id: 'demo-placeholder-photo',
        profileId: profile.id || '',
        url: DEMO_PLACEHOLDER_PHOTO,
        isMain: true,
        isPrimary: true,
        order: 0,
        createdAt: '',
      },
    ];
  }

  return [
    {
      id: 'generic-avatar-placeholder',
      profileId: profile.id || '',
      url: GENERIC_AVATAR_PLACEHOLDER,
      isMain: true,
      isPrimary: true,
      order: 0,
      createdAt: '',
    },
  ];
}
