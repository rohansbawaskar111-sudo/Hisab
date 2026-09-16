import React, { useState, useEffect } from 'react';
import {
  Flame,
  Search,
  Heart,
  X,
  Sparkles,
  MapPin,
  CheckCircle2,
  ShieldAlert,
  Flame as HotIcon,
  Clock,
  Radio,
  Video,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { UserProfile, Match } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getProfilePhotos, getProfileDisplayPhotoUrl } from '../utils/photoUtils';

interface AdultDatingViewProps {
  onOpenProfile: (profile: UserProfile) => void;
  onLike: (profile: UserProfile) => void;
  onPass: (profile: UserProfile) => void;
  onStartChat?: (profile: UserProfile) => void;
  onStartVideoCall?: (profile: UserProfile) => void;
}

export const AdultDatingView: React.FC<AdultDatingViewProps> = ({
  onOpenProfile,
  onLike,
  onPass,
  onStartChat,
  onStartVideoCall,
}) => {
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedIntent, setSelectedIntent] = useState('All');
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'trending' | 'all' | 'new'>('trending');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Photo gallery tracking per profile card
  const [activePhotoIndices, setActivePhotoIndices] = useState<Record<string, number>>({});

  // Dating Flow Modal (Match -> Hot Chat -> Video Call)
  const [flowModalNotice, setFlowModalNotice] = useState<{
    type: 'chat' | 'video';
    profile: UserProfile;
  } | null>(null);

  // Age restriction check
  const isAdult = user?.isAdult !== false && (!profile || profile.age >= 18);

  const loadMatches = async () => {
    try {
      const data = await api.getMatches();
      setMatches(data);
    } catch (e) {
      console.error('Failed to load matches in AdultDatingView', e);
    }
  };

  const fetchAdultFeed = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (searchQuery.trim()) {
        const results = await api.searchUsers(searchQuery.trim(), true);
        setProfiles(results);
      } else {
        const filters: any = {};
        if (selectedCity !== 'All') filters.city = selectedCity;
        if (selectedIntent !== 'All') filters.datingIntent = selectedIntent;
        if (onlyOnline) filters.isOnline = true;
        if (onlyVerified) filters.verifiedOnly = true;

        const data = await api.getAdultDatingFeed(filters);
        setProfiles(data);
      }
    } catch (err: any) {
      console.error('Adult feed error:', err);
      setError(err.message || 'Access restricted. You must be 18+ to view this section.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdult) {
      fetchAdultFeed();
      loadMatches();
    } else {
      setIsLoading(false);
    }
  }, [selectedCity, selectedIntent, onlyOnline, onlyVerified, activeCategory, isAdult]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdultFeed();
  };

  const isMatchedWithUser = (targetUserId: string) => {
    return matches.some(
      (m) => m.matchedUser?.userId === targetUserId || m.matchedUser?.id === targetUserId
    );
  };

  const handleLike = async (p: UserProfile) => {
    setActionLoadingId(p.userId);
    try {
      const res = await api.like(p.userId);
      onLike(p);
      if (res.isMatch) {
        await loadMatches();
      }
      setProfiles((prev) => prev.filter((item) => item.userId !== p.userId));
      if (flowModalNotice) {
        setFlowModalNotice(null);
      }
    } catch (err) {
      console.error('Error liking adult profile:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePass = async (p: UserProfile) => {
    setActionLoadingId(p.userId);
    try {
      await api.pass(p.userId);
      onPass(p);
      setProfiles((prev) => prev.filter((item) => item.userId !== p.userId));
    } catch (err) {
      console.error('Error passing adult profile:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChatClick = (p: UserProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isMatchedWithUser(p.userId)) {
      if (onStartChat) {
        onStartChat(p);
      } else {
        onOpenProfile(p);
      }
    } else {
      setFlowModalNotice({ type: 'chat', profile: p });
    }
  };

  const handleVideoCallClick = (p: UserProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isMatchedWithUser(p.userId)) {
      if (onStartVideoCall) {
        onStartVideoCall(p);
      } else {
        onOpenProfile(p);
      }
    } else {
      setFlowModalNotice({ type: 'video', profile: p });
    }
  };

  const handleNextPhoto = (profileId: string, totalPhotos: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalPhotos <= 1) return;
    setActivePhotoIndices((prev) => ({
      ...prev,
      [profileId]: ((prev[profileId] || 0) + 1) % totalPhotos,
    }));
  };

  const handlePrevPhoto = (profileId: string, totalPhotos: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalPhotos <= 1) return;
    setActivePhotoIndices((prev) => ({
      ...prev,
      [profileId]: ((prev[profileId] || 0) - 1 + totalPhotos) % totalPhotos,
    }));
  };

  // Under-18 Guard
  if (!isAdult) {
    return (
      <div
        id="adult-dating-restricted"
        className="min-h-[70vh] flex items-center justify-center p-6 text-center"
      >
        <div className="max-w-md w-full bg-[#151924] border border-red-500/20 rounded-3xl p-8 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Age Restricted (18+ Only)</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            The 18+ Dating section is strictly reserved for adult members aged 18 and older. Your
            account profile is currently recorded as under 18.
          </p>
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-xs text-red-300 text-left space-y-1">
            <p className="font-semibold text-red-200">Enforced by backend security:</p>
            <p>• Date of birth and age verification checks are enforced on every request.</p>
            <p>• Access and search queries for 18+ content are strictly blocked.</p>
          </div>
        </div>
      </div>
    );
  }

  const cities = ['All', 'Pune', 'Mumbai', 'Nashik', 'Aurangabad', 'Thane', 'Nagpur', 'Kolhapur'];
  const intents = [
    'All',
    'Casual dating',
    'Serious relationship',
    'Open to explore',
    'Deep emotional bond',
  ];

  // Hot & Trending spotlight selection (profiles with highest score)
  const trendingSpotlightProfiles = [...profiles]
    .sort((a, b) => (b.compatibilityScore || 90) - (a.compatibilityScore || 90))
    .slice(0, 4);

  return (
    <div id="adult-dating-view" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 text-white pb-24">
      {/* Hero / Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/70 via-[#1A1424] to-[#121620] border border-red-500/25 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-red-600/25 to-amber-500/25 border border-red-500/40 text-rose-300 text-xs font-bold tracking-wide">
              <Flame className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
              <span>18+ ADULT DATING MODE</span>
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded font-black">
                18+ ONLY
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-rose-100 to-amber-200 bg-clip-text text-transparent">
              Hot & Trending Adult Profiles
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Attractive, stylish, and sensual-but-non-explicit dating profiles with certified 18+
              verification, high compatibility, and secure consent flows.
            </p>
          </div>

          {/* Category Tabs: Trending / New / All */}
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 self-start md:self-center">
            <button
              id="category-trending"
              onClick={() => setActiveCategory('trending')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'trending'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <HotIcon className="w-3.5 h-3.5 fill-red-400" />
              <span>Hot & Trending</span>
            </button>
            <button
              id="category-new"
              onClick={() => setActiveCategory('new')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'new'
                  ? 'bg-rose-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>New Profiles</span>
            </button>
            <button
              id="category-all"
              onClick={() => setActiveCategory('all')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'all'
                  ? 'bg-white/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>All 18+</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="adult-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 18+ profiles by name, city, bio, or styles (e.g. Glamour, Beach)..."
              className="w-full pl-10 pr-24 py-2.5 bg-[#0F131C]/90 border border-white/10 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* City Filter */}
            <select
              id="filter-city-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 bg-[#0F131C] border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city === 'All' ? 'All Cities' : `City: ${city}`}
                </option>
              ))}
            </select>

            {/* Dating Intent Filter */}
            <select
              id="filter-intent-select"
              value={selectedIntent}
              onChange={(e) => setSelectedIntent(e.target.value)}
              className="px-3 py-2 bg-[#0F131C] border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {intents.map((intent) => (
                <option key={intent} value={intent}>
                  {intent === 'All' ? 'All Dating Intents' : intent}
                </option>
              ))}
            </select>

            {/* Online Now Toggle */}
            <button
              id="filter-online-toggle"
              type="button"
              onClick={() => setOnlyOnline(!onlyOnline)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                onlyOnline
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-[#0F131C] text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Online</span>
            </button>

            {/* Verified Toggle */}
            <button
              id="filter-verified-toggle"
              type="button"
              onClick={() => setOnlyVerified(!onlyVerified)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                onlyVerified
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'bg-[#0F131C] text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified 18+</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: 🔥 HOT & TRENDING SPOTLIGHT */}
      {trendingSpotlightProfiles.length > 0 && (
        <section id="section-hot-and-trending" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                <Flame className="w-4 h-4 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>🔥 Hot & Trending</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-extrabold border border-red-500/30">
                    Top Attractive Singles
                  </span>
                </h2>
                <p className="text-xs text-gray-400">
                  Curated stylish photography, verified 18+ badges, and high chemistry ratings
                </p>
              </div>
            </div>
            <span className="text-xs text-rose-300 font-semibold hidden sm:inline">
              ✨ Non-Explicit Verified Profiles
            </span>
          </div>

          {/* Trending Carousel Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingSpotlightProfiles.map((p) => {
              const photos = getProfilePhotos(p);
              const currentPhotoIdx = activePhotoIndices[p.userId] || 0;
              const photoCount = photos.length;
              const activePhoto = photos[currentPhotoIdx] || photos[0];
              const isMatched = isMatchedWithUser(p.userId);

              return (
                <div
                  key={`trending-${p.id}`}
                  id={`trending-card-${p.id}`}
                  onClick={() => onOpenProfile(p)}
                  className="group relative rounded-3xl overflow-hidden bg-[#151926] border border-red-500/30 hover:border-red-500/60 transition-all duration-300 shadow-xl cursor-pointer flex flex-col"
                >
                  {/* Image Gallery Stage */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-black">
                    <img
                      src={activePhoto?.url || getProfileDisplayPhotoUrl(p)}
                      alt={p.firstName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#151926] via-transparent to-black/40" />

                    {/* Gallery Navigation Arrows */}
                    {photoCount > 1 && (
                      <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <button
                          type="button"
                          onClick={(e) => handlePrevPhoto(p.userId, photoCount, e)}
                          className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white pointer-events-auto shadow-md"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleNextPhoto(p.userId, photoCount, e)}
                          className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white pointer-events-auto shadow-md"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Photo Dots */}
                    {photoCount > 1 && (
                      <div className="absolute top-2 left-0 right-0 flex justify-center gap-1 z-10 px-4">
                        {p.photos?.map((_, idx) => (
                          <span
                            key={idx}
                            className={`h-1 rounded-full transition-all ${
                              idx === currentPhotoIdx ? 'w-5 bg-white' : 'w-2 bg-white/40'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Badges on Top */}
                    <div className="absolute top-4 left-3 right-3 flex items-center justify-between z-10">
                      {/* Compatibility Rating */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-amber-500 backdrop-blur-md text-white text-[11px] font-extrabold shadow-lg">
                        <HotIcon className="w-3.5 h-3.5 fill-white text-white" />
                        <span>{p.compatibilityScore || 95}% Match</span>
                      </div>

                      {/* AI Generated Badge (if applicable) */}
                      {activePhoto?.isAiGenerated && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-rose-300 text-[10px] font-semibold border border-rose-500/40 shadow-md">
                          <Sparkles className="w-3 h-3 text-rose-400" />
                          <span>✨ AI Generated</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Info on Image */}
                    <div className="absolute bottom-3 left-3 right-3 z-10 space-y-1">
                      {activePhoto?.style && (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-gray-200 text-[10px] font-medium border border-white/10">
                          📷 {activePhoto.style}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-lg font-bold text-white drop-shadow-md">
                          {p.firstName}, {p.age}
                        </h3>
                        {p.isVerified && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-sky-500/80 backdrop-blur-md text-white text-[10px] font-bold"
                            title="18+ Verified Adult Badge"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>18+</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details & Action Bar */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-[#151926]">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1 text-gray-300">
                          <MapPin className="w-3 h-3 text-red-400" /> {p.city}
                        </span>
                        <span className="text-[11px] text-rose-300/80 font-medium">
                          {p.datingIntent || 'Casual dating'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2 mt-1.5 leading-relaxed">
                        {p.bio}
                      </p>
                    </div>

                    {/* 3 Specific Required Actions: Like, Chat, Video Call */}
                    <div className="pt-2 border-t border-white/10 flex items-center gap-1.5">
                      {/* Like Action */}
                      <button
                        id={`btn-trending-like-${p.id}`}
                        disabled={actionLoadingId === p.userId}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(p);
                        }}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-red-600/25 transition-all disabled:opacity-50"
                        title="Like profile"
                      >
                        <Heart className="w-3.5 h-3.5 fill-white" />
                        <span>Like</span>
                      </button>

                      {/* Chat Action */}
                      <button
                        id={`btn-trending-chat-${p.id}`}
                        type="button"
                        onClick={(e) => handleChatClick(p, e)}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all border ${
                          isMatched
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                        title={isMatched ? 'Chat with match' : 'Unlock Chat (Match first)'}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Chat</span>
                      </button>

                      {/* Video Call Action */}
                      <button
                        id={`btn-trending-video-${p.id}`}
                        type="button"
                        onClick={(e) => handleVideoCallClick(p, e)}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all border ${
                          isMatched
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                        title={
                          isMatched
                            ? 'Launch Video Call'
                            : 'Video Call (Unlocked after match/authorization)'
                        }
                      >
                        <Video className="w-4 h-4" />
                        <span className="hidden sm:inline">Call</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchAdultFeed}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Grid Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Explore 18+ Adult Singles</span>
            <span className="text-xs text-gray-400 font-normal">({profiles.length} available)</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-24 text-gray-400 text-sm animate-pulse space-y-3">
            <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading curated 18+ adult profiles...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-16 text-center text-gray-400 bg-[#141926] rounded-3xl border border-white/5 space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 mx-auto">
              <Flame className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No Profiles Found</h3>
            <p className="text-xs leading-relaxed">
              Try adjusting your search criteria or resetting filters to explore more adult profiles in your region.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('All');
                setSelectedIntent('All');
                setOnlyOnline(false);
                setOnlyVerified(false);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {profiles.map((p) => {
              const photos = getProfilePhotos(p);
              const currentPhotoIdx = activePhotoIndices[p.userId] || 0;
              const photoCount = photos.length;
              const activePhoto = photos[currentPhotoIdx] || photos[0];
              const isMatched = isMatchedWithUser(p.userId);

              return (
                <div
                  key={p.id}
                  id={`adult-profile-card-${p.id}`}
                  onClick={() => onOpenProfile(p)}
                  className="group relative rounded-3xl overflow-hidden bg-[#151926] border border-white/10 hover:border-red-500/40 transition-all duration-300 shadow-xl cursor-pointer flex flex-col"
                >
                  {/* Image Section with Gallery Controls */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-black">
                    <img
                      src={activePhoto?.url || getProfileDisplayPhotoUrl(p)}
                      alt={p.firstName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#151926] via-[#151926]/20 to-transparent" />

                    {/* Gallery Navigation Arrows */}
                    {photoCount > 1 && (
                      <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <button
                          type="button"
                          onClick={(e) => handlePrevPhoto(p.userId, photoCount, e)}
                          className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white pointer-events-auto shadow-md"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleNextPhoto(p.userId, photoCount, e)}
                          className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white pointer-events-auto shadow-md"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Photo Dots */}
                    {photoCount > 1 && (
                      <div className="absolute top-2 left-0 right-0 flex justify-center gap-1 z-10 px-4">
                        {p.photos?.map((_, idx) => (
                          <span
                            key={idx}
                            className={`h-1 rounded-full transition-all ${
                              idx === currentPhotoIdx ? 'w-5 bg-white' : 'w-2 bg-white/40'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-4 left-3 right-3 flex items-center justify-between z-10">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/80 backdrop-blur-md text-white text-[11px] font-extrabold shadow-md">
                        <HotIcon className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                        <span>{p.compatibilityScore || 92}% Match</span>
                      </div>

                      {activePhoto?.isAiGenerated ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-rose-300 text-[10px] font-semibold border border-rose-500/40 shadow-md">
                          <Sparkles className="w-3 h-3 text-rose-400" />
                          <span>✨ AI Generated</span>
                        </div>
                      ) : p.isOnline ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>Online</span>
                        </div>
                      ) : (
                        <div className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-gray-300 text-[10px] font-medium">
                          Active today
                        </div>
                      )}
                    </div>

                    {/* Dating Intent & Style Pill on Image */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1 z-10">
                      {p.datingIntent && (
                        <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-rose-200 text-xs font-semibold">
                          🔥 {p.datingIntent}
                        </span>
                      )}
                      {activePhoto?.style && (
                        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-gray-300 text-[10px]">
                          {activePhoto.style}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profile Details & Actions */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-lg font-bold text-white">
                            {p.firstName}, {p.age}
                          </h3>
                          {p.isVerified && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold border border-sky-500/30"
                              title="Verified 18+ Adult Profile"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>18+</span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-400" />
                          {p.city}
                        </span>
                      </div>

                      {p.occupation && (
                        <p className="text-xs text-rose-300/80 font-medium truncate mt-0.5">
                          {p.occupation}
                        </p>
                      )}

                      <p className="text-xs text-gray-300 line-clamp-2 mt-2 leading-relaxed">
                        {p.bio}
                      </p>
                    </div>

                    {/* Actions: Pass, Like, Chat, Video Call */}
                    <div className="space-y-2 pt-1 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <button
                          id={`btn-pass-adult-${p.id}`}
                          disabled={actionLoadingId === p.userId}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePass(p);
                          }}
                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          <span>Pass</span>
                        </button>

                        <button
                          id={`btn-like-adult-${p.id}`}
                          disabled={actionLoadingId === p.userId}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(p);
                          }}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
                        >
                          <Heart className="w-4 h-4 fill-white" />
                          <span>Connect / Like</span>
                        </button>
                      </div>

                      {/* Chat & Video Call Fast Access */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleChatClick(p, e)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-all ${
                            isMatched
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                              : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{isMatched ? 'Flirty Chat' : 'Chat'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleVideoCallClick(p, e)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-all ${
                            isMatched
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Video Call</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 5: DATING FLOW NOTIFICATION MODAL */}
      {/* Enforces: Match first -> Chat unlocks -> Video call allowed only after match/authorization */}
      {flowModalNotice && (
        <div
          id="dating-flow-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div className="max-w-md w-full bg-[#151924] border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-rose-400" />
                <span>Match → Hot Chat → Video Call Flow</span>
              </div>
              <button
                type="button"
                onClick={() => setFlowModalNotice(null)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 shrink-0">
                    <img
                      src={getProfileDisplayPhotoUrl(flowModalNotice.profile)}
                      alt={flowModalNotice.profile.firstName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {flowModalNotice.profile.firstName}, {flowModalNotice.profile.age}
                    </h4>
                    <p className="text-xs text-rose-300">
                      {flowModalNotice.type === 'chat'
                        ? 'Private Chat is currently locked'
                        : 'Video Call is currently restricted'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-xs text-gray-300 space-y-1.5 border-t border-white/5">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Step 1: Match First (Mutual Interest)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sky-400 font-semibold">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>Step 2: Hot Flirty Chat Unlocks</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-400 font-semibold">
                    <Video className="w-4 h-4 shrink-0" />
                    <span>Step 3: Video Call Authorized (No Unsolicited Calls)</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                To protect user safety and dignity, unsolicited adult video calls and messages are
                never permitted. Like{' '}
                <strong className="text-white">{flowModalNotice.profile.firstName}</strong> to start
                the connection!
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFlowModalNotice(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors"
              >
                Maybe Later
              </button>
              <button
                type="button"
                onClick={() => handleLike(flowModalNotice.profile)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>Like {flowModalNotice.profile.firstName} Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
