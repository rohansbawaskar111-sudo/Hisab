import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  LogOut,
  ShieldCheck,
  Calendar,
  ReceiptText,
  Users,
  Edit2,
  Check,
  Loader2,
  Database,
  CloudCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/formatters';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalTransactionsCount: number;
  totalUdharCount: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  totalTransactionsCount,
  totalUdharCount,
}) => {
  const { currentUser, userProfile, logOut, updateName } = useAuth();
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>(
    userProfile?.displayName || currentUser?.displayName || ''
  );
  const [savingName, setSavingName] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  if (!isOpen || !currentUser) return null;

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      await updateName(displayName.trim());
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update name:', err);
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logOut();
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const memberSince = userProfile?.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Profile & Settings &bull; खाता प्रोफाइल
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* User Card */}
          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full border-2 border-emerald-500 shadow-xs object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-xl font-bold shadow-xs">
                {(userProfile?.displayName || currentUser.email || 'U')
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="px-2.5 py-1 text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 w-full"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingName ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {userProfile?.displayName || currentUser.displayName || 'Hisab User'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                    title="Edit name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 shrink-0" />
                {currentUser.email}
              </p>

              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Encrypted Private Cloud Storage</span>
              </div>
            </div>
          </div>

          {/* Cloud Sync Status */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950">
                Cloud Database Active
              </h4>
              <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                Your data is stored in your private Google Cloud Firestore instance. Only you have access through your authenticated account.
              </p>
            </div>
          </div>

          {/* Account Stats */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Financial Records Stats
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <ReceiptText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Transactions</span>
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {totalTransactionsCount}
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  <span>Udhar Records</span>
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {totalUdharCount}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Preferences
            </h4>
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Currency</span>
              <span className="font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-800">
                Indian Rupee (₹ INR)
              </span>
            </div>
          </div>

          {/* Logout button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              id="btn-logout"
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full py-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span>Log Out &bull; लॉग आउट</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
