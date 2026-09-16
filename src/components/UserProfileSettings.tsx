import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Plus,
  Trash2,
  Check,
  Shield,
  ShieldCheck,
  Download,
  LogOut,
  Save,
  CheckCircle2,
  Heart,
  EyeOff,
  UserX,
  Sparkles,
  Lock,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
  Flame,
  UserCheck,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, RelationshipIntention, Interest, Photo } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { AIPhotoCreatorModal } from './AIPhotoCreatorModal';

interface UserProfileSettingsProps {
  onOpenVerification: () => void;
}

export const UserProfileSettings: React.FC<UserProfileSettingsProps> = ({
  onOpenVerification,
}) => {
  const { user, profile, updateProfile, setProfile, refreshUser, logout } = useAuth();
  const [formData, setFormData] = useState<Partial<UserProfile>>(profile || {});
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showAiPhotoModal, setShowAiPhotoModal] = useState<boolean>(false);
  const [targetReplacePhotoId, setTargetReplacePhotoId] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  useEffect(() => {
    api
      .getInterests()
      .then((data) => setAvailableInterests(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateProfile(formData);
      setFormData(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
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
          // Cache busting query parameter
          const cacheBustedUrl = `${data.url}?v=${Date.now()}`;

          if (targetReplacePhotoId) {
            // Replace existing photo
            const replaceRes = await api.replaceProfilePhoto(targetReplacePhotoId, cacheBustedUrl);
            if (replaceRes.profile) {
              setProfile(replaceRes.profile);
              setFormData(replaceRes.profile);
            }
          } else {
            // Add new photo as primary (Photo #1)
            const addRes = await api.addProfilePhoto({
              url: cacheBustedUrl,
              isPrimary: true, // Always becomes primary Photo #1
            });
            if (addRes.profile) {
              setProfile(addRes.profile);
              setFormData(addRes.profile);
            }
          }
        }
      } catch (err) {
        console.error('Photo upload failed', err);
        alert('Failed to upload photo. Please try again.');
      } finally {
        setIsUploadingPhoto(false);
        setTargetReplacePhotoId(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async (photoId: string) => {
    try {
      const res = await api.deleteProfilePhoto(photoId);
      if (res.profile) {
        setProfile(res.profile);
        setFormData(res.profile);
      } else {
        const updated = (formData.photos || []).filter((p) => p.id !== photoId);
        setFormData((prev) => ({ ...prev, photos: updated }));
        await updateProfile({ photos: updated });
      }
    } catch (err) {
      console.error('Failed to delete photo', err);
    }
  };

  const handleAiPhotoAdded = async (_newPhoto: Photo) => {
    await refreshUser();
  };

  const handleSetMainPhoto = async (photoId: string) => {
    try {
      const res = await api.setPrimaryPhoto(photoId);
      if (res.profile) {
        setProfile(res.profile);
        setFormData(res.profile);
      }
    } catch (err) {
      console.error('Failed to set primary photo', err);
    }
  };

  const handleToggleInterest = (interest: Interest) => {
    const current = formData.interests ? [...formData.interests] : [];
    const exists = current.some((i) => i.id === interest.id);

    let updated: Interest[];
    if (exists) {
      updated = current.filter((i) => i.id !== interest.id);
    } else {
      if (current.length >= 7) {
        alert('You can select up to 7 favorite interests.');
        return;
      }
      updated = [...current, interest];
    }
    setFormData((prev) => ({ ...prev, interests: updated }));
  };

  const handleExportData = async () => {
    try {
      const data = await api.exportAccountData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibematch-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || 'Export failed');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your VibeMatch account and all your data? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await api.deleteAccount();
      logout();
    } catch (e: any) {
      alert(e.message || 'Failed to delete account');
    }
  };

  const intentions: RelationshipIntention[] = [
    'Long-term partner',
    'Long-term, open to short',
    'Short-term fun',
    'New friends',
    'Still figuring it out',
  ];

  return (
    <div id="user-profile-settings-container" className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 text-white pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Profile & Settings</h1>
          <p className="text-xs text-gray-400">Manage your photos, bio, vibes, and privacy settings</p>
        </div>
        <button
          id="btn-save-profile"
          onClick={() => handleSave()}
          disabled={isSaving}
          className="px-4 py-2 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all"
        >
          {isSaving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs text-center font-medium animate-fade-in">
          Profile changes saved successfully!
        </div>
      )}

      {/* Verification Status Banner */}
      <div className="p-4 rounded-3xl bg-[#141926] border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              user?.isVerified
                ? 'bg-sky-500/20 text-sky-400'
                : 'bg-white/5 text-gray-400'
            }`}
          >
            {user?.isVerified ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-white">
                {user?.isVerified ? 'Verified Profile Badge' : 'Get Verified'}
              </h4>
              {user?.isVerified && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
            </div>
            <p className="text-xs text-gray-400">
              {user?.isVerified
                ? 'Your photo verification checkmark is active.'
                : 'Confirm you are authentic with a quick selfie to earn the blue badge.'}
            </p>
          </div>
        </div>

        {!user?.isVerified && (
          <button
            id="btn-trigger-verify-modal"
            onClick={onOpenVerification}
            className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold transition-all"
          >
            Verify Now
          </button>
        )}
      </div>

      {/* Photo Gallery Editor */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
              Profile Photos ({formData.photos?.length || 0}/6)
            </h3>
            <p className="text-[11px] text-gray-400">
              Upload your own photos or generate stylish AI photos. Photo #1 is your primary dating photo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-upload-photo-header"
              type="button"
              disabled={isUploadingPhoto || (formData.photos && formData.photos.length >= 6)}
              onClick={() => {
                setTargetReplacePhotoId(null);
                fileInputRef.current?.click();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
            >
              <Upload className="w-3.5 h-3.5 text-rose-400" />
              <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
            </button>
            <button
              id="btn-open-create-ai-photo"
              type="button"
              onClick={() => setShowAiPhotoModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-purple-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Create AI Photo</span>
            </button>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          className="hidden"
        />

        {(!formData.photos || formData.photos.length === 0) && (
          <div className="p-8 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">No profile photos yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Upload your original photo to make it Photo #1 (primary) or create a stylish AI photo.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                id="btn-empty-upload-primary"
                type="button"
                onClick={() => {
                  setTargetReplacePhotoId(null);
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Primary Photo</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {formData.photos?.map((photo, index) => {
            const isPrimary = photo.isMain || photo.isPrimary || index === 0;
            return (
              <div
                key={photo.id}
                className={`group relative aspect-[3/4] rounded-2xl overflow-hidden bg-black border-2 transition-all ${
                  isPrimary ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-white/10'
                }`}
              >
                <img
                  src={photo.url}
                  alt={`Profile photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Primary Photo Badge */}
                {isPrimary ? (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md z-10 flex items-center gap-1">
                    PHOTO #1 (PRIMARY)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetMainPhoto(photo.id)}
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 hover:bg-rose-500 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-sm cursor-pointer"
                  >
                    Make Primary
                  </button>
                )}

                {/* AI Generated Badge */}
                {photo.isAiGenerated && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[9px] font-semibold text-rose-300 border border-rose-500/30 flex items-center gap-1 shadow-md z-10">
                    <Sparkles className="w-2.5 h-2.5 text-rose-400" />
                    ✨ AI Generated
                  </span>
                )}

                {/* Photo Actions: Replace & Delete */}
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                  <button
                    id={`btn-replace-photo-${photo.id}`}
                    type="button"
                    onClick={() => {
                      setTargetReplacePhotoId(photo.id);
                      fileInputRef.current?.click();
                    }}
                    className="p-1.5 rounded-full bg-black/70 hover:bg-sky-500 text-white opacity-80 group-hover:opacity-100 transition-all backdrop-blur-sm cursor-pointer"
                    title="Replace this photo with a new image"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button
                    id={`btn-delete-photo-${photo.id}`}
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white opacity-80 group-hover:opacity-100 transition-all backdrop-blur-sm cursor-pointer"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {(!formData.photos || formData.photos.length < 6) && (
            <button
              id="btn-upload-photo-slot"
              type="button"
              disabled={isUploadingPhoto}
              onClick={() => {
                setTargetReplacePhotoId(null);
                fileInputRef.current?.click();
              }}
              className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 hover:border-rose-500 flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-8 h-8 text-rose-400 mb-1" />
              <span className="text-xs font-semibold">
                {isUploadingPhoto ? 'Uploading...' : 'Add Photo'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Core Details Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Name & City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium">First Name</label>
            <input
              id="input-edit-firstname"
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full p-3 rounded-2xl bg-[#141926] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium">City, State</label>
            <input
              id="input-edit-city"
              type="text"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full p-3 rounded-2xl bg-[#141926] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs text-gray-400 mb-1 font-medium">
            Bio (Share your story and what makes you unique)
          </label>
          <textarea
            id="input-edit-bio"
            rows={4}
            value={formData.bio || ''}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="A little bit about me..."
            className="w-full p-3 rounded-2xl bg-[#141926] border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Relationship Goal */}
        <div>
          <label className="block text-xs text-gray-400 mb-1 font-medium">
            Relationship Intention
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {intentions.map((intent) => {
              const isSelected = formData.relationshipIntention === intent;
              return (
                <button
                  key={intent}
                  type="button"
                  onClick={() => setFormData({ ...formData, relationshipIntention: intent })}
                  className={`p-3 rounded-2xl text-xs font-medium text-left flex items-center justify-between border transition-all ${
                    isSelected
                      ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-sm'
                      : 'bg-[#141926] border-white/10 text-gray-300 hover:border-white/20'
                  }`}
                >
                  <span>{intent}</span>
                  {isSelected && <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Career & Lifestyle */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium">Occupation</label>
            <input
              id="input-edit-occupation"
              type="text"
              value={formData.occupation || ''}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              placeholder="e.g. Architect"
              className="w-full p-3 rounded-2xl bg-[#141926] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium">Education</label>
            <input
              id="input-edit-education"
              type="text"
              value={formData.education || ''}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              placeholder="e.g. NYU"
              className="w-full p-3 rounded-2xl bg-[#141926] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium">Height</label>
            <input
              id="input-edit-height"
              type="text"
              value={formData.height || ''}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              placeholder="e.g. 5'10"
              className="w-full p-3 rounded-2xl bg-[#141926] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Interests Selection */}
        <div className="space-y-2">
          <label className="block text-xs text-gray-400 font-medium">
            Interests & Passions (Select up to 7)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableInterests.map((interest) => {
              const isSelected = formData.interests?.some((i) => i.id === interest.id);
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => handleToggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25'
                      : 'bg-[#141926] text-gray-300 border-white/10 hover:border-white/25'
                  }`}
                >
                  {interest.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Adult Dating & Profile Controls (Strict User Control) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs uppercase tracking-wider text-gray-300 font-bold">
              18+ Dating & Profile Controls
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Profile Visibility */}
            <div className="p-3.5 rounded-2xl bg-[#141926] border border-white/10 space-y-1.5">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-rose-400" /> Profile Visibility
              </label>
              <select
                value={formData.profileVisibility || 'public'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profileVisibility: e.target.value as 'public' | 'incognito' | 'matches_only',
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="public" className="bg-[#151B2B]">Public (Visible in 18+ Feed)</option>
                <option value="incognito" className="bg-[#151B2B]">Incognito (Only users I liked)</option>
                <option value="matches_only" className="bg-[#151B2B]">Matches Only</option>
              </select>
              <p className="text-[10px] text-gray-400">Controls who can discover your card.</p>
            </div>

            {/* Photo Visibility */}
            <div className="p-3.5 rounded-2xl bg-[#141926] border border-white/10 space-y-1.5">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" /> Photo Visibility
              </label>
              <select
                value={formData.photoVisibility || 'all'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    photoVisibility: e.target.value as 'all' | 'matches_only',
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="all" className="bg-[#151B2B]">All Adult Users</option>
                <option value="matches_only" className="bg-[#151B2B]">Matches Only</option>
              </select>
              <p className="text-[10px] text-gray-400">Lock photos until a mutual match occurs.</p>
            </div>

            {/* Who can message */}
            <div className="p-3.5 rounded-2xl bg-[#141926] border border-white/10 space-y-1.5">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> Who Can Message Me
              </label>
              <select
                value={formData.whoCanMessage || 'matches'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whoCanMessage: e.target.value as 'all' | 'matches' | 'verified_matches',
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="matches" className="bg-[#151B2B]">Matches Only (Recommended)</option>
                <option value="verified_matches" className="bg-[#151B2B]">Verified Matches Only</option>
                <option value="all" className="bg-[#151B2B]">Everyone (Open Inquiries)</option>
              </select>
              <p className="text-[10px] text-gray-400">Prevent unwanted messages and spam.</p>
            </div>

            {/* Who can like */}
            <div className="p-3.5 rounded-2xl bg-[#141926] border border-white/10 space-y-1.5">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> Who Can Send Likes
              </label>
              <select
                value={formData.whoCanLike || 'everyone'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whoCanLike: e.target.value as 'everyone' | 'verified_only',
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="everyone" className="bg-[#151B2B]">Everyone (All 18+ Singles)</option>
                <option value="verified_only" className="bg-[#151B2B]">Verified Profiles Only</option>
              </select>
              <p className="text-[10px] text-gray-400">Filter likes from authentic blue-badge users.</p>
            </div>

            {/* Who can call */}
            <div className="p-3.5 rounded-2xl bg-[#141926] border border-white/10 space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400" /> Who Can Video Call Me
              </label>
              <select
                value={formData.whoCanCall || 'mutual_matches'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whoCanCall: e.target.value as 'mutual_matches' | 'favorites_only',
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="mutual_matches" className="bg-[#151B2B]">
                  Mutual Matches Only (Standard dating safety protocol)
                </option>
                <option value="favorites_only" className="bg-[#151B2B]">
                  Favorites Only (Elevated intimacy setting)
                </option>
              </select>
              <p className="text-[10px] text-gray-400">
                Video calls require mutual consent and match confirmation before launching.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Display Toggles */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
            Display Preferences
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141926] border border-white/10">
              <div>
                <span className="text-xs font-semibold text-white block">Hide My Age</span>
                <span className="text-[10px] text-gray-400">Keep age hidden on your public card</span>
              </div>
              <input
                type="checkbox"
                checked={formData.hideAge || false}
                onChange={(e) => setFormData({ ...formData, hideAge: e.target.checked })}
                className="w-5 h-5 accent-rose-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141926] border border-white/10">
              <div>
                <span className="text-xs font-semibold text-white block">Hide Distance</span>
                <span className="text-[10px] text-gray-400">Don't show kilometers away from other users</span>
              </div>
              <input
                type="checkbox"
                checked={formData.hideDistance || false}
                onChange={(e) => setFormData({ ...formData, hideDistance: e.target.checked })}
                className="w-5 h-5 accent-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Account Data & Safety Actions */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Account Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              id="btn-export-data"
              onClick={handleExportData}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white font-medium flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download My Data (GDPR Copy)</span>
            </button>

            <button
              type="button"
              id="btn-logout"
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-xs text-gray-300 hover:text-rose-300 font-medium flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>

            <button
              type="button"
              id="btn-delete-account"
              onClick={handleDeleteAccount}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs text-rose-400 font-medium flex items-center gap-2 transition-colors ml-auto"
            >
              <UserX className="w-4 h-4" />
              <span>Delete Account Permanently</span>
            </button>
          </div>
        </div>
      </form>

      {/* AI Photo Creator Modal */}
      {showAiPhotoModal && profile && (
        <AIPhotoCreatorModal
          userProfile={profile}
          onClose={() => setShowAiPhotoModal(false)}
          onPhotoAdded={(newPhoto) => {
            handleAiPhotoAdded(newPhoto);
          }}
        />
      )}
    </div>
  );
};
