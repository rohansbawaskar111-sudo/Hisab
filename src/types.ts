export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface CategoryOption {
  id: string;
  label: string;
  hindiLabel?: string;
  iconName: string;
  color: string;
  bgColor: string;
  type: TransactionType;
}

export type FilterType = 'all' | 'income' | 'expense';

export type UdharType = 'gave' | 'took'; // 'gave' = I Gave (You will get), 'took' = I Took (You will give)
export type UdharStatus = 'pending' | 'paid';

export interface UdharRecord {
  id: string;
  personName: string;
  amount: number;
  type: UdharType;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  note?: string;
  status: UdharStatus;
  createdAt: number;
  paidAt?: number;
  updatedAt?: number;
}

export type UdharFilterType = 'all' | 'you_get' | 'you_give' | 'pending' | 'paid';

export type ActiveTab = 'hisab' | 'udhar';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  currency?: string;
  createdAt: number;
  lastLoginAt: number;
}
