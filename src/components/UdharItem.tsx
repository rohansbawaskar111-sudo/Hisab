import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  AlertCircle,
  RotateCcw,
  Edit2,
} from 'lucide-react';
import { UdharRecord } from '../types';
import { formatDisplayDate, formatINR, getTodayDateString } from '../utils/formatters';

interface UdharItemProps {
  record: UdharRecord;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (record: UdharRecord) => void;
}

export const UdharItem: React.FC<UdharItemProps> = ({
  record,
  onToggleStatus,
  onDelete,
  onEdit,
}) => {
  const isGave = record.type === 'gave'; // I Gave -> You Get
  const isPaid = record.status === 'paid';
  const today = getTodayDateString();
  const isOverdue = !isPaid && record.dueDate && record.dueDate < today;

  return (
    <div
      id={`udhar-item-${record.id}`}
      className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
        isPaid
          ? 'bg-slate-50/70 border-slate-200/70 opacity-80'
          : isOverdue
          ? 'bg-amber-50/40 border-amber-300 shadow-xs'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Person Info & Direction */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isGave
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}
          >
            {isGave ? (
              <ArrowDownLeft className="w-5 h-5" />
            ) : (
              <ArrowUpRight className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {record.personName}
              </h4>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isGave
                    ? 'bg-emerald-100/70 text-emerald-800'
                    : 'bg-rose-100/70 text-rose-800'
                }`}
              >
                {isGave ? 'You Get (लेना है)' : 'You Give (देना है)'}
              </span>
            </div>

            {record.note && (
              <p className="text-xs text-slate-600 truncate mt-0.5">
                {record.note}
              </p>
            )}

            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {isGave ? 'Gave on' : 'Took on'} {formatDisplayDate(record.date)}
              </span>

              {record.dueDate && !isPaid && (
                <span
                  className={`flex items-center gap-1 font-medium ${
                    isOverdue ? 'text-amber-700 font-semibold' : 'text-slate-500'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Due: {formatDisplayDate(record.dueDate)}
                  {isOverdue && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                      Overdue
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Amount & Status Badge */}
        <div className="text-right shrink-0">
          <div
            className={`text-base sm:text-lg font-extrabold tracking-tight ${
              isPaid
                ? 'line-through text-slate-400'
                : isGave
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            {formatINR(record.amount)}
          </div>

          <div className="mt-1">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isPaid
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isPaid ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Paid
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-amber-600" />
                  Pending
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggleStatus(record.id)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            isPaid
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
          }`}
        >
          {isPaid ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              Mark as Pending
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              Mark as Paid (चुकाया)
            </>
          )}
        </button>

        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(record)}
              title="Edit Udhar entry"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Edit udhar"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(record.id)}
            title="Delete Udhar entry"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            aria-label="Delete udhar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
