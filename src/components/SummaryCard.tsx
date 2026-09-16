import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface SummaryCardProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  totalIncome,
  totalExpense,
  balance,
}) => {
  const isPositive = balance >= 0;

  return (
    <div
      id="summary-balance-card"
      className="w-full bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden"
    >
      {/* Subtle decorative background pattern */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Net Balance */}
      <div className="relative z-10 mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            Total Balance &bull; कुल शेष
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isPositive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {isPositive ? 'Savings in Hand' : 'Deficit'}
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-baseline gap-1">
          <span>{formatINR(balance)}</span>
        </div>
      </div>

      {/* Income and Expense sub-blocks */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80 relative z-10">
        {/* Total Income */}
        <div
          id="summary-income-block"
          className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-3 border border-slate-700/50"
        >
          <div className="flex items-center gap-1.5 mb-1 text-slate-300">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-300">Income &bull; आय</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 truncate">
            {formatINR(totalIncome)}
          </div>
        </div>

        {/* Total Expense */}
        <div
          id="summary-expense-block"
          className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-3 border border-slate-700/50"
        >
          <div className="flex items-center gap-1.5 mb-1 text-slate-300">
            <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-300">Expense &bull; खर्च</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-rose-400 truncate">
            {formatINR(totalExpense)}
          </div>
        </div>
      </div>
    </div>
  );
};
