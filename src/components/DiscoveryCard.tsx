import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  X,
  Star,
  Info,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Languages,
} from 'lucide-react';
import { UserProfile } from '../types';
import { getProfilePhotos } from '../utils/photoUtils';

interface DiscoveryCardProps {
  profile: UserProfile;
  onLike: (profile: UserProfile) => void;
  onPass: (profile: UserProfile) => void;
  onSuperLike: (profile: UserProfile) => void;
  onOpenDetails: (profile: UserProfile) => void;
  swipeDirection?: 'left' | 'right' | 'up' | null;
}

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
  profile,
  onLike,
  onPass,
  onSuperLike,
  onOpenDetails,
  swipeDirection,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const photos = getProfilePhotos(profile);

  // Reset photo index if profile changes
  useEffect(() => {
    setActivePhotoIdx(0);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, [profile.id]);

  const handleNextPhoto = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Drag / Touch Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary button
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    // Do not initiate drag if tapping specific interactive controls
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.no-drag')) {
      return;
    }

    startPosRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    setIsDragging(true);

    if (cardRef.current) {
      cardRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;

    if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
      hasMovedRef.current = true;
    }

    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      if (cardRef.current?.hasPointerCapture(e.pointerId)) {
        cardRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const { x, y } = dragOffset;
    const SWIPE_THRESHOLD = 95;

    // Determine if threshold exceeded
    if (x > SWIPE_THRESHOLD) {
      // Swiped Right -> LIKE
      onLike(profile);
    } else if (x < -SWIPE_THRESHOLD) {
      // Swiped Left -> PASS
      onPass(profile);
    } else if (y < -SWIPE_THRESHOLD && Math.abs(y) > Math.abs(x)) {
      // Swiped Up -> SUPER LIKE
      onSuperLike(profile);
    } else {
      // Reset position smoothly
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      try {
        if (cardRef.current?.hasPointerCapture(e.pointerId)) {
          cardRef.current.releasePointerCapture(e.pointerId);
        }
      } catch {}
    }
  };

  // Calculate dynamic transform & rotation
  let cardTransform = '';
  let cardTransition = isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.3s ease';

  if (swipeDirection === 'left') {
    cardTransform = 'translate3d(-150vw, 0, 0) rotate(-22deg)';
    cardTransition = 'transform 0.35s ease-out, opacity 0.35s ease-out';
  } else if (swipeDirection === 'right') {
    cardTransform = 'translate3d(150vw, 0, 0) rotate(22deg)';
    cardTransition = 'transform 0.35s ease-out, opacity 0.35s ease-out';
  } else if (swipeDirection === 'up') {
    cardTransform = 'translate3d(0, -150vh, 0) scale(1.08)';
    cardTransition = 'transform 0.35s ease-out, opacity 0.35s ease-out';
  } else if (isDragging || dragOffset.x !== 0 || dragOffset.y !== 0) {
    const rotation = dragOffset.x * 0.07; // ~7deg per 100px
    cardTransform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`;
  }

  // Calculate badge opacity based on real-time drag or programmatic swipe
  const isDraggingX = Math.abs(dragOffset.x) >= Math.abs(dragOffset.y);
  const likeOpacity =
    swipeDirection === 'right'
      ? 1
      : isDraggingX && dragOffset.x > 25
      ? Math.min(1, (dragOffset.x - 25) / 75)
      : 0;

  const passOpacity =
    swipeDirection === 'left'
      ? 1
      : isDraggingX && dragOffset.x < -25
      ? Math.min(1, (-dragOffset.x - 25) / 75)
      : 0;

  const superLikeOpacity =
    swipeDirection === 'up'
      ? 1
      : !isDraggingX && dragOffset.y < -25
      ? Math.min(1, (-dragOffset.y - 25) / 75)
      : 0;

  return (
    <div
      ref={cardRef}
      id={`discovery-card-${profile.id}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        transform: cardTransform,
        transition: cardTransition,
        touchAction: 'none',
      }}
      className="relative w-full max-w-sm sm:max-w-md h-[580px] sm:h-[630px] rounded-3xl overflow-hidden shadow-2xl bg-[#141824] border border-white/10 select-none flex flex-col justify-between cursor-grab active:cursor-grabbing will-change-transform"
    >
      {/* Background Image & Photo Carousel */}
      <div className="absolute inset-0 z-0 bg-black">
        <img
          src={photos[activePhotoIdx]?.url}
          alt={profile.firstName}
          className="w-full h-full object-cover object-center pointer-events-none"
          referrerPolicy="no-referrer"
        />

        {/* Ambient Dark Gradient for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/50 to-black/30 pointer-events-none" />

        {/* Tap areas for photo cycling */}
        <div
          className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer flex items-center pl-2 opacity-0 hover:opacity-75 transition-opacity"
          onClick={(e) => {
            if (!hasMovedRef.current) handlePrevPhoto(e);
          }}
          title="Previous photo"
        >
          {photos.length > 1 && (
            <div className="p-1.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
              <ChevronLeft className="w-5 h-5" />
            </div>
          )}
        </div>
        <div
          className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer flex items-center justify-end pr-2 opacity-0 hover:opacity-75 transition-opacity"
          onClick={(e) => {
            if (!hasMovedRef.current) handleNextPhoto(e);
          }}
          title="Next photo"
        >
          {photos.length > 1 && (
            <div className="p-1.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
              <ChevronRight className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* Top Header: Photo Progress Bars & Badges */}
      <div className="relative z-20 p-4 pt-3 space-y-2.5">
        {/* Story Progress Indicators */}
        {photos.length > 1 && (
          <div className="flex items-center gap-1.5 w-full">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className="h-1 flex-1 rounded-full overflow-hidden bg-white/30 backdrop-blur-sm"
              >
                <div
                  className={`h-full transition-all duration-200 ${
                    idx === activePhotoIdx
                      ? 'bg-white'
                      : idx < activePhotoIdx
                      ? 'bg-white/70'
                      : 'bg-transparent'
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Badges Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {profile.compatibilityScore !== undefined && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/85 backdrop-blur-md text-white text-xs font-bold shadow-lg shadow-rose-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{profile.compatibilityScore}% Vibe Match</span>
              </div>
            )}
            {profile.isVerified && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/85 backdrop-blur-md text-white text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </div>
            )}
          </div>

          <button
            id={`btn-card-info-${profile.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(profile);
            }}
            className="p-2 rounded-full bg-black/50 text-white/90 hover:text-white hover:bg-black/70 backdrop-blur-md border border-white/10 transition-colors pointer-events-auto"
            title="View Full Profile"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time Dynamic Swipe Badges */}
      <div
        style={{ opacity: likeOpacity }}
        className="absolute top-20 left-6 z-30 transform -rotate-12 border-4 border-emerald-400 text-emerald-400 font-extrabold text-3xl px-4 py-1.5 rounded-2xl bg-black/50 backdrop-blur-md uppercase tracking-wider pointer-events-none shadow-xl shadow-emerald-500/20"
      >
        LIKE
      </div>

      <div
        style={{ opacity: passOpacity }}
        className="absolute top-20 right-6 z-30 transform rotate-12 border-4 border-rose-500 text-rose-500 font-extrabold text-3xl px-4 py-1.5 rounded-2xl bg-black/50 backdrop-blur-md uppercase tracking-wider pointer-events-none shadow-xl shadow-rose-500/20"
      >
        PASS
      </div>

      <div
        style={{ opacity: superLikeOpacity }}
        className="absolute top-20 left-1/2 -translate-x-1/2 z-30 border-4 border-sky-400 text-sky-400 font-extrabold text-3xl px-6 py-2 rounded-2xl bg-black/50 backdrop-blur-md uppercase tracking-wider pointer-events-none shadow-xl shadow-sky-500/30"
      >
        SUPER LIKE
      </div>

      {/* Bottom Profile Details (Internally Scrollable if long) & Action Bar */}
      <div className="relative z-20 p-5 pt-0 space-y-3.5 flex flex-col justify-end max-h-[65%]">
        {/* Scrollable Information Block */}
        <div
          className="space-y-2 cursor-pointer overflow-y-auto max-h-[180px] sm:max-h-[200px] pr-1.5 custom-scrollbar no-drag"
          onClick={() => {
            if (!hasMovedRef.current) {
              onOpenDetails(profile);
            }
          }}
        >
          {/* Name, Age, Intent */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {profile.firstName}
              </h2>
              <span className="text-2xl sm:text-3xl font-light text-white/80">
                {profile.age}
              </span>
            </div>

            {/* Subtitle / Location / Distance / Work */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs sm:text-sm text-gray-200/95 mt-1 font-medium">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{profile.city}</span>
                {profile.distanceKm !== undefined && (
                  <span className="text-white/60">• {profile.distanceKm} km away</span>
                )}
              </div>
              {profile.occupation && (
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate max-w-[200px]">{profile.occupation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Relationship Intention Pill */}
          {profile.relationshipIntention && (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-rose-200">
              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
              <span>Looking for: {profile.relationshipIntention}</span>
            </div>
          )}

          {/* Bio Preview */}
          <p className="text-sm text-gray-200 line-clamp-3 leading-relaxed font-normal">
            {profile.bio}
          </p>

          {/* Languages */}
          {profile.languages && profile.languages.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <Languages className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Speaks {profile.languages.join(', ')}</span>
            </div>
          )}

          {/* Shared / Top Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.interests.slice(0, 5).map((interest) => (
                <span
                  key={interest.id}
                  className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[11px] font-medium text-gray-200"
                >
                  {interest.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls Bar (Fixed at bottom of card) */}
        <div className="flex items-center justify-center gap-4 pt-1 border-t border-white/10 shrink-0">
          {/* Pass Button */}
          <button
            id={`btn-pass-${profile.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onPass(profile);
            }}
            className="w-14 h-14 rounded-full bg-[#1F2633]/90 hover:bg-[#2A3344] border border-white/10 flex items-center justify-center text-rose-400 hover:text-rose-300 hover:scale-110 active:scale-95 transition-all shadow-lg hover:shadow-rose-500/20 group cursor-pointer"
            title="Pass (Swipe Left or Left Arrow)"
          >
            <X className="w-7 h-7 stroke-[2.5] group-hover:rotate-12 transition-transform" />
          </button>

          {/* Super Like Button */}
          <button
            id={`btn-superlike-${profile.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSuperLike(profile);
            }}
            className="w-12 h-12 rounded-full bg-[#18263E]/90 hover:bg-[#203456] border border-sky-500/30 flex items-center justify-center text-sky-400 hover:text-sky-300 hover:scale-110 active:scale-95 transition-all shadow-lg hover:shadow-sky-500/20 group cursor-pointer"
            title="Super Like (Swipe Up or Up Arrow)"
          >
            <Star className="w-6 h-6 fill-sky-400/20 group-hover:scale-110 transition-transform" />
          </button>

          {/* Like Button */}
          <button
            id={`btn-like-${profile.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onLike(profile);
            }}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-xl shadow-rose-600/30 group cursor-pointer"
            title="Like (Swipe Right or Right Arrow)"
          >
            <Heart className="w-8 h-8 fill-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
