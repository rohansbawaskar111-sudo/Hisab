import { CategoryOption } from '../types';

export const EXPENSE_CATEGORIES: CategoryOption[] = [
  {
    id: 'groceries',
    label: 'Groceries & Ration',
    hindiLabel: 'किराना',
    iconName: 'ShoppingCart',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    type: 'expense',
  },
  {
    id: 'chai_snacks',
    label: 'Chai & Snacks',
    hindiLabel: 'चाय-नाश्ता',
    iconName: 'Coffee',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    type: 'expense',
  },
  {
    id: 'food_dining',
    label: 'Food & Dining',
    hindiLabel: 'खाना / होटल',
    iconName: 'Utensils',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 border-rose-200',
    type: 'expense',
  },
  {
    id: 'bills_recharge',
    label: 'Bills & Recharge',
    hindiLabel: 'बिजली / मोबाइल',
    iconName: 'Zap',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    type: 'expense',
  },
  {
    id: 'travel_fuel',
    label: 'Travel & Petrol',
    hindiLabel: 'पेट्रोल / ऑटो / बस',
    iconName: 'Fuel',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    type: 'expense',
  },
  {
    id: 'house_rent',
    label: 'House Rent',
    hindiLabel: 'मकान किराया',
    iconName: 'Home',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
    type: 'expense',
  },
  {
    id: 'shopping',
    label: 'Shopping',
    hindiLabel: 'शॉपिंग / कपड़े',
    iconName: 'ShoppingBag',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    type: 'expense',
  },
  {
    id: 'health_medical',
    label: 'Health & Medicine',
    hindiLabel: 'दवा / डॉक्टर',
    iconName: 'HeartPulse',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    type: 'expense',
  },
  {
    id: 'emi_loans',
    label: 'EMI & Loans',
    hindiLabel: 'किस्त / लोन',
    iconName: 'Landmark',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 border-slate-200',
    type: 'expense',
  },
  {
    id: 'other_expense',
    label: 'Other Expense',
    hindiLabel: 'अन्य खर्च',
    iconName: 'MoreHorizontal',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 border-gray-200',
    type: 'expense',
  },
];

export const INCOME_CATEGORIES: CategoryOption[] = [
  {
    id: 'salary',
    label: 'Salary',
    hindiLabel: 'वेतन / पगार',
    iconName: 'Briefcase',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
    type: 'income',
  },
  {
    id: 'business',
    label: 'Business / Dukan',
    hindiLabel: 'व्यापार / दुकान',
    iconName: 'Store',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 border-teal-200',
    type: 'income',
  },
  {
    id: 'freelance',
    label: 'Freelance & Projects',
    hindiLabel: 'फ्रीलांस काम',
    iconName: 'Laptop',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 border-cyan-200',
    type: 'income',
  },
  {
    id: 'rent_received',
    label: 'Rent Received',
    hindiLabel: 'किराया मिला',
    iconName: 'Home',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    type: 'income',
  },
  {
    id: 'investments',
    label: 'Interest / Investment',
    hindiLabel: 'ब्याज / मुनाफा',
    iconName: 'TrendingUp',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    type: 'income',
  },
  {
    id: 'gift_pocket_money',
    label: 'Gift / Cashback',
    hindiLabel: 'उपहार / कैशबैक',
    iconName: 'Gift',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    type: 'income',
  },
  {
    id: 'other_income',
    label: 'Other Income',
    hindiLabel: 'अन्य आय',
    iconName: 'PlusCircle',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
    type: 'income',
  },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategoryMeta(categoryName: string, type?: 'income' | 'expense'): CategoryOption {
  const match = ALL_CATEGORIES.find(
    (c) => c.id === categoryName || c.label.toLowerCase() === categoryName.toLowerCase()
  );
  if (match) return match;

  // Fallback if custom
  if (type === 'income') {
    return {
      id: 'custom_income',
      label: categoryName || 'Income',
      iconName: 'TrendingUp',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200',
      type: 'income',
    };
  }

  return {
    id: 'custom_expense',
    label: categoryName || 'Expense',
    iconName: 'ShoppingBag',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 border-rose-200',
    type: 'expense',
  };
}
