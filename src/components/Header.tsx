import React from 'react';
import { RotateCcw, Wallet, Users, LogIn, User, Cloud } from 'lucide-react';
import { ActiveTab } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingUdharCount: number;
  onResetData: () => void;
  hasTransactions: boolean;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  pendingUdharCount,
  onResetData,
  onOpenAuth,
  onOpenProfile,
}) => {
  const { currentUser, userProfile } = useAuth();
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-xl mx-auto px-4 pt-3 pb-2.5">
        {/* Top brand row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-100">
              <span className="font-extrabold text-base leading-none tracking-tight">₹</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">Hisab</h1>
                <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  हिसाब
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <span>Finance &amp; Khaata</span>
                {currentUser && (
                  <span className="inline-flex items-center text-[10px] text-emerald-600 font-semibold gap-0.5">
                    &bull; <Cloud className="w-2.5 h-2.5" /> Cloud
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 hidden sm:inline-block bg-slate-100 px-2.5 py-1 rounded-full">
              {todayFormatted}
            </span>

            {/* Auth / Profile trigger */}
            {currentUser ? (
              <button
                id="btn-profile-header"
                type="button"
                onClick={onOpenProfile}
                title="Account Settings"
                className="flex items-center gap-1.5 p-1 pl-1.5 pr-2.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User"
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover border border-emerald-500"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    {(userProfile?.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-700 max-w-[80px] sm:max-w-[100px] truncate">
                  {userProfile?.displayName?.split(' ')[0] || 'Account'}
                </span>
              </button>
            ) : (
              <button
                id="btn-login-header"
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}

            <button
              id="btn-reset-sample"
              onClick={onResetData}
              title="Reset data"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Reset transactions and udhar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switcher: Hisab vs Udhar */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
          <button
            id="tab-btn-hisab"
            type="button"
            onClick={() => onTabChange('hisab')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hisab'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hisab &bull; खर्च / आय</span>
          </button>

          <button
            id="tab-btn-udhar"
            type="button"
            onClick={() => onTabChange('udhar')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === 'udhar'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>Udhar &bull; उधार खाता</span>
            {pendingUdharCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-white leading-tight">
                {pendingUdharCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

