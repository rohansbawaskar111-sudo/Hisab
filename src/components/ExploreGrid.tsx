import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Compass, Search, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../api/client';
import { getProfileDisplayPhotoUrl } from '../utils/photoUtils';

interface ExploreGridProps {
  onOpenProfile: (profile: UserProfile) => void;
  onLikeProfile: (profile: UserProfile) => void;
}

const VIBE_CATEGORIES = [
  { id: 'all', label: 'All Vibes', icon: '✨' },
  { id: 'coffee', label: 'Coffee Lovers', icon: '☕', interest: 'Specialty Coffee' },
  { id: 'creative', label: 'Creative Souls', icon: '🎨', interest: 'Film Photography' },
  { id: 'outdoors', label: 'Outdoor Adventurers', icon: '🏔️', interest: 'Hiking & Camping' },
  { id: 'music', label: 'Music Enthusiasts', icon: '🎧', interest: 'Indie Music' },
  { id: 'foodie', label: 'Food & Cooking', icon: '🍷', interest: 'Sourdough & Cooking' },
  { id: 'wellness', label: 'Mind & Body', icon: '🧘', interest: 'Yoga & Pilates' },
  { id: 'pets', label: 'Animal Lovers', icon: '🐾', interest: 'Dog Lover' },
];

export const ExploreGrid: React.FC<ExploreGridProps> = ({
  onOpenProfile,
  onLikeProfile,
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const handler = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsLoading(true);
        try {
          const results = await api.searchUsers(searchQuery.trim());
          if (isMounted) {
            setProfiles(results);
          }
        } catch (e) {
          console.error('Search error:', e);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else if (searchQuery.trim().length === 0) {
        setIsLoading(true);
        api
          .getDiscoverFeed()
          .then((data) => {
            if (isMounted) setProfiles(data);
          })
          .catch((e) => console.error(e))
          .finally(() => {
            if (isMounted) setIsLoading(false);
          });
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const filteredProfiles = profiles.filter((p) => {
    // Search query filter
    const matchesSearch =
      searchQuery === '' ||
      p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.interests?.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Vibe category filter
    if (activeCategory === 'all') return true;
    const cat = VIBE_CATEGORIES.find((c) => c.id === activeCategory);
    if (!cat || !cat.interest) return true;

    return p.interests?.some((i) => i.name.toLowerCase() === cat.interest!.toLowerCase());
  });

  return (
    <div id="explore-grid-container" className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 text-white pb-24">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold">
          <Compass className="w-3.5 h-3.5" />
          <span>Vibe Discovery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Explore by Shared Vibes
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Find people who match your frequency, hobbies, and favorite weekend activities.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
        <input
          id="input-explore-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by city, hobby, music, or name..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141926] border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
        />
      </div>

      {/* Category Pills Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {VIBE_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25'
                  : 'bg-[#141926] text-gray-400 hover:text-white border border-white/5 hover:bg-white/5'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Profiles Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Loading curated profiles...
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-[#141926] rounded-3xl border border-white/5 space-y-2">
          <p className="text-base font-semibold text-white">No profiles found for this vibe</p>
          <p className="text-xs">Try selecting a different vibe category or clear your search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProfiles.map((p) => (
            <div
              key={p.id}
              id={`explore-card-${p.id}`}
              onClick={() => onOpenProfile(p)}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#141926] border border-white/10 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <img
                src={getProfileDisplayPhotoUrl(p)}
                alt={p.firstName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />

              {/* Ambient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/30 to-transparent pointer-events-none" />

              {/* Top Compatibility or Verified Badge */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                {p.compatibilityScore !== undefined ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/80 backdrop-blur-md text-white text-[10px] font-bold">
                    {p.compatibilityScore}% Match
                  </span>
                ) : <div />}
                {p.isVerified && (
                  <span className="p-1 rounded-full bg-sky-500/80 text-white" title="Verified Member">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Card Bottom Meta */}
              <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm truncate">
                    {p.firstName}, {p.age}
                  </h3>
                  <button
                    id={`btn-explore-like-${p.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLikeProfile(p);
                    }}
                    className="w-8 h-8 rounded-full bg-rose-500/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all"
                    title="Like"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                  </button>
                </div>

                <p className="text-[11px] text-gray-300 truncate">{p.city}</p>

                {p.interests && p.interests.length > 0 && (
                  <div className="flex gap-1 overflow-hidden pt-0.5">
                    {p.interests.slice(0, 2).map((i) => (
                      <span
                        key={i.id}
                        className="px-1.5 py-0.2 rounded-md bg-black/50 text-[9px] text-gray-200 truncate"
                      >
                        {i.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
