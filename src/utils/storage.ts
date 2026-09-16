import { Transaction, UdharRecord } from '../types';
import { getTodayDateString } from './formatters';

const STORAGE_KEY = 'hisab_app_transactions_v1';
const UDHAR_STORAGE_KEY = 'hisab_app_udhar_v1';

export function loadTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // Provide clean initial realistic sample data for Indian context
      const initial = getSampleTransactions();
      saveTransactions(initial);
      return initial;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to load transactions from localStorage', err);
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions to localStorage', err);
  }
}

export function loadUdharRecords(): UdharRecord[] {
  try {
    const data = localStorage.getItem(UDHAR_STORAGE_KEY);
    if (!data) {
      const initial = getSampleUdharRecords();
      saveUdharRecords(initial);
      return initial;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to load udhar records from localStorage', err);
    return [];
  }
}

export function saveUdharRecords(records: UdharRecord[]): void {
  try {
    localStorage.setItem(UDHAR_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save udhar records to localStorage', err);
  }
}

export function getSampleUdharRecords(): UdharRecord[] {
  const today = getTodayDateString();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;

  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 5);
  const lastWeekStr = `${lastWeek.getFullYear()}-${String(lastWeek.getMonth() + 1).padStart(2, '0')}-${String(lastWeek.getDate()).padStart(2, '0')}`;

  return [
    {
      id: 'udhar-1',
      personName: 'Ramesh Sharma',
      amount: 2500,
      type: 'gave', // I gave -> You will get
      date: lastWeekStr,
      dueDate: nextWeekStr,
      note: 'Emergency cash for medicine',
      status: 'pending',
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'udhar-2',
      personName: 'Suresh Verma',
      amount: 800,
      type: 'took', // I took -> You have to give
      date: today,
      dueDate: nextWeekStr,
      note: 'Lunch bill split',
      status: 'pending',
      createdAt: Date.now() - 3600000 * 5,
    },
    {
      id: 'udhar-3',
      personName: 'Pooja Patel',
      amount: 1200,
      type: 'gave',
      date: lastWeekStr,
      note: 'Shared cab travel to airport',
      status: 'paid',
      createdAt: Date.now() - 86400000 * 7,
      paidAt: Date.now() - 86400000,
    },
  ];
}

export function getSampleTransactions(): Transaction[] {
  const today = getTodayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  return [
    {
      id: 'sample-1',
      type: 'income',
      amount: 45000,
      category: 'Salary',
      date: yStr,
      note: 'Monthly salary credited',
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'sample-2',
      type: 'expense',
      amount: 3200,
      category: 'Groceries & Ration',
      date: yStr,
      note: 'D-Mart monthly ration',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'sample-3',
      type: 'expense',
      amount: 140,
      category: 'Chai & Snacks',
      date: today,
      note: 'Evening tea with samosa',
      createdAt: Date.now() - 3600000 * 4,
    },
    {
      id: 'sample-4',
      type: 'expense',
      amount: 799,
      category: 'Bills & Recharge',
      date: today,
      note: 'Jio fiber broadband bill',
      createdAt: Date.now() - 3600000 * 2,
    },
  ];
}
