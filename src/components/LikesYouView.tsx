import React, { useState, useEffect } from 'react';
import { Heart, X, Sparkles, CheckCircle2, HeartOff, UserCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../api/client';
import { getProfileDisplayPhotoUrl } from '../utils/photoUtils';

interface LikesYouViewProps {
  onOpenProfile: (profile: UserProfile) => void;
  onLikeBack: (profile: UserProfile) => void;
  onPass: (profile: UserProfile) => void;
}

export const LikesYouView: React.FC<LikesYouViewProps> = ({
  onOpenProfile,
  onLikeBack,
  onPass,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inbound' | 'sent'>('inbound');
  const [inboundLikes, setInboundLikes] = useState<UserProfile[]>([]);
  const [sentLikes, setSentLikes] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [inbound, sent] = await Promise.all([
        api.getInboundLikes(),
        api.getSentLikes(),
      ]);
      setInboundLikes(inbound);
      setSentLikes(sent);
    } catch (e) {
      console.error('Failed to load likes data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInboundAction = async (profile: UserProfile, isLike: boolean) => {
    setActionLoadingId(profile.userId);
    try {
      if (isLike) {
        // Triggers match logic on backend
        await api.like(profile.userId);
        onLikeBack(profile);
      } else {
        await api.pass(profile.userId);
        onPass(profile);
      }
      setInboundLikes((prev) => prev.filter((p) => p.userId !== profile.userId));
    } catch (err) {
      console.error('Error handling inbound like:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveLike = async (profile: UserProfile) => {
    setActionLoadingId(profile.userId);
    try {
      await api.removeLike(profile.userId);
      setSentLikes((prev) => prev.filter((p) => p.userId !== profile.userId));
    } catch (err) {
      console.error('Error removing sent like:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div id="likes-you-container" className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 text-white pb-24">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 fill-rose-400" />
            <span>Connection Activity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Likes & Admirers</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Keep track of who likes you and profiles you have shown interest in.
          </p>
        </div>

        {/* Two Functional Tabs: Liked You & You Liked */}
        <div className="flex items-center gap-1 bg-[#141926] p-1 rounded-2xl border border-white/10 self-start sm:self-center">
          <button
            id="tab-liked-you"
            onClick={() => setActiveSubTab('inbound')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'inbound'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Heart className={`w-4 h-4 ${activeSubTab === 'inbound' ? 'fill-white' : ''}`} />
            <span>Liked You</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeSubTab === 'inbound' ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-300'
              }`}
            >
              {inboundLikes.length}
            </span>
          </button>

          <button
            id="tab-you-liked"
            onClick={() => setActiveSubTab('sent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'sent'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>You Liked</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeSubTab === 'sent' ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-300'
              }`}
            >
              {sentLikes.length}
            </span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400 text-sm animate-pulse">
          Loading connection history from database...
        </div>
      ) : activeSubTab === 'inbound' ? (
        // ================= TAB 1: LIKED YOU =================
        inboundLikes.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-[#141926] rounded-3xl border border-white/5 space-y-3 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 mx-auto">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">No new likes right now</h3>
            <p className="text-xs leading-relaxed">
              Keep your profile active, upload fresh photos, and continue exploring to get noticed by more members!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {inboundLikes.map((p) => (
              <div
                key={p.id}
                id={`like-card-${p.id}`}
                onClick={() => onOpenProfile(p)}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#141926] border border-white/10 cursor-pointer shadow-xl transition-all"
              >
                <img
                  src={getProfileDisplayPhotoUrl(p)}
                  alt={p.firstName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/30 to-transparent pointer-events-none" />

                {/* Compatibility Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/80 backdrop-blur-md text-white text-[10px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  <span>{p.compatibilityScore || 88}% Match</span>
                </div>

                {/* Bottom Card Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-white text-sm truncate">
                        {p.firstName}, {p.age}
                      </h3>
                      {p.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-300 truncate">{p.city}</p>
                  </div>

                  {/* Action Buttons: Pass & Match */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id={`btn-pass-inbound-${p.id}`}
                      disabled={actionLoadingId === p.userId}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInboundAction(p, false);
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Pass</span>
                    </button>

                    <button
                      id={`btn-likeback-inbound-${p.id}`}
                      disabled={actionLoadingId === p.userId}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInboundAction(p, true);
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-md shadow-rose-500/30 transition-all disabled:opacity-50"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>Match</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // ================= TAB 2: YOU LIKED =================
        sentLikes.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-[#141926] rounded-3xl border border-white/5 space-y-3 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 mx-auto">
              <UserCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">No outgoing likes yet</h3>
            <p className="text-xs leading-relaxed">
              When you like someone in Discover or 18+ Dating, their profile will be saved here so you can easily review them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sentLikes.map((p) => (
              <div
                key={p.id}
                id={`sent-like-card-${p.id}`}
                onClick={() => onOpenProfile(p)}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#141926] border border-white/10 cursor-pointer shadow-xl transition-all"
              >
                <img
                  src={getProfileDisplayPhotoUrl(p)}
                  alt={p.firstName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/30 to-transparent pointer-events-none" />

                {/* Sent Like Indicator */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold">
                  <Heart className="w-3 h-3 fill-white" />
                  <span>Liked by you</span>
                </div>

                {/* Bottom Card Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-white text-sm truncate">
                        {p.firstName}, {p.age}
                      </h3>
                      {p.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-300 truncate">{p.city}</p>
                    {p.datingIntent && (
                      <p className="text-[10px] text-rose-300 truncate mt-0.5">
                        {p.datingIntent}
                      </p>
                    )}
                  </div>

                  {/* Remove Like Option */}
                  <div className="pt-1">
                    <button
                      id={`btn-remove-like-${p.id}`}
                      disabled={actionLoadingId === p.userId}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLike(p);
                      }}
                      className="w-full py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-gray-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-white/5 disabled:opacity-50"
                    >
                      <HeartOff className="w-3.5 h-3.5" />
                      <span>Remove Like</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

