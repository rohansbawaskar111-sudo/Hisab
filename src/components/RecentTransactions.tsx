import React, { useState, useMemo } from 'react';
import { Search, Filter, ReceiptText, PlusCircle } from 'lucide-react';
import { Transaction, FilterType } from '../types';
import { TransactionItem } from './TransactionItem';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
  onOpenAddModal: (type: 'income' | 'expense') => void;
  onLoadSamples: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onDelete,
  onEdit,
  onOpenAddModal,
  onLoadSamples,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sort by date desc (and createdAt desc for same date)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.createdAt - a.createdAt;
    });
  }, [transactions]);

  // Filter based on active tab and search query
  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter((tx) => {
      const matchesFilter =
        filter === 'all' ? true : tx.type === filter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tx.category.toLowerCase().includes(q) ||
        (tx.note && tx.note.toLowerCase().includes(q)) ||
        tx.amount.toString().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [sortedTransactions, filter, searchQuery]);

  return (
    <section id="recent-transactions-section" className="mt-4 mb-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Recent Transactions
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {transactions.length}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('income')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              filter === 'income'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setFilter('expense')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              filter === 'expense'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Expense
          </button>
        </div>
      </div>

      {/* Optional Search bar if there are transactions */}
      {transactions.length > 2 && (
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search hisab by category or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-400"
          />
        </div>
      )}

      {/* Transaction List */}
      {filteredTransactions.length > 0 ? (
        <div className="space-y-2">
          {filteredTransactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        /* Empty State */
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <ReceiptText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">
            No hisab recorded yet
          </h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
            Tap Add Income or Add Expense to log your transactions. They are saved automatically on your device.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onOpenAddModal('income')}
              className="px-3.5 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs transition-colors cursor-pointer"
            >
              + Add Income
            </button>
            <button
              type="button"
              onClick={() => onOpenAddModal('expense')}
              className="px-3.5 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition-colors cursor-pointer"
            >
              - Add Expense
            </button>
            <button
              type="button"
              onClick={onLoadSamples}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs transition-colors cursor-pointer"
            >
              Load Sample Data
            </button>
          </div>
        </div>
      ) : (
        /* Filter/Search empty state */
        <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
          No transactions match your search or filter.
        </div>
      )}
    </section>
  );
};
