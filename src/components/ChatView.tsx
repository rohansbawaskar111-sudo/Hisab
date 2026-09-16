import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  MoreVertical,
  Shield,
  UserX,
  AlertTriangle,
  Check,
  CheckCheck,
  Sparkles,
  Info,
  Video,
  Flame,
  Heart,
  Smile,
  ChevronDown,
} from 'lucide-react';
import { Match, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { VideoCallModal } from './VideoCallModal';
import { getProfileDisplayPhotoUrl } from '../utils/photoUtils';

interface ChatViewProps {
  initialMatch?: Match | null;
  onOpenProfile: (profile: any) => void;
  onReport: (profile: any) => void;
  onUnmatchSuccess: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  initialMatch,
  onOpenProfile,
  onReport,
  onUnmatchSuccess,
}) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(initialMatch || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isInVideoCall, setIsInVideoCall] = useState<boolean>(false);
  const [showRomanticStarters, setShowRomanticStarters] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const FLIRTY_ROMANTIC_STARTERS = [
    {
      category: 'Playful & Flirty',
      icon: '🔥',
      starters: [
        `Are you always this charming, or did you turn it on just for me? 😉`,
        `Rate our chemistry: instant sparks or irresistible slow burn? 🔥`,
        `Truth or dare: what's one guilty pleasure that always puts you in a great mood?`,
        `I was trying to play it cool, but your photos made that impossible.`,
      ],
    },
    {
      category: 'Romantic Date',
      icon: '❤️',
      starters: [
        `If we went on our dream date tonight, where would you want to take me?`,
        `I couldn't help but admire your style—effortlessly captivating.`,
        `Tell me what makes you laugh until your stomach hurts, and I promise to take notes.`,
        `What does your ideal romantic evening together look like?`,
      ],
    },
    {
      category: 'Night Out & Cocktails',
      icon: '🍸',
      starters: [
        `Rooftop cocktails under the stars or a cozy candlelit wine lounge?`,
        `What song is guaranteed to get you dancing on a Friday night?`,
        `What's the best drink to toast to meeting someone intriguing?`,
        `Late night drives with a great playlist or a midnight dessert run?`,
      ],
    },
  ];

  // Load matches
  const loadMatches = async () => {
    try {
      const data = await api.getMatches();
      setMatches(data);
      if (!selectedMatch && data.length > 0 && !initialMatch) {
        setSelectedMatch(data[0]);
      }
    } catch (e) {
      console.error('Failed to load matches', e);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    if (initialMatch) {
      setSelectedMatch(initialMatch);
    }
  }, [initialMatch]);

  // Load conversation messages when match is selected
  useEffect(() => {
    if (!selectedMatch) return;

    let isMounted = true;
    setIsLoadingMessages(true);

    api
      .getMessages(selectedMatch.id)
      .then((msgs) => {
        if (isMounted) {
          setMessages(msgs);
          setIsLoadingMessages(false);
          // Mark as read
          api.markConversationRead(selectedMatch.id).catch(() => {});
        }
      })
      .catch((err) => {
        console.error('Failed to load messages', err);
        if (isMounted) setIsLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMatch?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerIsTyping]);

  // Setup WebSocket connection for real-time messaging
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'authenticate', userId: user.id }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message_received') {
          const newMsg: Message = data.message;
          if (selectedMatch && newMsg.conversationId === selectedMatch.id) {
            setMessages((prev) => [...prev, newMsg]);
            api.markConversationRead(selectedMatch.id).catch(() => {});
          }
          // Refresh matches list to update last message preview
          loadMatches();
        } else if (data.type === 'user_typing') {
          if (selectedMatch && data.conversationId === selectedMatch.id) {
            setPartnerIsTyping(data.isTyping);
          }
        }
      } catch (e) {
        console.error('WS Parse error', e);
      }
    };

    return () => {
      ws.close();
    };
  }, [user?.id, selectedMatch?.id]);

  // Handle send message
  const handleSendMessage = async (textToSend?: string, imageUrl?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText.trim();
    if (!text && !imageUrl) return;
    if (!selectedMatch) return;

    setInputText('');

    try {
      const message = await api.sendMessage(selectedMatch.id, text, imageUrl);
      setMessages((prev) => [...prev, message]);

      // Broadcast over WS
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const partnerId =
          selectedMatch.user1Id === user?.id ? selectedMatch.user2Id : selectedMatch.user1Id;
        wsRef.current.send(
          JSON.stringify({
            type: 'new_message',
            recipientId: partnerId,
            message,
          })
        );
      }

      loadMatches();
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!selectedMatch || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    if (!isTyping) {
      setIsTyping(true);
      const partnerId =
        selectedMatch.user1Id === user?.id ? selectedMatch.user2Id : selectedMatch.user1Id;
      wsRef.current.send(
        JSON.stringify({
          type: 'typing',
          conversationId: selectedMatch.id,
          recipientId: partnerId,
          isTyping: true,
        })
      );

      setTimeout(() => {
        setIsTyping(false);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'typing',
              conversationId: selectedMatch.id,
              recipientId: partnerId,
              isTyping: false,
            })
          );
        }
      }, 2000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${api.getToken()}`,
          },
          body: JSON.stringify({ base64Data }),
        });
        const data = await res.json();
        if (data.url) {
          handleSendMessage('', data.url);
        }
      } catch (err) {
        console.error('Image upload failed', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUnmatch = async () => {
    if (!selectedMatch) return;
    if (!window.confirm(`Are you sure you want to unmatch with ${selectedMatch.matchedUser.firstName}? You won't be able to message each other again.`)) {
      return;
    }

    try {
      await api.unmatch(selectedMatch.id);
      setSelectedMatch(null);
      loadMatches();
      onUnmatchSuccess();
    } catch (e: any) {
      alert(e.message || 'Failed to unmatch');
    }
  };

  return (
    <div className="w-full h-[calc(100vh-65px)] md:h-[calc(100vh-70px)] flex flex-col md:flex-row bg-[#0B0E14] text-white">
      {/* Sidebar: Matches & Conversations List */}
      <div
        id="chat-matches-sidebar"
        className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-white/5 flex flex-col bg-[#10141E] ${
          selectedMatch ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-white/5">
          <h2 className="text-xl font-bold tracking-tight">Messages & Matches</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {matches.length} {matches.length === 1 ? 'connection' : 'connections'}
          </p>
        </div>

        {/* Matches Horizontal Ribbon */}
        {matches.length > 0 && (
          <div className="p-4 border-b border-white/5 space-y-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              New Connections
            </span>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatch(m)}
                  className="flex flex-col items-center flex-shrink-0 group"
                >
                  <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-rose-500 to-amber-400 group-hover:scale-105 transition-transform">
                    <img
                      src={getProfileDisplayPhotoUrl(m.matchedUser)}
                      alt={m.matchedUser.firstName}
                      className="w-full h-full rounded-full object-cover border-2 border-[#10141E]"
                      referrerPolicy="no-referrer"
                    />
                    {m.matchedUser.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#10141E]" />
                    )}
                  </div>
                  <span className="text-xs text-gray-200 mt-1 font-medium truncate max-w-[60px]">
                    {m.matchedUser.firstName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {matches.length === 0 ? (
            <div className="p-8 text-center text-gray-400 space-y-2">
              <Sparkles className="w-8 h-8 text-rose-400 mx-auto opacity-70" />
              <p className="text-sm font-medium">No matches yet</p>
              <p className="text-xs text-gray-500">
                Keep exploring in Discover to meet new people and start vibing!
              </p>
            </div>
          ) : (
            matches.map((m) => {
              const isSelected = selectedMatch?.id === m.id;
              return (
                <div
                  key={m.id}
                  id={`conversation-item-${m.id}`}
                  onClick={() => setSelectedMatch(m)}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors ${
                    isSelected ? 'bg-rose-500/10 border-l-4 border-rose-500' : ''
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-full flex-shrink-0">
                    <img
                      src={getProfileDisplayPhotoUrl(m.matchedUser)}
                      alt={m.matchedUser.firstName}
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {m.matchedUser.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#10141E]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {m.matchedUser.firstName}
                      </h4>
                      {m.lastMessage && (
                        <span className="text-[10px] text-gray-400">
                          {new Date(m.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {m.lastMessage
                        ? m.lastMessage.text || 'Sent an image'
                        : `Matched with ${m.matchedUser.firstName}`}
                    </p>
                  </div>

                  {m.unreadCount ? (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {m.unreadCount}
                    </span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Pane */}
      {selectedMatch ? (
        <div
          id="chat-main-pane"
          className="flex-1 flex flex-col h-full bg-[#0E121A] relative"
        >
          {/* Active Chat Header */}
          <div className="p-3.5 px-4 bg-[#121622] border-b border-white/10 flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <button
                id="btn-back-to-conversations"
                onClick={() => setSelectedMatch(null)}
                className="md:hidden p-1.5 rounded-full text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => onOpenProfile(selectedMatch.matchedUser)}
              >
                <div className="relative w-10 h-10 rounded-full">
                  <img
                    src={getProfileDisplayPhotoUrl(selectedMatch.matchedUser)}
                    alt={selectedMatch.matchedUser.firstName}
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {selectedMatch.matchedUser.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#121622]" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-white text-sm">
                      {selectedMatch.matchedUser.firstName}, {selectedMatch.matchedUser.age}
                    </h3>
                    {selectedMatch.matchedUser.isVerified && (
                      <span className="text-sky-400 text-xs">✓</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {partnerIsTyping
                      ? 'typing...'
                      : selectedMatch.matchedUser.isOnline
                      ? 'Active now'
                      : selectedMatch.matchedUser.city}
                  </p>
                </div>
              </div>
            </div>

            {/* Top Action Options */}
            <div className="flex items-center gap-1">
              <button
                id="btn-start-video-call"
                onClick={() => setIsInVideoCall(true)}
                className="p-2 rounded-full text-rose-400 hover:text-white hover:bg-rose-500/20 transition-colors"
                title="Start Video Call"
              >
                <Video className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  id="btn-chat-options-menu"
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

              {showMenu && (
                <div className="absolute right-0 top-10 w-48 bg-[#1B2130] border border-white/10 rounded-2xl shadow-2xl py-1 z-50 text-xs text-gray-200">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenProfile(selectedMatch.matchedUser);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 text-left"
                  >
                    <Info className="w-4 h-4 text-sky-400" />
                    <span>View Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onReport(selectedMatch.matchedUser);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 text-rose-400 text-left"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Report User</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleUnmatch();
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 text-gray-400 text-left border-t border-white/5"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Unmatch</span>
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 md:pb-6">
            {/* Icebreaker Match Banner */}
            <div className="text-center py-4 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[11px] text-gray-400 border border-white/5">
                <Sparkles className="w-3 h-3 text-rose-400" />
                <span>You matched with {selectedMatch.matchedUser.firstName}! Say hello.</span>
              </div>
            </div>

            {isLoadingMessages ? (
              <div className="text-center py-6 text-xs text-gray-400">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center space-y-3 max-w-xs mx-auto">
                <p className="text-xs text-gray-300">Break the ice with a conversation starter:</p>
                <div className="space-y-1.5">
                  {[
                    `Hi ${selectedMatch.matchedUser.firstName}! What's your favorite weekend activity?`,
                    'Coffee or boba tea?',
                    `Loved your profile photos! How was your week?`,
                  ].map((ice, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(ice)}
                      className="w-full p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-xs text-left text-gray-200 hover:text-white transition-colors border border-white/5"
                    >
                      {ice}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[78%] sm:max-w-md rounded-2xl p-3 text-sm break-words leading-relaxed ${
                        isMine
                          ? 'bg-rose-600 text-white rounded-br-xs'
                          : 'bg-[#1C2333] text-gray-100 rounded-bl-xs border border-white/5'
                      }`}
                    >
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Attached media"
                          className="rounded-xl mb-2 max-h-60 object-cover w-full"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      {msg.text && <p>{msg.text}</p>}

                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                          isMine ? 'text-rose-200' : 'text-gray-400'
                        }`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMine && (
                          msg.isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-rose-200" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {partnerIsTyping && (
              <div className="flex items-center gap-2 text-xs text-gray-400 pl-2">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.4s]" />
                <span>{selectedMatch.matchedUser.firstName} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Romantic & Flirty Starters Bar & Drawer */}
          <div className="border-t border-white/10 bg-[#141926]">
            <div className="px-3 py-1.5 flex items-center justify-between">
              <button
                id="btn-toggle-flirty-starters"
                type="button"
                onClick={() => setShowRomanticStarters(!showRomanticStarters)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-rose-500/20 via-purple-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-all cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                <span>✨ Flirty & Romantic Starters</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    showRomanticStarters ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <span className="text-[10px] text-gray-500">Tap starter to insert</span>
            </div>

            {showRomanticStarters && (
              <div className="p-3 bg-[#111520] border-t border-white/5 space-y-3 max-h-56 overflow-y-auto">
                {FLIRTY_ROMANTIC_STARTERS.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-300">
                      <span>{cat.icon}</span>
                      <span>{cat.category}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {cat.starters.map((starter, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            setInputText(starter);
                            setShowRomanticStarters(false);
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-left text-xs text-gray-200 hover:text-white border border-white/5 transition-colors"
                        >
                          "{starter}"
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-[#121622] border-t border-white/5 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              id="btn-attach-image"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Send image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex-1 flex items-center gap-2"
            >
              <input
                id="input-chat-message"
                type="text"
                value={inputText}
                onChange={handleTyping}
                placeholder={`Message ${selectedMatch.matchedUser.firstName}...`}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-[#1A202E] border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
              />
              <button
                id="btn-submit-chat-message"
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white transition-all shadow-md shadow-rose-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center p-8 text-center text-gray-400 flex-col space-y-3">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-rose-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Select a conversation</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            Choose a match from the left to view messages and share good vibes.
          </p>
        </div>
      )}

      {isInVideoCall && selectedMatch && (
        <VideoCallModal
          partner={selectedMatch.matchedUser}
          conversationId={selectedMatch.id}
          onClose={() => setIsInVideoCall(false)}
          onCallLogged={(logText) => {
            api
              .sendMessage(selectedMatch.id, `📹 ${logText}`)
              .then((newMsg) => {
                setMessages((prev) => [...prev, newMsg]);
              })
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
};
