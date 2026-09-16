/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Transaction,
  TransactionType,
  UdharRecord,
  ActiveTab,
} from './types';
import {
  loadTransactions,
  saveTransactions,
  getSampleTransactions,
  loadUdharRecords,
  saveUdharRecords,
  getSampleUdharRecords,
} from './utils/storage';
import {
  subscribeUserTransactions,
  subscribeUserUdhar,
  addCloudTransaction,
  updateCloudTransaction,
  deleteCloudTransaction,
  addCloudUdhar,
  updateCloudUdhar,
  deleteCloudUdhar,
  migrateLocalDataToCloud,
} from './services/db';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { SummaryCard } from './components/SummaryCard';
import { ActionButtons } from './components/ActionButtons';
import { RecentTransactions } from './components/RecentTransactions';
import { TransactionModal } from './components/TransactionModal';
import { UdharSection } from './components/UdharSection';
import { UdharModal } from './components/UdharModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { ConfirmModal } from './components/ConfirmModal';
import { Cloud, LogIn, Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const { currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('hisab');

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return loadTransactions();
  });
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Udhar state
  const [udharRecords, setUdharRecords] = useState<UdharRecord[]>(() => {
    return loadUdharRecords();
  });
  const [isUdharModalOpen, setIsUdharModalOpen] = useState<boolean>(false);
  const [editingUdharRecord, setEditingUdharRecord] = useState<UdharRecord | null>(null);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'transaction' | 'udhar' | 'reset';
    id?: string;
    title: string;
    message: string;
  } | null>(null);

  // Sync / Cloud state
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const migratedUserRef = useRef<string | null>(null);

  // Synchronize with Firebase Firestore when user is logged in
  useEffect(() => {
    if (!currentUser) {
      // Load from local storage for guests
      setTransactions(loadTransactions());
      setUdharRecords(loadUdharRecords());
      setIsCloudLoading(false);
      return;
    }

    setIsCloudLoading(true);
    setSyncError(null);

    // Auto-migrate local data if user has local items and hasn't migrated in this session
    if (migratedUserRef.current !== currentUser.uid) {
      const localTx = loadTransactions();
      const localUdhar = loadUdharRecords();
      if (localTx.length > 0 || localUdhar.length > 0) {
        migrateLocalDataToCloud(currentUser.uid, localTx, localUdhar)
          .then(({ migratedTx, migratedUdhar }) => {
            if (migratedTx > 0 || migratedUdhar > 0) {
              console.log(`Migrated ${migratedTx} transactions and ${migratedUdhar} udhar records to cloud.`);
            }
          })
          .catch((err) => console.error('Auto-migration warning:', err));
      }
      migratedUserRef.current = currentUser.uid;
    }

    // Subscribe to Firestore transactions
    const unsubTx = subscribeUserTransactions(
      currentUser.uid,
      (data) => {
        setTransactions(data);
        setIsCloudLoading(false);
      },
      (err) => {
        console.error('Firestore transactions error:', err);
        setSyncError('Could not sync transactions from cloud.');
        setIsCloudLoading(false);
      }
    );

    // Subscribe to Firestore udhar
    const unsubUdhar = subscribeUserUdhar(
      currentUser.uid,
      (data) => {
        setUdharRecords(data);
        setIsCloudLoading(false);
      },
      (err) => {
        console.error('Firestore udhar error:', err);
        setSyncError('Could not sync udhar records from cloud.');
        setIsCloudLoading(false);
      }
    );

    return () => {
      unsubTx();
      unsubUdhar();
    };
  }, [currentUser]);

  // Persist locally for guest users only
  useEffect(() => {
    if (!currentUser) {
      saveTransactions(transactions);
    }
  }, [transactions, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      saveUdharRecords(udharRecords);
    }
  }, [udharRecords, currentUser]);

  // Calculations for Income & Expense
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        income += tx.amount;
      } else if (tx.type === 'expense') {
        expense += tx.amount;
      }
    }

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [transactions]);

  // Pending Udhar count for header badge
  const pendingUdharCount = useMemo(() => {
    return udharRecords.filter((r) => r.status === 'pending').length;
  }, [udharRecords]);

  // Transaction Actions
  const handleOpenAddTx = (type: TransactionType) => {
    setEditingTransaction(null);
    setModalType(type);
    setIsTxModalOpen(true);
  };

  const handleEditTx = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalType(tx.type);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id' | 'createdAt'>
  ) => {
    if (currentUser) {
      try {
        if (editingTransaction) {
          await updateCloudTransaction(currentUser.uid, editingTransaction.id, txData);
        } else {
          await addCloudTransaction(currentUser.uid, txData);
        }
      } catch (err) {
        console.error('Failed to save transaction to cloud:', err);
        setSyncError('Failed to save to cloud. Please check connection.');
      }
    } else {
      // Local fallback for guest
      if (editingTransaction) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === editingTransaction.id
              ? { ...t, ...txData, updatedAt: Date.now() }
              : t
          )
        );
      } else {
        const newTx: Transaction = {
          ...txData,
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: Date.now(),
        };
        setTransactions((prev) => [newTx, ...prev]);
      }
    }
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirmDelete({
      type: 'transaction',
      id,
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction record? This cannot be undone.',
    });
  };

  // Udhar Actions
  const handleOpenAddUdhar = () => {
    setEditingUdharRecord(null);
    setIsUdharModalOpen(true);
  };

  const handleEditUdhar = (record: UdharRecord) => {
    setEditingUdharRecord(record);
    setIsUdharModalOpen(true);
  };

  const handleSaveUdhar = async (
    recordData: Omit<UdharRecord, 'id' | 'createdAt' | 'paidAt'>
  ) => {
    if (currentUser) {
      try {
        if (editingUdharRecord) {
          await updateCloudUdhar(currentUser.uid, editingUdharRecord.id, recordData);
        } else {
          await addCloudUdhar(currentUser.uid, recordData);
        }
      } catch (err) {
        console.error('Failed to save udhar to cloud:', err);
        setSyncError('Failed to save udhar to cloud.');
      }
    } else {
      // Local fallback
      if (editingUdharRecord) {
        setUdharRecords((prev) =>
          prev.map((u) =>
            u.id === editingUdharRecord.id
              ? {
                  ...u,
                  ...recordData,
                  updatedAt: Date.now(),
                  paidAt: recordData.status === 'paid' ? (u.paidAt || Date.now()) : undefined,
                }
              : u
          )
        );
      } else {
        const newRecord: UdharRecord = {
          ...recordData,
          id: `udhar-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: Date.now(),
          paidAt: recordData.status === 'paid' ? Date.now() : undefined,
        };
        setUdharRecords((prev) => [newRecord, ...prev]);
      }
    }
    setEditingUdharRecord(null);
  };

  const handleToggleUdharStatus = async (id: string) => {
    const existing = udharRecords.find((r) => r.id === id);
    if (!existing) return;

    const nextStatus = existing.status === 'pending' ? 'paid' : 'pending';

    if (currentUser) {
      try {
        await updateCloudUdhar(currentUser.uid, id, { status: nextStatus });
      } catch (err) {
        console.error('Failed to toggle udhar status in cloud:', err);
        setSyncError('Failed to update status.');
      }
    } else {
      setUdharRecords((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              status: nextStatus,
              paidAt: nextStatus === 'paid' ? Date.now() : undefined,
            };
          }
          return item;
        })
      );
    }
  };

  const handleDeleteUdhar = (id: string) => {
    setConfirmDelete({
      type: 'udhar',
      id,
      title: 'Delete Udhar Record',
      message: 'Are you sure you want to delete this credit/debt entry? This action is permanent.',
    });
  };

  // Sample data loaders
  const handleLoadSampleTransactions = async () => {
    const samples = getSampleTransactions();
    if (currentUser) {
      for (const s of samples) {
        await addCloudTransaction(currentUser.uid, {
          type: s.type,
          amount: s.amount,
          category: s.category,
          date: s.date,
          note: s.note,
        });
      }
    } else {
      setTransactions(samples);
      saveTransactions(samples);
    }
  };

  const handleLoadSampleUdhar = async () => {
    const samples = getSampleUdharRecords();
    if (currentUser) {
      for (const s of samples) {
        await addCloudUdhar(currentUser.uid, {
          personName: s.personName,
          amount: s.amount,
          type: s.type,
          date: s.date,
          dueDate: s.dueDate,
          note: s.note,
          status: s.status,
        });
      }
    } else {
      setUdharRecords(samples);
      saveUdharRecords(samples);
    }
  };

  const handleResetData = () => {
    setConfirmDelete({
      type: 'reset',
      title: 'Reset All Sample Data',
      message: currentUser
        ? 'Populate your cloud account with default Indian sample transactions and udhar records?'
        : 'Reset local data with default Indian sample records?',
    });
  };

  const executeConfirmAction = async () => {
    if (!confirmDelete) return;

    if (confirmDelete.type === 'transaction' && confirmDelete.id) {
      if (currentUser) {
        try {
          await deleteCloudTransaction(currentUser.uid, confirmDelete.id);
        } catch (err) {
          console.error('Failed to delete cloud transaction:', err);
        }
      } else {
        setTransactions((prev) => prev.filter((tx) => tx.id !== confirmDelete.id));
      }
    } else if (confirmDelete.type === 'udhar' && confirmDelete.id) {
      if (currentUser) {
        try {
          await deleteCloudUdhar(currentUser.uid, confirmDelete.id);
        } catch (err) {
          console.error('Failed to delete cloud udhar:', err);
        }
      } else {
        setUdharRecords((prev) => prev.filter((item) => item.id !== confirmDelete.id));
      }
    } else if (confirmDelete.type === 'reset') {
      const sampleTx = getSampleTransactions();
      const sampleUdhar = getSampleUdharRecords();
      if (currentUser) {
        // Add sample records to user's cloud account
        for (const s of sampleTx.slice(0, 3)) {
          await addCloudTransaction(currentUser.uid, {
            type: s.type,
            amount: s.amount,
            category: s.category,
            date: s.date,
            note: s.note,
          });
        }
        for (const u of sampleUdhar.slice(0, 2)) {
          await addCloudUdhar(currentUser.uid, {
            personName: u.personName,
            amount: u.amount,
            type: u.type,
            date: u.date,
            dueDate: u.dueDate,
            note: u.note,
            status: u.status,
          });
        }
      } else {
        setTransactions(sampleTx);
        setUdharRecords(sampleUdhar);
        saveTransactions(sampleTx);
        saveUdharRecords(sampleUdhar);
      }
    }

    setConfirmDelete(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-md animate-pulse">
            ₹
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading Hisab...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Header with Tab Switcher and Auth Status */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingUdharCount={pendingUdharCount}
        onResetData={handleResetData}
        hasTransactions={transactions.length > 0 || udharRecords.length > 0}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Cloud Sync Notice or Guest Banner */}
      {!currentUser && (
        <div className="w-full bg-emerald-50/90 border-b border-emerald-200/80 px-4 py-2.5">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-950 font-medium truncate">
                Sign in to sync your Hisab securely across all your devices
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <LogIn className="w-3 h-3" />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      )}

      {/* Sync Error Banner */}
      {syncError && (
        <div className="w-full bg-rose-50 border-b border-rose-200 px-4 py-2">
          <div className="max-w-xl mx-auto flex items-center justify-between text-xs text-rose-700 font-medium">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{syncError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              className="text-rose-500 hover:text-rose-800 underline font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Container - Optimized for mobile & desktop */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-4 sm:py-6">
        {isCloudLoading && (
          <div className="mb-4 flex items-center justify-center gap-2 p-2 bg-emerald-50/60 rounded-xl text-xs text-emerald-700 font-medium border border-emerald-100">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing cloud records...</span>
          </div>
        )}

        {activeTab === 'hisab' ? (
          <div>
            {/* 1. Balance Summary Card */}
            <SummaryCard
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              balance={balance}
            />

            {/* 2 & 3. Add Income & Add Expense Buttons */}
            <ActionButtons
              onAddIncome={() => handleOpenAddTx('income')}
              onAddExpense={() => handleOpenAddTx('expense')}
            />

            {/* 4. Recent Transactions Section with Edit & Delete */}
            <RecentTransactions
              transactions={transactions}
              onDelete={handleDeleteTransaction}
              onEdit={handleEditTx}
              onOpenAddModal={handleOpenAddTx}
              onLoadSamples={handleLoadSampleTransactions}
            />
          </div>
        ) : (
          /* Udhar Management Section */
          <UdharSection
            records={udharRecords}
            onOpenAddModal={handleOpenAddUdhar}
            onToggleStatus={handleToggleUdharStatus}
            onDelete={handleDeleteUdhar}
            onEdit={handleEditUdhar}
            onLoadSampleUdhar={handleLoadSampleUdhar}
          />
        )}
      </main>

      {/* Add / Edit Transaction Modal (Income / Expense) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        initialType={modalType}
        editingTransaction={editingTransaction}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
      />

      {/* Add / Edit Udhar Modal */}
      <UdharModal
        isOpen={isUdharModalOpen}
        editingRecord={editingUdharRecord}
        onClose={() => {
          setIsUdharModalOpen(false);
          setEditingUdharRecord(null);
        }}
        onSave={handleSaveUdhar}
      />

      {/* Auth Modal (Google Sign In & Email/Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Profile & Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        totalTransactionsCount={transactions.length}
        totalUdharCount={udharRecords.length}
      />

      {/* In-app Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title={confirmDelete?.title || 'Confirm Action'}
        message={confirmDelete?.message || 'Are you sure?'}
        confirmLabel={confirmDelete?.type === 'reset' ? 'Proceed' : 'Delete'}
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
