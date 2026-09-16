import React, { useState, useRef } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Camera,
  CheckCircle2,
  PhoneCall,
  UserX,
} from 'lucide-react';
import { UserProfile, ReportReason } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface SafetyModalProps {
  initialTab?: 'safety_tips' | 'report' | 'block' | 'verify';
  targetUser?: UserProfile | null;
  onClose: () => void;
  onBlockSuccess?: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({
  initialTab = 'safety_tips',
  targetUser,
  onClose,
  onBlockSuccess,
}) => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'safety_tips' | 'report' | 'block' | 'verify'>(initialTab);

  // Report state
  const [reportReason, setReportReason] = useState<ReportReason>('Inappropriate content');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);
  const [blockSuccess, setBlockSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Verification state
  const [selfieUrl, setSelfieUrl] = useState<string>('');
  const [poseType, setPoseType] = useState<string>('Peace Sign ✌️');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifySuccess, setVerifySuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setIsSubmittingReport(true);
    setErrorMessage(null);

    try {
      await api.reportUser({
        reportedUserId: targetUser.userId || targetUser.id,
        targetType: 'profile',
        reason: reportReason,
        details: reportDetails,
      });
      setReportSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleBlockUser = async () => {
    if (!targetUser) return;
    setErrorMessage(null);
    try {
      await api.blockUser(targetUser.userId || targetUser.id);
      setBlockSuccess(true);
      setTimeout(() => {
        onClose();
        if (onBlockSuccess) onBlockSuccess();
      }, 1500);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to block user');
    }
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelfieUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleVerificationSubmit = async () => {
    if (!selfieUrl) return;
    setIsVerifying(true);
    try {
      await api.requestVerification(selfieUrl, poseType);
      setVerifySuccess(true);
      await refreshUser();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Verification request failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      id="safety-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-lg bg-[#121622] rounded-3xl border border-white/10 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Safety & Trust Center</h3>
              <p className="text-xs text-gray-400">Your privacy and security are our highest priority</p>
            </div>
          </div>
          <button
            id="btn-close-safety-modal"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-[#1A202E] rounded-xl border border-white/5 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('safety_tips')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'safety_tips' ? 'bg-rose-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Safety Tips
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'verify' ? 'bg-rose-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Photo Verification
          </button>
          {targetUser && (
            <>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'report' ? 'bg-rose-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Report
              </button>
              <button
                onClick={() => setActiveTab('block')}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'block' ? 'bg-rose-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Block
              </button>
            </>
          )}
        </div>

        {/* Tab Content: Safety Tips */}
        {activeTab === 'safety_tips' && (
          <div className="space-y-3 text-xs text-gray-300">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <Lock className="w-4 h-4" />
                <span>Keep personal info private</span>
              </div>
              <p className="leading-relaxed">
                Never share home addresses, financial details, bank accounts, or social security numbers on chat.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Meet in public places</span>
              </div>
              <p className="leading-relaxed">
                For first dates, always meet in well-lit public spots (cafes, restaurants) and inform a close friend of your plans.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-sky-400 font-semibold">
                <PhoneCall className="w-4 h-4" />
                <span>Emergency Support Hotlines</span>
              </div>
              <p className="leading-relaxed">
                National Sexual Assault Hotline: 1-800-656-4673 • Crisis Text Line: Text HOME to 741741.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content: Photo Verification */}
        {activeTab === 'verify' && (
          <div className="space-y-4 text-xs">
            {verifySuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">Selfie Submitted for Verification!</h4>
                <p className="text-gray-300">
                  Our trust team will verify your selfie matches your profile photos. You will receive the Blue Checkmark once reviewed.
                </p>
              </div>
            ) : user?.isVerified ? (
              <div className="p-6 text-center space-y-2 bg-sky-500/10 border border-sky-500/20 rounded-2xl">
                <ShieldCheck className="w-10 h-10 text-sky-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">You are a Verified Member!</h4>
                <p className="text-gray-300">
                  Your profile has been verified with authentic selfie matching. Other users can see your verified status.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-200">
                  <span className="font-semibold block mb-0.5">Pose Challenge:</span>
                  Take a quick selfie showing: <strong>{poseType}</strong>. This confirms you are real and prevents catfish/bot profiles.
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleSelfieUpload}
                  accept="image/*"
                  className="hidden"
                />

                {selfieUrl ? (
                  <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-sky-400">
                    <img src={selfieUrl} alt="Selfie preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setSelfieUrl('')}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    id="btn-take-verification-selfie"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 rounded-2xl border-2 border-dashed border-white/20 hover:border-sky-400 flex flex-col items-center justify-center text-gray-300 hover:text-white transition-colors"
                  >
                    <Camera className="w-8 h-8 text-sky-400 mb-1.5" />
                    <span className="font-semibold">Take or Upload Verification Selfie</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Private photo, only used for trust review</span>
                  </button>
                )}

                <button
                  id="btn-submit-verification"
                  onClick={handleVerificationSubmit}
                  disabled={!selfieUrl || isVerifying}
                  className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-semibold transition-all"
                >
                  {isVerifying ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Report User */}
        {activeTab === 'report' && targetUser && (
          <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
            {reportSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">Report Received</h4>
                <p className="text-gray-300">
                  Thank you for keeping our community safe. Our moderation team has been notified and will take appropriate disciplinary action.
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-300">
                  Reporting <span className="font-semibold text-white">{targetUser.firstName}</span>:
                </p>

                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Reason for Report</label>
                  <select
                    id="select-report-reason"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as ReportReason)}
                    className="w-full p-2.5 rounded-xl bg-[#1A202E] border border-white/10 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Fake profile">Fake profile / Catfish</option>
                    <option value="Inappropriate content">Inappropriate photos / sexual content</option>
                    <option value="Harassment">Harassment / Abusive messages</option>
                    <option value="Scam">Scam / Asking for money or crypto</option>
                    <option value="Spam">Spam / Commercial promotion</option>
                    <option value="Threatening behavior">Threats or safety concern</option>
                    <option value="Other">Other violation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Additional Details</label>
                  <textarea
                    id="input-report-details"
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide any context that will help our safety reviewers..."
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-[#1A202E] border border-white/10 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  id="btn-submit-report"
                  type="submit"
                  disabled={isSubmittingReport}
                  className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-semibold transition-all"
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Confidential Report'}
                </button>
              </>
            )}
          </form>
        )}

        {/* Tab Content: Block User */}
        {activeTab === 'block' && targetUser && (
          <div className="space-y-4 text-xs text-center py-2">
            {blockSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">User Blocked</h4>
                <p className="text-gray-300">
                  {targetUser.firstName} has been blocked and removed from your discovery and matches.
                </p>
              </div>
            ) : (
              <>
                <UserX className="w-12 h-12 text-rose-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    Block {targetUser.firstName}?
                  </h4>
                  <p className="text-gray-300 max-w-xs mx-auto">
                    They will not be able to see your profile, swipe on you, or send you messages. They will not be notified that you blocked them.
                  </p>
                </div>

                {errorMessage && (
                  <p className="text-rose-400 text-xs">{errorMessage}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-confirm-block"
                    onClick={handleBlockUser}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-colors"
                  >
                    Confirm Block
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
