import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Send, Sparkles, X } from 'lucide-react';
import { Match, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { getProfileDisplayPhotoUrl } from '../utils/photoUtils';

interface MatchModalProps {
  match: Match;
  currentUserProfile: UserProfile | null;
  onClose: () => void;
  onStartChat: (match: Match) => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  match,
  currentUserProfile,
  onClose,
  onStartChat,
}) => {
  const { setActiveChatMatch, setActiveTab } = useAuth();
  const [firstMessage, setFirstMessage] = useState<string>('Hey! Great to vibe with you ✨');
  const [isSending, setIsSending] = useState<boolean>(false);

  useEffect(() => {
    // Fire celebratory confetti effect
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF4B72', '#FF8E53', '#6366F1', '#EC4899', '#38BDF8'],
      });
    } catch (e) {
      console.warn('Confetti error', e);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!firstMessage.trim()) return;
    setIsSending(true);
    try {
      // Find or use conversation ID
      await api.sendMessage(match.id, firstMessage.trim());
      onClose();
      setActiveChatMatch(match);
      setActiveTab('chat');
    } catch (err) {
      console.error('Failed to send initial message', err);
      // Still navigate to chat
      onClose();
      onStartChat(match);
    } finally {
      setIsSending(false);
    }
  };

  const matchedUser = match.matchedUser;

  return (
    <div
      id="match-celebration-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-[#121622] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl text-center space-y-6">
        {/* Close button */}
        <button
          id="btn-close-match-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mutual Connection</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">
            It's a Vibe Match!
          </h2>
          <p className="text-sm text-gray-300">
            You and <span className="font-semibold text-white">{matchedUser.firstName}</span> liked each other.
          </p>
        </div>

        {/* Matched Avatars */}
        <div className="flex items-center justify-center -space-x-5 py-2">
          <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-rose-500 to-pink-500 shadow-xl shadow-rose-500/20">
            <img
              src={getProfileDisplayPhotoUrl(currentUserProfile)}
              alt="You"
              className="w-full h-full rounded-full object-cover border-2 border-[#121622]"
            />
          </div>

          <div className="z-10 w-10 h-10 rounded-full bg-[#121622] border-2 border-rose-500 flex items-center justify-center shadow-lg">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
          </div>

          <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-pink-500 to-amber-400 shadow-xl shadow-pink-500/20">
            <img
              src={getProfileDisplayPhotoUrl(matchedUser)}
              alt={matchedUser.firstName}
              className="w-full h-full rounded-full object-cover border-2 border-[#121622]"
            />
          </div>
        </div>

        {/* Quick Conversation Starter */}
        <div className="space-y-3">
          <div className="relative">
            <input
              id="input-match-opener"
              type="text"
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              placeholder={`Say something friendly to ${matchedUser.firstName}...`}
              className="w-full px-4 py-3 bg-[#1A202E] rounded-2xl border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500 pr-12"
            />
            <button
              id="btn-send-match-opener"
              onClick={handleSendMessage}
              disabled={isSending || !firstMessage.trim()}
              className="absolute right-2 top-2 p-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Icebreakers */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {[
              'Love your vibe! 👋',
              'Coffee or drinks this weekend? ☕',
              'What music are you listening to right now? 🎶',
            ].map((icebreaker, i) => (
              <button
                key={i}
                onClick={() => setFirstMessage(icebreaker)}
                className="px-2.5 py-1 text-[11px] rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 transition-colors"
              >
                {icebreaker}
              </button>
            ))}
          </div>
        </div>

        {/* Keep Swiping Button */}
        <div className="pt-2">
          <button
            id="btn-keep-swiping"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-sm font-semibold transition-colors"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
};
