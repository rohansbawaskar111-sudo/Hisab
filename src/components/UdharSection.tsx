import React, { useState, useMemo } from 'react';
import { Plus, Search, Users, Scale } from 'lucide-react';
import { UdharRecord, UdharFilterType } from '../types';
import { UdharSummaryCard } from './UdharSummaryCard';
import { UdharItem } from './UdharItem';

interface UdharSectionProps {
  records: UdharRecord[];
  onOpenAddModal: () => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (record: UdharRecord) => void;
  onLoadSampleUdhar: () => void;
}

export const UdharSection: React.FC<UdharSectionProps> = ({
  records,
  onOpenAddModal,
  onToggleStatus,
  onDelete,
  onEdit,
  onLoadSampleUdhar,
}) => {
  const [filter, setFilter] = useState<UdharFilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate totals:
  // "You Get" = sum of pending records where type === 'gave'
  // "You Give" = sum of pending records where type === 'took'
  const { totalYouGet, totalYouGive, pendingCount } = useMemo(() => {
    let youGet = 0;
    let youGive = 0;
    let pending = 0;

    for (const r of records) {
      if (r.status === 'pending') {
        pending++;
        if (r.type === 'gave') {
          youGet += r.amount;
        } else if (r.type === 'took') {
          youGive += r.amount;
        }
      }
    }

    return {
      totalYouGet: youGet,
      totalYouGive: youGive,
      pendingCount: pending,
    };
  }, [records]);

  // Sort: Pending first (urgent/overdue at top), then paid
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      // Pending first
      if (a.status !== b.status) {
        return a.status === 'pending' ? -1 : 1;
      }
      // If both pending and have due dates, sort by due date ascending
      if (a.status === 'pending' && b.status === 'pending') {
        if (a.dueDate && b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
      }
      return b.createdAt - a.createdAt;
    });
  }, [records]);

  // Filter based on active filter tab and search
  const filteredRecords = useMemo(() => {
    return sortedRecords.filter((record) => {
      let matchesFilter = true;
      if (filter === 'you_get') {
        matchesFilter = record.type === 'gave';
      } else if (filter === 'you_give') {
        matchesFilter = record.type === 'took';
      } else if (filter === 'pending') {
        matchesFilter = record.status === 'pending';
      } else if (filter === 'paid') {
        matchesFilter = record.status === 'paid';
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        record.personName.toLowerCase().includes(q) ||
        (record.note && record.note.toLowerCase().includes(q)) ||
        record.amount.toString().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [sortedRecords, filter, searchQuery]);

  return (
    <div id="udhar-section-container" className="space-y-4">
      {/* 8. Show total "You Give" and "You Get" */}
      <UdharSummaryCard
        totalYouGet={totalYouGet}
        totalYouGive={totalYouGive}
        pendingCount={pendingCount}
      />

      {/* Prominent Action Button: Add Udhar */}
      <div className="my-3">
        <button
          id="btn-add-udhar-trigger"
          type="button"
          onClick={onOpenAddModal}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>Add New Udhar &bull; नया उधार जोड़ें</span>
        </button>
      </div>

      {/* Filter Chips and Search */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('you_get')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'you_get'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              You Get (लेना है)
            </button>
            <button
              type="button"
              onClick={() => setFilter('you_give')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'you_give'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              You Give (देना है)
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'pending'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('paid')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filter === 'paid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Paid
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {records.length > 2 && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by person name, note, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-400"
            />
          </div>
        )}
      </div>

      {/* 11. Show all udhar records in a clean list */}
      <div className="space-y-2.5 pt-1">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <UdharItem
              key={record.id}
              record={record}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))
        ) : records.length === 0 ? (
          /* Empty State */
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              No Udhar records yet
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
              Keep track of money you gave to friends or took from someone. Never forget a repayment.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onOpenAddModal}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                + Add First Udhar
              </button>
              <button
                type="button"
                onClick={onLoadSampleUdhar}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Load Sample Udhar
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
            No udhar records match your current filter or search.
          </div>
        )}
      </div>
    </div>
  );
};
