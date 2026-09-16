import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Sliders, Shield, RotateCcw, Heart, ChevronRight } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { Navigation } from './components/Navigation';
import { DiscoveryCard } from './components/DiscoveryCard';
import { ProfileDetailModal } from './components/ProfileDetailModal';
import { MatchModal } from './components/MatchModal';
import { SafetyModal } from './components/SafetyModal';
import { FilterModal } from './components/FilterModal';
import { ChatView } from './components/ChatView';
import { ExploreGrid } from './components/ExploreGrid';
import { LikesYouView } from './components/LikesYouView';
import { MatchesView } from './components/MatchesView';
import { UserProfileSettings } from './components/UserProfileSettings';
import { AdminDashboard } from './components/AdminDashboard';
import { AdultDatingView } from './components/AdultDatingView';
import { AICompanionsView } from './components/AICompanionsView';
import { UserProfile, Match, DiscoveryFilters } from './types';
import { api } from './api/client';

const MainApp: React.FC = () => {
  const { user, profile, activeTab, setActiveTab, activeChatMatch, setActiveChatMatch } = useAuth();

  // Discovery Deck State
  const [deck, setDeck] = useState<UserProfile[]>([]);
  const [isLoadingDeck, setIsLoadingDeck] = useState<boolean>(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);

  // Modals state
  const [inspectedProfile, setInspectedProfile] = useState<UserProfile | null>(null);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [safetyModalConfig, setSafetyModalConfig] = useState<{
    isOpen: boolean;
    tab?: 'safety_tips' | 'report' | 'block' | 'verify';
    targetUser?: UserProfile | null;
  }>({ isOpen: false });

  // Discovery filters
  const [filters, setFilters] = useState<DiscoveryFilters>({
    minAge: 18,
    maxAge: 45,
    maxDistanceKm: 60,
    gender: 'everyone',
    verifiedOnly: false,
  });

  // Badge counts
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [inboundLikesCount, setInboundLikesCount] = useState<number>(0);

  // Load discovery feed
  const loadDiscoveryFeed = useCallback(async (customFilters?: DiscoveryFilters) => {
    setIsLoadingDeck(true);
    try {
      const feed = await api.getDiscoverFeed(customFilters || filters);
      setDeck(feed);
    } catch (e) {
      console.error('Failed to load discovery feed', e);
    } finally {
      setIsLoadingDeck(false);
    }
  }, [filters]);

  // Load badge counts
  const loadBadges = useCallback(async () => {
    if (!user) return;
    try {
      const [matches, likes] = await Promise.all([
        api.getMatches(),
        api.getInboundLikes(),
      ]);
      const unreadTotal = matches.reduce((acc, m) => acc + (m.unreadCount || 0), 0);
      setUnreadMessages(unreadTotal);
      setInboundLikesCount(likes.length);
    } catch (e) {
      // silent badge fail
    }
  }, [user]);

  useEffect(() => {
    loadDiscoveryFeed();
    loadBadges();
    const timer = setInterval(loadBadges, 15000); // 15-second background polling
    return () => clearInterval(timer);
  }, [loadDiscoveryFeed, loadBadges]);

  // Swipe Action Handlers
  const currentCard = deck.length > 0 ? deck[0] : null;

  const handleLike = async (target: UserProfile) => {
    setSwipeDirection('right');
    try {
      const res = await api.like(target.userId || target.id);
      setTimeout(() => {
        setDeck((prev) => prev.slice(1));
        setSwipeDirection(null);
        if (res.isMatch && res.match) {
          setActiveMatch(res.match);
        }
      }, 250);
      loadBadges();
    } catch (err) {
      console.error(err);
      setSwipeDirection(null);
    }
  };

  const handleSuperLike = async (target: UserProfile) => {
    setSwipeDirection('up');
    try {
      const res = await api.superLike(target.userId || target.id);
      setTimeout(() => {
        setDeck((prev) => prev.slice(1));
        setSwipeDirection(null);
        if (res.isMatch && res.match) {
          setActiveMatch(res.match);
        }
      }, 250);
      loadBadges();
    } catch (err) {
      console.error(err);
      setSwipeDirection(null);
    }
  };

  const handlePass = async (target: UserProfile) => {
    setSwipeDirection('left');
    try {
      await api.pass(target.userId || target.id);
      setTimeout(() => {
        setDeck((prev) => prev.slice(1));
        setSwipeDirection(null);
      }, 250);
    } catch (err) {
      console.error(err);
      setSwipeDirection(null);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'discover' || !currentCard || inspectedProfile || showFilters || safetyModalConfig.isOpen) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePass(currentCard);
      } else if (e.key === 'ArrowRight') {
        handleLike(currentCard);
      } else if (e.key === 'ArrowUp') {
        handleSuperLike(currentCard);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, activeTab, inspectedProfile, showFilters, safetyModalConfig.isOpen]);

  return (
    <div className="min-h-screen w-full bg-[#0B0E14] text-white flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Navigation Header & Mobile Bottom Bar */}
      <Navigation
        unreadMessagesCount={unreadMessages}
        inboundLikesCount={inboundLikesCount}
      />

      {/* Main Screen Content */}
      <main className="flex-1 flex flex-col">
        {/* TAB 1: DISCOVER (Swipe Deck) */}
        {activeTab === 'discover' && (
          <div
            id="screen-discover"
            className="flex-1 flex flex-col items-center justify-between p-4 max-w-lg mx-auto w-full pb-24 md:pb-8"
          >
            {/* Top Toolbar in Discover */}
            <div className="w-full flex items-center justify-between py-2">
              <button
                id="btn-safety-tips"
                onClick={() =>
                  setSafetyModalConfig({ isOpen: true, tab: 'safety_tips' })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141926] hover:bg-[#1C2333] border border-white/5 text-gray-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Safety Toolkit</span>
              </button>

              <button
                id="btn-open-filters"
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141926] hover:bg-[#1C2333] border border-white/5 text-gray-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                <span>Filters</span>
              </button>
            </div>

            {/* Deck Center Stage */}
            <div className="flex-1 w-full flex items-center justify-center relative my-auto">
              {isLoadingDeck ? (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs text-gray-400">Tuning into nearby vibes...</p>
                </div>
              ) : currentCard ? (
                <div className="relative w-full max-w-sm flex items-center justify-center">
                  {/* Visual card stack behind */}
                  {deck[1] && (
                    <div className="absolute inset-0 scale-95 translate-y-3 opacity-40 blur-[1px] pointer-events-none rounded-3xl bg-[#141926] border border-white/5 overflow-hidden">
                      <img
                        src={deck[1].photos?.[0]?.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Active Interactive Top Card */}
                  <DiscoveryCard
                    profile={currentCard}
                    swipeDirection={swipeDirection}
                    onLike={handleLike}
                    onPass={handlePass}
                    onSuperLike={handleSuperLike}
                    onOpenDetails={(p) => setInspectedProfile(p)}
                  />
                </div>
              ) : (
                /* Deck Exhausted Empty State */
                <div className="text-center p-8 rounded-3xl bg-[#141926] border border-white/5 max-w-sm space-y-4 shadow-2xl">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mx-auto">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">You're All Caught Up!</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      There are no more new profiles matching your current filters right now.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      id="btn-refresh-deck"
                      onClick={() => loadDiscoveryFeed()}
                      className="w-full py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-rose-500/20"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Check Again</span>
                    </button>
                    <button
                      onClick={() => setShowFilters(true)}
                      className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-colors"
                    >
                      Broaden Filters (Age/Distance)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Micro Helper Note */}
            <div className="hidden sm:flex items-center gap-4 text-[10px] text-gray-500 pt-3">
              <span>← Arrow: Pass</span>
              <span>↑ Arrow: Super Like</span>
              <span>→ Arrow: Like</span>
            </div>
          </div>
        )}

        {/* TAB 2: 18+ ADULT DATING MODE */}
        {activeTab === 'adult-dating' && (
          <AdultDatingView
            onOpenProfile={(p) => setInspectedProfile(p)}
            onLike={handleLike}
            onPass={handlePass}
            onStartChat={async (p) => {
              try {
                const matches = await api.getMatches();
                const m = matches.find(
                  (item) => item.matchedUser.userId === p.userId || item.matchedUser.id === p.userId
                );
                if (m) {
                  setActiveChatMatch(m);
                  setActiveTab('chat');
                } else {
                  setInspectedProfile(p);
                }
              } catch {
                setInspectedProfile(p);
              }
            }}
            onStartVideoCall={async (p) => {
              try {
                const matches = await api.getMatches();
                const m = matches.find(
                  (item) => item.matchedUser.userId === p.userId || item.matchedUser.id === p.userId
                );
                if (m) {
                  setActiveChatMatch(m);
                  setActiveTab('chat');
                } else {
                  setInspectedProfile(p);
                }
              } catch {
                setInspectedProfile(p);
              }
            }}
          />
        )}

        {/* TAB 3: EXPLORE VIBES & SEARCH */}
        {activeTab === 'explore' && (
          <ExploreGrid
            onOpenProfile={(p) => setInspectedProfile(p)}
            onLikeProfile={handleLike}
          />
        )}

        {/* TAB 4: LIKES YOU */}
        {activeTab === 'likes' && (
          <LikesYouView
            onOpenProfile={(p) => setInspectedProfile(p)}
            onLikeBack={handleLike}
            onPass={handlePass}
          />
        )}

        {/* TAB 5: MATCHES */}
        {activeTab === 'matches' && (
          <MatchesView
            onOpenProfile={(p) => setInspectedProfile(p)}
            onStartChat={(m) => {
              setActiveChatMatch(m);
              setActiveTab('chat');
            }}
          />
        )}

        {/* TAB 6: CHAT & MESSAGES */}
        {activeTab === 'chat' && (
          <ChatView
            initialMatch={activeChatMatch}
            onOpenProfile={(p) => setInspectedProfile(p)}
            onReport={(p) =>
              setSafetyModalConfig({
                isOpen: true,
                tab: 'report',
                targetUser: p,
              })
            }
            onUnmatchSuccess={() => {
              setActiveChatMatch(null);
              loadBadges();
            }}
          />
        )}

        {/* TAB 7: AI COMPANIONS */}
        {activeTab === 'ai-companions' && <AICompanionsView />}

        {/* TAB 8: USER PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <UserProfileSettings
            onOpenVerification={() =>
              setSafetyModalConfig({ isOpen: true, tab: 'verify' })
            }
          />
        )}

        {/* TAB 6: ADMIN DASHBOARD */}
        {activeTab === 'admin' && user?.role === 'admin' && <AdminDashboard />}
      </main>

      {/* MODALS */}
      {/* 1. Full Profile Detail Modal */}
      {inspectedProfile && (
        <ProfileDetailModal
          profile={inspectedProfile}
          onClose={() => setInspectedProfile(null)}
          onLike={handleLike}
          onPass={handlePass}
          onSuperLike={handleSuperLike}
          onReport={(p) => {
            setInspectedProfile(null);
            setSafetyModalConfig({
              isOpen: true,
              tab: 'report',
              targetUser: p,
            });
          }}
          onBlock={(p) => {
            setInspectedProfile(null);
            setSafetyModalConfig({
              isOpen: true,
              tab: 'block',
              targetUser: p,
            });
          }}
        />
      )}

      {/* 2. Match Celebration Modal */}
      {activeMatch && (
        <MatchModal
          match={activeMatch}
          currentUserProfile={profile}
          onClose={() => setActiveMatch(null)}
          onStartChat={(m) => {
            setActiveMatch(null);
            setActiveChatMatch(m);
            setActiveTab('chat');
          }}
        />
      )}

      {/* 3. Safety & Moderation Modal */}
      {safetyModalConfig.isOpen && (
        <SafetyModal
          initialTab={safetyModalConfig.tab}
          targetUser={safetyModalConfig.targetUser}
          onClose={() => setSafetyModalConfig({ isOpen: false })}
          onBlockSuccess={() => {
            loadDiscoveryFeed();
            loadBadges();
          }}
        />
      )}

      {/* 4. Filters Modal */}
      {showFilters && (
        <FilterModal
          initialFilters={filters}
          onClose={() => setShowFilters(false)}
          onApply={(newFilters) => {
            setFilters(newFilters);
            setShowFilters(false);
            loadDiscoveryFeed(newFilters);
          }}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0B0E14] flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        <p className="text-xs text-gray-400">Loading VibeMatch...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <MainApp />;
};

export default App;
