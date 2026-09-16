import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction, UdharRecord, UserProfile } from '../types';

/**
 * User Profile Firestore operations
 */
export async function syncUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  const now = Date.now();
  if (snap.exists()) {
    const existing = snap.data() as UserProfile;
    const updated: UserProfile = {
      ...existing,
      email: user.email ?? existing.email,
      displayName: user.displayName ?? existing.displayName,
      photoURL: user.photoURL ?? existing.photoURL,
      lastLoginAt: now,
    };
    await setDoc(userRef, updated, { merge: true });
    return updated;
  } else {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL,
      currency: 'INR',
      createdAt: now,
      lastLoginAt: now,
    };
    await setDoc(userRef, profile);
    return profile;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
}

/**
 * Realtime Transactions Listener
 * Strictly scoped to /users/{userId}/transactions
 */
export function subscribeUserTransactions(
  userId: string,
  onData: (transactions: Transaction[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const txRef = collection(db, 'users', userId, 'transactions');
  const q = query(txRef, orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          type: data.type,
          amount: data.amount,
          category: data.category,
          date: data.date,
          note: data.note,
          createdAt: data.createdAt ?? 0,
          updatedAt: data.updatedAt,
        });
      });
      // Sort in memory as secondary key (createdAt desc)
      items.sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return b.createdAt - a.createdAt;
      });
      onData(items);
    },
    (err) => {
      console.error('Error fetching transactions:', err);
      onError(err);
    }
  );
}

export async function addCloudTransaction(
  userId: string,
  tx: Omit<Transaction, 'id' | 'createdAt'>
): Promise<string> {
  const txRef = collection(db, 'users', userId, 'transactions');
  const docData = {
    ...tx,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const docSnap = await addDoc(txRef, docData);
  return docSnap.id;
}

export async function updateCloudTransaction(
  userId: string,
  txId: string,
  tx: Partial<Omit<Transaction, 'id' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'transactions', txId);
  await updateDoc(docRef, {
    ...tx,
    updatedAt: Date.now(),
  });
}

export async function deleteCloudTransaction(
  userId: string,
  txId: string
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'transactions', txId);
  await deleteDoc(docRef);
}

/**
 * Realtime Udhar (Credit/Debt) Listener
 * Strictly scoped to /users/{userId}/udhar
 */
export function subscribeUserUdhar(
  userId: string,
  onData: (records: UdharRecord[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const udharRef = collection(db, 'users', userId, 'udhar');
  const q = query(udharRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: UdharRecord[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          personName: data.personName,
          amount: data.amount,
          type: data.type,
          date: data.date,
          dueDate: data.dueDate,
          note: data.note,
          status: data.status,
          createdAt: data.createdAt ?? 0,
          paidAt: data.paidAt,
          updatedAt: data.updatedAt,
        });
      });
      onData(items);
    },
    (err) => {
      console.error('Error fetching udhar records:', err);
      onError(err);
    }
  );
}

export async function addCloudUdhar(
  userId: string,
  record: Omit<UdharRecord, 'id' | 'createdAt' | 'paidAt'>
): Promise<string> {
  const udharRef = collection(db, 'users', userId, 'udhar');
  const docData = {
    ...record,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    paidAt: record.status === 'paid' ? Date.now() : null,
  };
  const docSnap = await addDoc(udharRef, docData);
  return docSnap.id;
}

export async function updateCloudUdhar(
  userId: string,
  udharId: string,
  updates: Partial<Omit<UdharRecord, 'id' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'udhar', udharId);
  const dataToUpdate: Record<string, any> = {
    ...updates,
    updatedAt: Date.now(),
  };
  if (updates.status === 'paid') {
    dataToUpdate.paidAt = Date.now();
  } else if (updates.status === 'pending') {
    dataToUpdate.paidAt = null;
  }
  await updateDoc(docRef, dataToUpdate);
}

export async function deleteCloudUdhar(
  userId: string,
  udharId: string
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'udhar', udharId);
  await deleteDoc(docRef);
}

/**
 * Migration Helper:
 * If user has local storage data from prototype and cloud database has 0 records,
 * seamlessly seed or migrate user's local data to their private cloud account!
 */
export async function migrateLocalDataToCloud(
  userId: string,
  localTransactions: Transaction[],
  localUdhar: UdharRecord[]
): Promise<{ migratedTx: number; migratedUdhar: number }> {
  let migratedTx = 0;
  let migratedUdhar = 0;

  // Check if cloud already has records
  const txRef = collection(db, 'users', userId, 'transactions');
  const txSnap = await getDocs(txRef);

  if (txSnap.empty && localTransactions.length > 0) {
    for (const tx of localTransactions) {
      await addCloudTransaction(userId, {
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        date: tx.date,
        note: tx.note,
      });
      migratedTx++;
    }
  }

  const udharRef = collection(db, 'users', userId, 'udhar');
  const udharSnap = await getDocs(udharRef);

  if (udharSnap.empty && localUdhar.length > 0) {
    for (const u of localUdhar) {
      await addCloudUdhar(userId, {
        personName: u.personName,
        amount: u.amount,
        type: u.type,
        date: u.date,
        dueDate: u.dueDate,
        note: u.note,
        status: u.status,
      });
      migratedUdhar++;
    }
  }

  return { migratedTx, migratedUdhar };
}
