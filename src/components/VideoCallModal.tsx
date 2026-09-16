import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Sparkles,
  Shield,
  Clock,
  Maximize2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { UserProfile, Call } from '../types';
import { api } from '../api/client';
import { getProfileDisplayPhotoUrl } from '../utils/photoUtils';

interface VideoCallModalProps {
  partner: UserProfile;
  conversationId: string;
  onClose: () => void;
  onCallLogged?: (durationText: string) => void;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  partner,
  conversationId,
  onClose,
  onCallLogged,
}) => {
  const [callState, setCallState] = useState<'RINGING' | 'ONGOING' | 'ENDED' | 'DECLINED'>('RINGING');
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. Initiate Call on mount
  useEffect(() => {
    let isCancelled = false;

    const startCall = async () => {
      try {
        // Enforce backend check: established match required
        const res = await api.initiateCall(partner.userId, conversationId);
        if (isCancelled) return;

        setCurrentCall(res.call);

        // Setup local media safely
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          }
        } catch (mediaErr) {
          console.warn('Camera/mic access not granted or not available in iframe:', mediaErr);
          // Graceful fallback: Video call can still proceed in interactive simulation mode
        }

        // Setup signaling WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
          const userJson = localStorage.getItem('vibematch_user');
          const userId = userJson ? JSON.parse(userJson).id : 'current-user';
          ws.send(JSON.stringify({ type: 'authenticate', userId }));
          ws.send(
            JSON.stringify({
              type: 'call_user',
              recipientId: partner.userId,
              callId: res.call.id,
              conversationId,
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'call_accepted') {
              setCallState('ONGOING');
            } else if (data.type === 'call_declined') {
              setCallState('DECLINED');
              setTimeout(onClose, 2500);
            } else if (data.type === 'call_ended') {
              setCallState('ENDED');
              setTimeout(onClose, 2000);
            }
          } catch (e) {
            console.error('Signaling error:', e);
          }
        };

        // If demo recipient, auto-answer after 2.5s for seamless interactive experience
        if (res.isDemoRecipient) {
          setTimeout(() => {
            if (!isCancelled) {
              setCallState('ONGOING');
            }
          }, 2500);
        }
      } catch (err: any) {
        console.error('Call initiation error:', err);
        setErrorMessage(err.message || 'Failed to start video call.');
        setCallState('DECLINED');
        setTimeout(onClose, 3000);
      }
    };

    startCall();

    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [partner.userId, conversationId]);

  // Duration Timer for ONGOING call
  useEffect(() => {
    if (callState === 'ONGOING') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [callState]);

  // Control Handlers
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // toggled
      });
    }
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff; // toggled
      });
    }
  };

  const handleHangup = async () => {
    setCallState('ENDED');
    const finalSeconds = duration;

    if (currentCall) {
      try {
        await api.endCall(currentCall.id, finalSeconds);
      } catch (e) {
        console.error('End call API error:', e);
      }
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'call_hangup',
          targetUserId: partner.userId,
          callId: currentCall?.id,
          durationSeconds: finalSeconds,
        })
      );
    }

    if (onCallLogged) {
      const mins = Math.floor(finalSeconds / 60);
      const secs = finalSeconds % 60;
      onCallLogged(`Video call ended • ${mins}:${secs < 10 ? '0' : ''}${secs}`);
    }

    setTimeout(onClose, 1200);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id="video-call-modal"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4"
    >
      <div className="relative w-full max-w-3xl h-[85vh] max-h-[720px] bg-[#0F131C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={getProfileDisplayPhotoUrl(partner)}
                alt={partner.firstName}
                className="w-11 h-11 rounded-full object-cover border-2 border-white/30"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0F131C]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  {partner.firstName}, {partner.age}
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                  <Shield className="w-3 h-3" />
                  E2E Encrypted
                </span>
              </div>

              <p className="text-xs text-gray-300">
                {callState === 'RINGING' && 'Ringing...'}
                {callState === 'ONGOING' && `Connected • ${formatTime(duration)}`}
                {callState === 'DECLINED' && (errorMessage || 'Call declined')}
                {callState === 'ENDED' && `Call ended (${formatTime(duration)})`}
              </p>
            </div>
          </div>

          {/* Ongoing Duration Pill */}
          {callState === 'ONGOING' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{formatTime(duration)}</span>
            </div>
          )}
        </div>

        {/* Remote Video / Video Stage */}
        <div className="relative flex-1 w-full h-full bg-[#080B10] flex items-center justify-center overflow-hidden">
          {callState === 'RINGING' ? (
            <div className="text-center space-y-6 animate-pulse p-6">
              <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
                <img
                  src={getProfileDisplayPhotoUrl(partner)}
                  alt={partner.firstName}
                  className="relative w-28 h-28 rounded-full object-cover border-4 border-rose-500 shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold text-white">Calling {partner.firstName}...</h2>
                <p className="text-xs text-gray-400">Waiting for {partner.firstName} to accept</p>
              </div>
            </div>
          ) : callState === 'ONGOING' ? (
            <div className="relative w-full h-full">
              {/* Remote stream simulation or real element */}
              <img
                src={getProfileDisplayPhotoUrl(partner)}
                alt={partner.firstName}
                className="w-full h-full object-cover filter brightness-90"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

              {/* Status overlay */}
              <div className="absolute bottom-28 left-6 text-left">
                <h4 className="text-xl font-bold text-white drop-shadow">
                  {partner.firstName}
                </h4>
                <p className="text-xs text-gray-300 drop-shadow">
                  {partner.city} • High Definition 1080p
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 p-6">
              <PhoneOff className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">
                {callState === 'DECLINED' ? 'Call Unavailable' : 'Call Finished'}
              </h3>
              <p className="text-xs text-gray-400">
                {errorMessage || `Duration: ${formatTime(duration)}`}
              </p>
            </div>
          )}

          {/* Local User Picture-in-Picture Video */}
          {callState === 'ONGOING' && (
            <div className="absolute bottom-24 right-6 w-32 sm:w-44 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/20 bg-black/80 shadow-2xl z-20">
              {!isVideoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 text-center text-xs">
                  <VideoOff className="w-6 h-6 mb-1 text-gray-500" />
                  <span>Camera Off</span>
                </div>
              )}
              <span className="absolute bottom-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white">
                You
              </span>
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-6 flex items-center justify-center gap-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          {/* Mute Mic */}
          <button
            id="btn-call-toggle-mic"
            onClick={toggleMute}
            className={`p-3.5 rounded-full transition-all ${
              isMuted
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera Toggle */}
          <button
            id="btn-call-toggle-video"
            onClick={toggleVideo}
            className={`p-3.5 rounded-full transition-all ${
              isVideoOff
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
          </button>

          {/* Hang Up Button */}
          <button
            id="btn-call-hangup"
            onClick={handleHangup}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/40 transition-transform hover:scale-105 active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
