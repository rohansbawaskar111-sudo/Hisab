import React, { useState } from 'react';
import {
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Heart,
  Star,
  ShieldAlert,
  Languages,
  Ruler,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile } from '../types';
import { getProfilePhotos } from '../utils/photoUtils';

interface ProfileDetailModalProps {
  profile: UserProfile;
  onClose: () => void;
  onLike?: (profile: UserProfile) => void;
  onPass?: (profile: UserProfile) => void;
  onSuperLike?: (profile: UserProfile) => void;
  onReport: (profile: UserProfile) => void;
  onBlock: (profile: UserProfile) => void;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  profile,
  onClose,
  onLike,
  onPass,
  onSuperLike,
  onReport,
  onBlock,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);

  const photos = getProfilePhotos(profile);

  return (
    <div
      id="profile-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-lg min-h-screen sm:min-h-0 sm:max-h-[90vh] bg-[#121622] sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header / Close */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-4 bg-[#121622]/90 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-lg">{profile.firstName}, {profile.age}</h3>
            {profile.isVerified && (
              <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400/20" />
            )}
          </div>
          <button
            id="btn-close-profile-detail"
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6 pb-28">
          {/* Main Photo Gallery */}
          <div className="space-y-2">
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-black">
              <img
                src={photos[activePhotoIdx]?.url}
                alt={profile.firstName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {profile.compatibilityScore !== undefined && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/80 backdrop-blur-md text-white text-xs font-bold shadow-lg">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{profile.compatibilityScore}% Vibe Match</span>
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {photos.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {photos.map((photo, idx) => (
                  <button
                    key={photo.id || idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      activePhotoIdx === idx ? 'border-rose-500 ring-2 ring-rose-500/40' : 'border-white/10 opacity-60'
                    }`}
                  >
                    <img src={photo.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Core Info & Intent */}
          <div className="space-y-3 bg-[#171D2B] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{profile.firstName}, {profile.age}</h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-300 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{profile.city}</span>
                  {profile.distanceKm !== undefined && (
                    <span className="text-white/60">• {profile.distanceKm} km away</span>
                  )}
                </div>
              </div>
              {profile.isOnline && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Now
                </div>
              )}
            </div>

            {profile.relationshipIntention && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30 flex-shrink-0" />
                <span>Relationship Goal: <strong className="text-rose-200">{profile.relationshipIntention}</strong></span>
              </div>
            )}
          </div>

          {/* Bio / About */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">About Me</h4>
            <div className="p-4 rounded-2xl bg-[#171D2B] border border-white/5 text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </div>
          </div>

          {/* Interests & Passions */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Interests & Vibes</h4>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest.id}
                    className="px-3 py-1.5 rounded-full bg-[#1A2233] border border-white/10 text-xs font-medium text-gray-200 flex items-center gap-1.5"
                  >
                    <span>{interest.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Essentials Details */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Essentials</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {profile.occupation && (
                <div className="p-3 rounded-xl bg-[#171D2B] border border-white/5 flex items-center gap-2 text-gray-300">
                  <Briefcase className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="truncate">{profile.occupation}</span>
                </div>
              )}
              {profile.education && (
                <div className="p-3 rounded-xl bg-[#171D2B] border border-white/5 flex items-center gap-2 text-gray-300">
                  <GraduationCap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{profile.education}</span>
                </div>
              )}
              {profile.height && (
                <div className="p-3 rounded-xl bg-[#171D2B] border border-white/5 flex items-center gap-2 text-gray-300">
                  <Ruler className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{profile.height}</span>
                </div>
              )}
              {profile.languages && profile.languages.length > 0 && (
                <div className="p-3 rounded-xl bg-[#171D2B] border border-white/5 flex items-center gap-2 text-gray-300">
                  <Languages className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span className="truncate">{profile.languages.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Safety & Moderation Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              id={`btn-report-profile-${profile.id}`}
              onClick={() => onReport(profile)}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 py-1"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report {profile.firstName}</span>
            </button>
            <button
              id={`btn-block-profile-${profile.id}`}
              onClick={() => onBlock(profile)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-300 py-1"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Block User</span>
            </button>
          </div>
        </div>

        {/* Floating Bottom Action Bar (if buttons supplied) */}
        {(onLike || onPass || onSuperLike) && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/90 to-transparent flex items-center justify-center gap-5">
            {onPass && (
              <button
                onClick={() => {
                  onPass(profile);
                  onClose();
                }}
                className="w-14 h-14 rounded-full bg-[#1F2633] hover:bg-[#2A3344] border border-white/10 flex items-center justify-center text-rose-400 hover:scale-105 active:scale-95 transition-all shadow-lg"
                title="Pass"
              >
                <X className="w-7 h-7 stroke-[2.5]" />
              </button>
            )}
            {onSuperLike && (
              <button
                onClick={() => {
                  onSuperLike(profile);
                  onClose();
                }}
                className="w-12 h-12 rounded-full bg-[#18263E] hover:bg-[#203456] border border-sky-500/30 flex items-center justify-center text-sky-400 hover:scale-105 active:scale-95 transition-all shadow-lg"
                title="Super Like"
              >
                <Star className="w-6 h-6 fill-sky-400/20" />
              </button>
            )}
            {onLike && (
              <button
                onClick={() => {
                  onLike(profile);
                  onClose();
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-rose-600/30"
                title="Like"
              >
                <Heart className="w-7 h-7 fill-white" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
