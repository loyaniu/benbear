export type AccountType = 'debit' | 'credit' | 'cash' | 'wallet';

export interface Account {
  id?: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  icon: string;
  color: string;
}

export const ACCOUNT_ICONS = [
  'bank',
  'credit-card',
  'wallet',
  'money',
  'piggy-bank',
  'coins',
] as const;

export const ACCOUNT_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#6366F1', // indigo-500
  '#14B8A6', // teal-500
] as const;

export const DEFAULT_ACCOUNT: Omit<Account, 'id'> = {
  name: 'My Wallet',
  type: 'wallet',
  currency: 'USD',
  balance: 0,
  icon: 'wallet',
  color: '#3B82F6', // blue
};
