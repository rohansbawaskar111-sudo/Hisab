import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface UdharSummaryCardProps {
  totalYouGet: number;
  totalYouGive: number;
  pendingCount: number;
}

export const UdharSummaryCard: React.FC<UdharSummaryCardProps> = ({
  totalYouGet,
  totalYouGive,
  pendingCount,
}) => {
  const netReceivable = totalYouGet - totalYouGive;
  const isNetPositive = netReceivable >= 0;

  return (
    <div
      id="udhar-summary-card"
      className="w-full bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden"
    >
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Net Udhar Status */}
      <div className="relative z-10 mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            Udhar Khaata &bull; उधार खाता
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {pendingCount} Pending
          </span>
        </div>

        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {netReceivable >= 0
                ? `+${formatINR(netReceivable)}`
                : formatINR(netReceivable)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {netReceivable > 0
                ? 'Net amount you will receive'
                : netReceivable < 0
                ? 'Net amount you have to pay'
                : 'All dues settled'}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-blocks: You Get & You Give */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80 relative z-10">
        {/* Total You Get */}
        <div
          id="udhar-you-get-block"
          className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-3 border border-slate-700/50"
        >
          <div className="flex items-center gap-1.5 mb-1 text-slate-300">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-300">You Get &bull; लेना है</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 truncate">
            {formatINR(totalYouGet)}
          </div>
        </div>

        {/* Total You Give */}
        <div
          id="udhar-you-give-block"
          className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-3 border border-slate-700/50"
        >
          <div className="flex items-center gap-1.5 mb-1 text-slate-300">
            <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-300">You Give &bull; देना है</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-rose-400 truncate">
            {formatINR(totalYouGive)}
          </div>
        </div>
      </div>
    </div>
  );
};
