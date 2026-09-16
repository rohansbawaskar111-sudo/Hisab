import React, { useState } from 'react';
import { X, Sliders, CheckCircle2 } from 'lucide-react';
import { DiscoveryFilters, InterestedIn } from '../types';

interface FilterModalProps {
  initialFilters: DiscoveryFilters;
  onApply: (filters: DiscoveryFilters) => void;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  initialFilters,
  onApply,
  onClose,
}) => {
  const [filters, setFilters] = useState<DiscoveryFilters>(initialFilters);

  const handleReset = () => {
    setFilters({
      minAge: 18,
      maxAge: 40,
      maxDistanceKm: 50,
      gender: 'everyone',
      verifiedOnly: false,
    });
  };

  return (
    <div
      id="filters-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md bg-[#121622] rounded-3xl border border-white/10 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-white text-base">Discovery Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interested In */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300">Show Me</label>
          <div className="grid grid-cols-3 gap-2">
            {(['women', 'men', 'everyone'] as InterestedIn[]).map((genderOption) => (
              <button
                key={genderOption}
                type="button"
                onClick={() => setFilters({ ...filters, gender: genderOption })}
                className={`py-2 rounded-xl text-xs capitalize font-medium transition-all ${
                  filters.gender === genderOption
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-[#1A202E] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {genderOption}
              </button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-300">Age Range</span>
            <span className="text-rose-400 font-bold">
              {filters.minAge} - {filters.maxAge} years
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="18"
              max="60"
              value={filters.maxAge}
              onChange={(e) => setFilters({ ...filters, maxAge: parseInt(e.target.value, 10) })}
              className="w-full accent-rose-500"
            />
          </div>
        </div>

        {/* Maximum Distance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-300">Maximum Distance</span>
            <span className="text-rose-400 font-bold">{filters.maxDistanceKm} km</span>
          </div>
          <input
            type="range"
            min="5"
            max="150"
            step="5"
            value={filters.maxDistanceKm}
            onChange={(e) =>
              setFilters({ ...filters, maxDistanceKm: parseInt(e.target.value, 10) })
            }
            className="w-full accent-rose-500"
          />
        </div>

        {/* Verified Only Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1A202E] border border-white/5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <div>
              <span className="text-xs font-semibold text-white block">Verified Profiles Only</span>
              <span className="text-[10px] text-gray-400">Only view users with confirmed selfies</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
            className="w-5 h-5 accent-rose-500 rounded"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => onApply(filters)}
            className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors shadow-lg shadow-rose-500/20"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
