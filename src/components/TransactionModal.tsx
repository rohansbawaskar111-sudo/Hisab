import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, FileText, Check, Plus } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../constants/categories';
import { getTodayDateString } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TransactionModalProps {
  isOpen: boolean;
  initialType: TransactionType;
  editingTransaction?: Transaction | null;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  initialType,
  editingTransaction,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Synchronize with initialType or editingTransaction whenever opened
  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setType(editingTransaction.type);
        setAmount(editingTransaction.amount.toString());
        setDate(editingTransaction.date);
        setNote(editingTransaction.note || '');

        // Check if category matches standard categories
        const defaultCats =
          editingTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        const exists = defaultCats.some((c) => c.label === editingTransaction.category);
        if (exists) {
          setSelectedCategory(editingTransaction.category);
          setIsCustomCategory(false);
          setCustomCategory('');
        } else {
          setIsCustomCategory(true);
          setCustomCategory(editingTransaction.category);
        }
      } else {
        setType(initialType);
        setAmount('');
        const defaultCategories = initialType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        setSelectedCategory(defaultCategories[0].label);
        setIsCustomCategory(false);
        setCustomCategory('');
        setDate(getTodayDateString());
        setNote('');
      }
      setError('');
    }
  }, [isOpen, initialType, editingTransaction]);

  // When type changes inside modal, adjust default category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const defaultCategories = newType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setSelectedCategory(defaultCategories[0].label);
    setIsCustomCategory(false);
    setCustomCategory('');
  };

  const handleSetQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDate(`${year}-${month}-${day}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    const finalCategory = isCustomCategory
      ? customCategory.trim() || (type === 'income' ? 'Other Income' : 'Other Expense')
      : selectedCategory;

    if (!finalCategory) {
      setError('Please select or specify a category');
      return;
    }

    if (!date) {
      setError('Please choose a date');
      return;
    }

    onSave({
      type,
      amount: numAmount,
      category: finalCategory,
      date,
      note: note.trim(),
    });

    onClose();
  };

  if (!isOpen) return null;

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const isIncome = type === 'income';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isIncome ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <h2 className="text-lg font-bold text-slate-900">
              {editingTransaction
                ? 'Edit Transaction (हिसाब बदलें)'
                : isIncome
                ? 'Add Income (आय जोड़ें)'
                : 'Add Expense (खर्च जोड़ें)'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
          {/* Segmented control for Income vs Expense */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isIncome
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense (- खर्च)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isIncome
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income (+ आय)
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label
              htmlFor="tx-amount"
              className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5"
            >
              Amount &bull; राशि (₹) *
            </label>
            <div className="relative rounded-xl border border-slate-300 focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-800/20 transition-all bg-white overflow-hidden">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-xl">
                ₹
              </div>
              <input
                id="tx-amount"
                type="number"
                step="any"
                min="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                autoFocus
                className="w-full pl-9 pr-4 py-3 text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                Category &bull; श्रेणी *
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
              {categories.map((cat) => {
                const isSelected = !isCustomCategory && selectedCategory === cat.label;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(false);
                      setSelectedCategory(cat.label);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border text-xs cursor-pointer ${
                      isSelected
                        ? `${cat.bgColor} font-semibold ring-2 ring-emerald-600 ring-offset-1 text-slate-900`
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-white shadow-xs' : 'bg-slate-100'
                      }`}
                    >
                      <CategoryIcon name={cat.iconName} className={`w-4 h-4 ${cat.color}`} />
                    </div>
                    <div className="truncate">
                      <div className="truncate font-medium">{cat.label}</div>
                      {cat.hindiLabel && (
                        <div className="text-[10px] text-slate-400 truncate">{cat.hindiLabel}</div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Custom Category Button */}
              <button
                type="button"
                onClick={() => setIsCustomCategory(true)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border text-xs cursor-pointer ${
                  isCustomCategory
                    ? 'bg-slate-900 border-slate-900 text-white ring-2 ring-slate-800'
                    : 'bg-white border-dashed border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isCustomCategory ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </div>
                <div className="truncate font-medium">Custom / अन्य</div>
              </button>
            </div>

            {/* If custom category selected, display text field */}
            {isCustomCategory && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Enter custom category name (e.g., Petrol, Diwali bonus)"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            )}
          </div>

          {/* Date Picker with Quick Selects */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="tx-date"
                className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Date &bull; तारीख *
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(0)}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(1)}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800"
            />
          </div>

          {/* Note Input */}
          <div>
            <label
              htmlFor="tx-note"
              className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5"
            >
              Note &bull; विवरण (Optional)
            </label>
            <div className="relative">
              <input
                id="tx-note"
                type="text"
                placeholder="e.g., D-Mart ration, Chai tapri, Monthly bonus"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={80}
                className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800"
              />
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-save-transaction"
              type="submit"
              className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isIncome
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                  : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {editingTransaction
                  ? 'Update Transaction (अपडेट करें)'
                  : isIncome
                  ? 'Save Income (आय दर्ज करें)'
                  : 'Save Expense (खर्च दर्ज करें)'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
