import React from 'react';
import { Sparkles, Compass, Heart, MessageSquare, User, Shield, Flame, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfileDisplayPhotoUrl } from '../utils/photoUtils';

interface NavigationProps {
  unreadMessagesCount?: number;
  inboundLikesCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  unreadMessagesCount = 0,
  inboundLikesCount = 0,
}) => {
  const { user, profile, activeTab, setActiveTab, setActiveChatMatch } = useAuth();

  const handleTabChange = (tab: any) => {
    if (tab !== 'chat') {
      setActiveChatMatch(null);
    }
    setActiveTab(tab);
  };

  const isAdultUser = user?.isAdult !== false && (profile ? profile.age >= 18 : true);

  const mobileNavItems = [
    {
      id: 'discover',
      label: 'Discover',
      icon: Sparkles,
      badge: null,
    },
    ...(isAdultUser
      ? [
          {
            id: 'adult-dating',
            label: '18+ Dating',
            icon: Flame,
            badge: 'HOT',
            badgeColor: 'bg-gradient-to-r from-red-600 to-amber-500',
          },
        ]
      : []),
    {
      id: 'likes',
      label: 'Likes',
      icon: Heart,
      badge: inboundLikesCount > 0 ? inboundLikesCount : null,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'matches',
      label: 'Matches',
      icon: Sparkles,
      badge: null,
    },
    {
      id: 'chat',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
      badgeColor: 'bg-indigo-500',
    },
    {
      id: 'ai-companions',
      label: 'AI Match',
      icon: Bot,
      badge: null,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      avatar: getProfileDisplayPhotoUrl(profile),
    },
  ];

  const desktopNavItems = [
    {
      id: 'discover',
      label: 'Discover',
      icon: Sparkles,
      badge: null,
    },
    ...(isAdultUser
      ? [
          {
            id: 'adult-dating',
            label: '🔥 18+ Dating',
            icon: Flame,
            badge: '18+',
            badgeColor: 'bg-gradient-to-r from-red-600 to-rose-500',
          },
        ]
      : []),
    {
      id: 'explore',
      label: 'Vibes & Search',
      icon: Compass,
      badge: null,
    },
    {
      id: 'likes',
      label: 'Likes',
      icon: Heart,
      badge: inboundLikesCount > 0 ? inboundLikesCount : null,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'matches',
      label: 'Matches',
      icon: Sparkles,
      badge: null,
    },
    {
      id: 'chat',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
      badgeColor: 'bg-indigo-500',
    },
    {
      id: 'ai-companions',
      label: '🤖 AI Companions',
      icon: Bot,
      badge: 'NEW',
      badgeColor: 'bg-purple-600',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      avatar: getProfileDisplayPhotoUrl(profile),
    },
  ];

  if (user?.role === 'admin') {
    desktopNavItems.push({
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      badge: null,
    });
  }

  return (
    <>
      {/* Top Desktop Navigation Header */}
      <header
        id="desktop-header"
        className="hidden md:flex items-center justify-between px-8 py-3.5 bg-[#121620]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-40"
      >
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleTabChange('discover')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-rose-100 to-rose-400 bg-clip-text text-transparent">
              VibeMatch
            </span>
            <span className="hidden lg:inline-block ml-2 text-xs text-rose-300/60 font-medium tracking-wide">
              REAL CONNECTIONS
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-[#1A202E]/60 p-1 rounded-2xl border border-white/5">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-desktop-${item.id}`}
                onClick={() => handleTabChange(item.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-500/15 text-rose-400 font-semibold shadow-inner'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.avatar ? (
                  <img
                    src={item.avatar}
                    alt="Profile"
                    className={`w-5 h-5 rounded-full object-cover border ${
                      isActive ? 'border-rose-400' : 'border-white/10'
                    }`}
                  />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full text-white ${
                      item.badgeColor || 'bg-rose-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {profile?.isVerified && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              Verified Profile
            </div>
          )}
          <span className="text-xs text-gray-400">
            {profile?.firstName ? `Hi, ${profile.firstName}` : user?.email}
          </span>
        </div>
      </header>

      {/* Bottom Mobile Navigation Bar */}
      <nav
        id="mobile-nav-bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F131C]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 pb-safe"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => handleTabChange(item.id)}
                className="relative flex flex-col items-center justify-center p-2 rounded-xl transition-all"
              >
                <div className="relative">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt="Profile"
                      className={`w-6 h-6 rounded-full object-cover border-2 transition-transform ${
                        isActive ? 'border-rose-500 scale-110 ring-2 ring-rose-500/30' : 'border-gray-500'
                      }`}
                    />
                  ) : (
                    <Icon
                      className={`w-6 h-6 transition-transform ${
                        isActive ? 'text-rose-500 scale-110 stroke-[2.5]' : 'text-gray-400'
                      }`}
                    />
                  )}
                  {item.badge && (
                    <span
                      className={`absolute -top-1.5 -right-2 px-1.5 py-0.5 text-[9px] font-bold rounded-full text-white ${
                        item.badgeColor || 'bg-rose-500'
                      } border border-[#0F131C]`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium tracking-tight ${
                    isActive ? 'text-rose-400 font-semibold' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
