import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, Search, MapPin, CheckCircle2, Heart, Clock } from 'lucide-react';
import { Match, UserProfile } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getProfileDisplayPhotoUrl } from '../utils/photoUtils';

interface MatchesViewProps {
  onOpenProfile: (profile: UserProfile) => void;
  onStartChat: (match: Match) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  onOpenProfile,
  onStartChat,
}) => {
  const { setActiveTab, setActiveChatMatch } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlineOnly, setOnlineOnly] = useState<boolean>(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMatches();
      setMatches(data);
    } catch (err) {
      console.error('Failed to load matches', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMatches = matches.filter((m) => {
    const nameMatch =
      m.matchedUser.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.matchedUser.city && m.matchedUser.city.toLowerCase().includes(searchQuery.toLowerCase()));
    const onlineMatch = !onlineOnly || m.matchedUser.isOnline;
    return nameMatch && onlineMatch;
  });

  return (
    <div id="screen-matches" className="flex-1 max-w-4xl mx-auto w-full p-4 pb-24 md:pb-12 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span>Your Matches</span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs font-semibold ml-1">
              {matches.length}
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            People who matched with your vibe. Start a conversation or view their profile.
          </p>
        </div>

        {/* Filters / Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141926] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            onClick={() => setOnlineOnly(!onlineOnly)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              onlineOnly
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-[#141926] border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Online Now
          </button>
        </div>
      </div>

      {/* Grid of Matches */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          <p className="text-xs text-gray-400">Loading your matches...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="py-20 text-center space-y-4 max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              {matches.length === 0 ? 'No matches yet' : 'No matches found'}
            </h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {matches.length === 0
                ? 'Head over to Discover and swipe right on people you like. When they like you back, they will appear here!'
                : 'Try adjusting your search query or toggling off the online filter.'}
            </p>
          </div>
          {matches.length === 0 && (
            <button
              onClick={() => setActiveTab('discover')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-rose-500/20"
            >
              Start Swiping in Discover
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMatches.map((match) => {
            const profile = match.matchedUser;
            const photoUrl = getProfileDisplayPhotoUrl(profile);

            return (
              <div
                key={match.id}
                id={`match-card-${match.id}`}
                className="group relative rounded-2xl overflow-hidden bg-[#131722] border border-white/5 hover:border-rose-500/30 transition-all flex flex-col shadow-lg"
              >
                {/* Photo & Click to Inspect */}
                <div
                  className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden"
                  onClick={() => onOpenProfile(profile)}
                >
                  <img
                    src={photoUrl}
                    alt={profile.firstName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-black/20" />

                  {/* Online / Verified Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    {profile.compatibilityScore !== undefined && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/80 backdrop-blur-md text-[10px] font-bold text-white shadow">
                        {profile.compatibilityScore}% Vibe
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      {profile.isVerified && (
                        <div className="p-1 rounded-full bg-sky-500/80 text-white backdrop-blur-md">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}
                      {profile.isOnline && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black shadow" />
                      )}
                    </div>
                  </div>

                  {/* Name, Age, City */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <div className="flex items-center gap-1.5 font-bold text-base leading-tight">
                      <span>{profile.firstName}</span>
                      <span className="font-light opacity-90">{profile.age}</span>
                    </div>
                    {profile.city && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-300 mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="truncate">{profile.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Bar: Action buttons */}
                <div className="p-3 bg-[#111520] flex items-center justify-between gap-2 border-t border-white/5">
                  <button
                    onClick={() => onOpenProfile(profile)}
                    className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors text-center"
                  >
                    View
                  </button>
                  <button
                    id={`btn-chat-match-${match.id}`}
                    onClick={() => {
                      onStartChat(match);
                      setActiveChatMatch(match);
                      setActiveTab('chat');
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity shadow-md shadow-rose-500/20"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
