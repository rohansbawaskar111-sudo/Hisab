import React from 'react';
import { Plus, Minus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface ActionButtonsProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onAddIncome,
  onAddExpense,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 my-4">
      <button
        id="btn-add-income"
        type="button"
        onClick={onAddIncome}
        className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center">
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
        </div>
        <span>Add Income</span>
      </button>

      <button
        id="btn-add-expense"
        type="button"
        onClick={onAddExpense}
        className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
      >
        <div className="w-5 h-5 rounded-full bg-rose-500/30 flex items-center justify-center">
          <Minus className="w-3.5 h-3.5 stroke-[3]" />
        </div>
        <span>Add Expense</span>
      </button>
    </div>
  );
};
