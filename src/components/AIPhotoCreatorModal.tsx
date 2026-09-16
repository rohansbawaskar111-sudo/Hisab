import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Camera,
  Upload,
  Check,
  ShieldCheck,
  Flame,
  Palmtree,
  Moon,
  Heart,
  Plane,
  Eye,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { UserProfile, Photo, PhotoStyle, AiPhotoPreset } from '../types';
import { api } from '../api/client';

interface AIPhotoCreatorModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  onPhotoAdded: (photo: Photo) => void;
}

interface PresetOption {
  id: AiPhotoPreset;
  label: string;
  icon: React.ReactNode;
  description: string;
  defaultOutfit: string;
  defaultHair: string;
  defaultBackground: string;
  defaultPose: string;
  defaultLighting: string;
  defaultStyle: PhotoStyle;
}

const PRESET_OPTIONS: PresetOption[] = [
  {
    id: 'glamour',
    label: 'Glamour',
    icon: <Flame className="w-4 h-4 text-rose-400" />,
    description: 'High-end sensual glamour with elegant evening dress or tailored suit',
    defaultOutfit: 'Black silk evening gown or sharp velvet dinner jacket',
    defaultHair: 'Glossy Hollywood waves or neat classic fade',
    defaultBackground: 'Opulent hotel lounge with chandelier reflections',
    defaultPose: 'Confident over-the-shoulder gaze',
    defaultLighting: 'Cinematic warm rim lighting with soft falloff',
    defaultStyle: 'Glamour',
  },
  {
    id: 'fashion',
    label: 'Fashion',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    description: 'Modern runway and editorial street-style photography',
    defaultOutfit: 'Designer trench coat over chic minimalist slip',
    defaultHair: 'Sleek high ponytail or textured swept-back crop',
    defaultBackground: 'Urban cobblestone street with golden daylight',
    defaultPose: 'Casual walking stride with relaxed expression',
    defaultLighting: 'Soft natural daylight with crisp contrast',
    defaultStyle: 'Stylish fashion',
  },
  {
    id: 'beach',
    label: 'Beach',
    icon: <Palmtree className="w-4 h-4 text-amber-400" />,
    description: 'Sun-kissed resort style and ocean-side radiance',
    defaultOutfit: 'Resort linen shirt or stylish beachwear cover-up',
    defaultHair: 'Sun-bleached beach waves or textured wet look',
    defaultBackground: 'Golden sand beach with turquoise waves and sunset glow',
    defaultPose: 'Lounging on a wooden cabana deck with a smile',
    defaultLighting: 'Golden hour sunset with warm lens flare',
    defaultStyle: 'Beach/resort',
  },
  {
    id: 'night_out',
    label: 'Night Out',
    icon: <Moon className="w-4 h-4 text-indigo-400" />,
    description: 'Chic rooftop bar or cocktail lounge nightlife aesthetic',
    defaultOutfit: 'Fitted leather jacket or sleek cocktail party dress',
    defaultHair: 'Tousled party curls or sharp textured pompadour',
    defaultBackground: 'Rooftop cocktail terrace overlooking vibrant city skyline',
    defaultPose: 'Holding an artisanal cocktail with candid laughter',
    defaultLighting: 'Moody neon and warm candlelight bokeh',
    defaultStyle: 'Party look',
  },
  {
    id: 'romantic_date',
    label: 'Romantic Date',
    icon: <Heart className="w-4 h-4 text-rose-500" />,
    description: 'Intimate, warm, and charming dinner date vibes',
    defaultOutfit: 'Soft cashmere knit or burgundy velvet blazer',
    defaultHair: 'Romantic side-part with natural wisps',
    defaultBackground: 'Intimate candlelit French bistro table with wine glasses',
    defaultPose: 'Direct warm eye contact with an alluring genuine smile',
    defaultLighting: 'Soft warm candlelight glow',
    defaultStyle: 'Evening outfit',
  },
  {
    id: 'studio',
    label: 'Studio',
    icon: <Camera className="w-4 h-4 text-sky-400" />,
    description: 'Sharp, clean, professional headshot and portrait photography',
    defaultOutfit: 'Monochrome tailored blazer and clean open-collar shirt',
    defaultHair: 'Clean salon blowout or styled taper fade',
    defaultBackground: 'Neutral seamless studio backdrop in warm slate gray',
    defaultPose: 'Straight-on confident gaze with head slightly tilted',
    defaultLighting: 'Butterfly studio strobe lighting with soft fill',
    defaultStyle: 'Studio portrait',
  },
  {
    id: 'travel',
    label: 'Travel',
    icon: <Plane className="w-4 h-4 text-emerald-400" />,
    description: 'Scenic holiday memories and picturesque European vistas',
    defaultOutfit: 'Effortless Mediterranean resort linen with sunglasses',
    defaultHair: 'Wind-blown natural textured hair',
    defaultBackground: 'Amalfi Coast balcony overlooking Mediterranean cliffside',
    defaultPose: 'Leaning on stone balustrade looking out at sea',
    defaultLighting: 'Radiant Mediterranean morning sun',
    defaultStyle: 'Travel',
  },
  {
    id: 'premium_dating',
    label: 'Premium Dating',
    icon: <Sparkles className="w-4 h-4 text-yellow-400" />,
    description: 'Polished, charming, top-tier dating profile centerpiece',
    defaultOutfit: 'Smart casual polo or flattering tailored silk top',
    defaultHair: 'Refined modern styling with healthy shine',
    defaultBackground: 'Sunlit specialty cafe patio with lush green foliage',
    defaultPose: 'Approachable three-quarters smile looking right at camera',
    defaultLighting: 'Luminous diffused outdoor patio light',
    defaultStyle: 'Dating profile',
  },
];

const PHOTO_STYLES: PhotoStyle[] = [
  'Stylish fashion',
  'Party look',
  'Beach/resort',
  'Evening outfit',
  'Casual attractive',
  'Glamour',
  'Studio portrait',
  'Travel',
  'Dating profile',
];

export const AIPhotoCreatorModal: React.FC<AIPhotoCreatorModalProps> = ({
  userProfile,
  onClose,
  onPhotoAdded,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetOption>(PRESET_OPTIONS[0]);
  const [style, setStyle] = useState<PhotoStyle>(PRESET_OPTIONS[0].defaultStyle);
  const [outfit, setOutfit] = useState<string>(PRESET_OPTIONS[0].defaultOutfit);
  const [hairstyle, setHairstyle] = useState<string>(PRESET_OPTIONS[0].defaultHair);
  const [background, setBackground] = useState<string>(PRESET_OPTIONS[0].defaultBackground);
  const [pose, setPose] = useState<string>(PRESET_OPTIONS[0].defaultPose);
  const [lighting, setLighting] = useState<string>(PRESET_OPTIONS[0].defaultLighting);
  const [visibility, setVisibility] = useState<'public' | 'matches_only'>('public');

  // Reference photo handling (mandatory if representsUser = true)
  const [representsUser, setRepresentsUser] = useState<boolean>(true);
  const [referencePhotoUrl, setReferencePhotoUrl] = useState<string>(
    userProfile.photos?.[0]?.url || ''
  );
  const [customRefUrl, setCustomRefUrl] = useState<string>('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedPhoto, setGeneratedPhoto] = useState<Photo | null>(null);

  const handleSelectPreset = (preset: PresetOption) => {
    setSelectedPreset(preset);
    setStyle(preset.defaultStyle);
    setOutfit(preset.defaultOutfit);
    setHairstyle(preset.defaultHair);
    setBackground(preset.defaultBackground);
    setPose(preset.defaultPose);
    setLighting(preset.defaultLighting);
    setGeneratedPhoto(null);
    setErrorMsg(null);
  };

  const handleGenerate = async () => {
    setErrorMsg(null);

    const refToUse = customRefUrl.trim() || referencePhotoUrl;
    if (representsUser && !refToUse) {
      setErrorMsg('Please select or provide a reference photo of yourself to generate personalized AI photos.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await api.createAiPhoto({
        preset: selectedPreset.id,
        outfit,
        hairstyle,
        background,
        pose,
        lighting,
        style,
        representsUser,
        referencePhotoUrl: refToUse,
        visibility,
      });

      setGeneratedPhoto(res.photo);
      onPhotoAdded(res.photo);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate AI photo');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      id="modal-ai-photo-creator"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-[#121622] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#151B2B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-500 to-amber-400 p-0.5 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <div className="w-full h-full bg-[#121622] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">AI Photo Creator</h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30">
                  18+ Non-Explicit
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Generate attractive, stylish & sensual-but-non-explicit profile photos
              </p>
            </div>
          </div>
          <button
            id="btn-close-ai-photo-modal"
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Generated Result Preview (if ready) */}
          {generatedPhoto && (
            <div className="p-4 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Photo Successfully Created & Saved to Profile
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-medium border border-white/10 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-rose-400" />
                  ✨ AI Generated
                </span>
              </div>

              <div className="relative aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden border border-white/15 shadow-xl group">
                <img
                  src={generatedPhoto.url}
                  alt="AI Generated Dating Portrait"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/15 shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>✨ AI Generated</span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-black/70 backdrop-blur-md text-xs text-gray-200 border border-white/10">
                  <p className="font-semibold text-white">{generatedPhoto.style || selectedPreset.label}</p>
                  <p className="text-[11px] text-gray-400 truncate">Saved directly to your database profile</p>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setGeneratedPhoto(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Generate Another Look
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-semibold text-white shadow-lg shadow-rose-500/25 transition-all"
                >
                  Done & View Profile
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Select AI Preset */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-200 tracking-wider uppercase flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Step 1: Choose Photo Preset
              </label>
              <span className="text-[11px] text-gray-400">8 Curated Dating Styles</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_OPTIONS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-rose-500/15 border-rose-500/50 shadow-md shadow-rose-500/10 text-white'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 rounded-lg bg-black/40">{preset.icon}</div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{preset.label}</p>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Reference Photo Requirement */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-rose-400" />
                  Personal Reference Photo Requirement
                </label>
                <p className="text-[11px] text-gray-400">
                  If this photo represents you, an existing or uploaded reference photo is required.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={representsUser}
                  onChange={(e) => setRepresentsUser(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
              </label>
            </div>

            {representsUser && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="text-[11px] text-gray-300 font-medium">
                  Select reference photo from your profile:
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {userProfile.photos?.map((ph, idx) => (
                    <div
                      key={ph.id || idx}
                      onClick={() => {
                        setReferencePhotoUrl(ph.url);
                        setCustomRefUrl('');
                      }}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden cursor-pointer shrink-0 border-2 transition-all ${
                        referencePhotoUrl === ph.url && !customRefUrl
                          ? 'border-rose-500 scale-105 shadow-md shadow-rose-500/30'
                          : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={ph.url}
                        alt="Profile photo option"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {referencePhotoUrl === ph.url && !customRefUrl && (
                        <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Or paste custom reference photo image URL..."
                    value={customRefUrl}
                    onChange={(e) => setCustomRefUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                  {customRefUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomRefUrl('')}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Customization (Outfit, Hairstyle, Background, Pose, Lighting, Style) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-200 tracking-wider uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                Step 2: Customize Styling & Details
              </label>
              <span className="text-[11px] text-gray-400">Non-explicit & elegant</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Photo Style */}
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  Photography Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as PhotoStyle)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  {PHOTO_STYLES.map((st) => (
                    <option key={st} value={st} className="bg-[#151B2B]">
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Outfit */}
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  Outfit
                </label>
                <input
                  type="text"
                  value={outfit}
                  onChange={(e) => setOutfit(e.target.value)}
                  placeholder="e.g. Silk slip dress, Italian linen suit"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Hairstyle */}
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  Hairstyle
                </label>
                <input
                  type="text"
                  value={hairstyle}
                  onChange={(e) => setHairstyle(e.target.value)}
                  placeholder="e.g. Glossy waves, textured fade, sleek blowout"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Background */}
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  Background
                </label>
                <input
                  type="text"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="e.g. Skyline rooftop, beach sunset, minimalist studio"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Pose */}
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  Pose
                </label>
                <input
                  type="text"
                  value={pose}
                  onChange={(e) => setPose(e.target.value)}
                  placeholder="e.g. Confident over-the-shoulder smile, relaxed lounge"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Lighting */}
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  Lighting
                </label>
                <input
                  type="text"
                  value={lighting}
                  onChange={(e) => setLighting(e.target.value)}
                  placeholder="e.g. Golden hour sunset, soft studio strobe, moody neon"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Visibility Setting */}
            <div className="pt-2 flex items-center justify-between">
              <label className="text-xs text-gray-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-gray-400" />
                Photo Visibility:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
                    visibility === 'public'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
                  }`}
                >
                  Public (All 18+ Singles)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('matches_only')}
                  className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
                    visibility === 'matches_only'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
                  }`}
                >
                  Matches Only
                </button>
              </div>
            </div>
          </div>

          {/* Safety & Policy Notice */}
          <div className="p-3.5 rounded-2xl bg-[#0F1420] border border-white/10 text-[11px] text-gray-400 space-y-1">
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Safety & Transparency Standards</span>
            </div>
            <p>
              Photos must depict consenting adults (18+) only and remain non-explicit. Explicit sexual
              activity, nudity, and minor content are strictly prohibited.
            </p>
            <p className="text-gray-500">
              AI-generated photos will be permanently marked with the{' '}
              <strong className="text-gray-300 font-medium">✨ AI Generated</strong> badge for complete
              transparency.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#151B2B] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            id="btn-generate-ai-photo-submit"
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-rose-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Crafting AI Photo...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Create & Save AI Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
