import React from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { Transaction } from '../types';
import { getCategoryMeta } from '../constants/categories';
import { formatDisplayDate, formatINR } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onDelete,
  onEdit,
}) => {
  const isIncome = transaction.type === 'income';
  const categoryMeta = getCategoryMeta(transaction.category, transaction.type);

  return (
    <div
      id={`transaction-item-${transaction.id}`}
      className="flex items-center justify-between p-3 sm:p-3.5 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200/80 transition-all group"
    >
      {/* Left info */}
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${categoryMeta.bgColor}`}
        >
          <CategoryIcon name={categoryMeta.iconName} className={`w-5 h-5 ${categoryMeta.color}`} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-semibold text-slate-900 truncate">
              {transaction.category}
            </h4>
            {categoryMeta.hindiLabel && (
              <span className="text-[10px] font-medium text-slate-400">
                ({categoryMeta.hindiLabel})
              </span>
            )}
          </div>

          {transaction.note && (
            <p className="text-xs text-slate-600 truncate mt-0.5">
              {transaction.note}
            </p>
          )}

          <div className="text-[11px] font-medium text-slate-400 mt-0.5">
            {formatDisplayDate(transaction.date)}
          </div>
        </div>
      </div>

      {/* Right amount & edit / delete actions */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <div
            className={`text-sm sm:text-base font-bold tracking-tight ${
              isIncome ? 'text-emerald-600' : 'text-slate-900'
            }`}
          >
            {isIncome ? '+' : '-'}{formatINR(transaction.amount)}
          </div>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded ${
              isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {isIncome ? 'Income' : 'Expense'}
          </span>
        </div>

        <div className="flex items-center gap-1 ml-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(transaction)}
              title="Edit entry"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Edit transaction"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(transaction.id)}
            title="Delete entry"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            aria-label="Delete transaction"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

