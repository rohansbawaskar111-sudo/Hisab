import React, { useState, useEffect } from 'react';
import { X, Calendar, User, FileText, Check, Clock } from 'lucide-react';
import { UdharRecord, UdharType, UdharStatus } from '../types';
import { getTodayDateString } from '../utils/formatters';

interface UdharModalProps {
  isOpen: boolean;
  editingRecord?: UdharRecord | null;
  onClose: () => void;
  onSave: (record: Omit<UdharRecord, 'id' | 'createdAt' | 'paidAt'>) => void;
}

export const UdharModal: React.FC<UdharModalProps> = ({
  isOpen,
  editingRecord,
  onClose,
  onSave,
}) => {
  const [personName, setPersonName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<UdharType>('gave');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [dueDate, setDueDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [status, setStatus] = useState<UdharStatus>('pending');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        setPersonName(editingRecord.personName);
        setAmount(editingRecord.amount.toString());
        setType(editingRecord.type);
        setDate(editingRecord.date);
        setDueDate(editingRecord.dueDate || '');
        setNote(editingRecord.note || '');
        setStatus(editingRecord.status);
      } else {
        setPersonName('');
        setAmount('');
        setType('gave');
        setDate(getTodayDateString());
        setDueDate('');
        setNote('');
        setStatus('pending');
      }
      setError('');
    }
  }, [isOpen, editingRecord]);

  const handleSetQuickDueDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDueDate(`${year}-${month}-${day}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!personName.trim()) {
      setError('Please enter the person\'s name');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!date) {
      setError('Please select a date');
      return;
    }

    onSave({
      personName: personName.trim(),
      amount: numAmount,
      type,
      date,
      dueDate: dueDate || undefined,
      note: note.trim() || undefined,
      status,
    });

    onClose();
  };

  if (!isOpen) return null;

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
                type === 'gave' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <h2 className="text-lg font-bold text-slate-900">
              {editingRecord ? 'Edit Udhar &bull; उधार बदलें' : 'Add Udhar &bull; उधार जोड़ें'}
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
          {/* 3. Select "I Gave" or "I Took" */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Udhar Type &bull; प्रकार *
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setType('gave')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  type === 'gave'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div>I Gave (मैंने दिए)</div>
                <div className={`text-[10px] ${type === 'gave' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  You will get back
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('took')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  type === 'took'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div>I Took (मैंने लिए)</div>
                <div className={`text-[10px] ${type === 'took' ? 'text-rose-100' : 'text-slate-400'}`}>
                  You have to pay
                </div>
              </button>
            </div>
          </div>

          {/* 1. Add Person Name */}
          <div>
            <label
              htmlFor="udhar-person"
              className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              Person Name &bull; नाम *
            </label>
            <input
              id="udhar-person"
              type="text"
              placeholder="e.g., Ramesh Sharma, Sharma Kirana Store"
              value={personName}
              onChange={(e) => {
                setPersonName(e.target.value);
                setError('');
              }}
              autoFocus
              className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800"
            />
          </div>

          {/* 2. Add Amount */}
          <div>
            <label
              htmlFor="udhar-amount"
              className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5"
            >
              Amount &bull; राशि (₹) *
            </label>
            <div className="relative rounded-xl border border-slate-300 focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-800/20 transition-all bg-white overflow-hidden">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-xl">
                ₹
              </div>
              <input
                id="udhar-amount"
                type="number"
                step="any"
                min="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className="w-full pl-9 pr-4 py-3 text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none"
              />
            </div>
          </div>

          {/* 4. Add Date */}
          <div>
            <label
              htmlFor="udhar-date"
              className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Date &bull; तारीख *
            </label>
            <input
              id="udhar-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800"
            />
          </div>

          {/* 5. Add Due Date */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="udhar-duedate"
                className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Due Date &bull; वापस करने की तारीख (Optional)
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleSetQuickDueDate(7)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  +1 Week
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDueDate(30)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  +1 Month
                </button>
              </div>
            </div>
            <input
              id="udhar-duedate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800"
            />
          </div>

          {/* 6. Add Note */}
          <div>
            <label
              htmlFor="udhar-note"
              className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Note &bull; विवरण (Optional)
            </label>
            <input
              id="udhar-note"
              type="text"
              placeholder="e.g., For shop renovation, Emergency medical help"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={80}
              className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800"
            />
          </div>

          {/* 7. Status */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Initial Status &bull; स्थिति
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  status === 'pending'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending (बाकी)
              </button>
              <button
                type="button"
                onClick={() => setStatus('paid')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  status === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Already Paid (चुकाया गया)
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-save-udhar"
              type="submit"
              className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                type === 'gave'
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                  : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {editingRecord
                  ? 'Update Udhar Entry (अपडेट करें)'
                  : 'Save Udhar Entry (उधार दर्ज करें)'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
