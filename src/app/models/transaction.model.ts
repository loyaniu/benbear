import { Timestamp } from '@angular/fire/firestore';

export interface Transaction {
  id?: string;
  amount: number;
  currency: string;

  // Time fields
  date: Timestamp;
  createdAt: Timestamp;

  note: string;

  // Denormalized account data
  accountId: string;
  accountName: string;

  // Denormalized category data
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  categoryType: 'expense' | 'income';
}

export interface TransactionFormData {
  amount: number;
  date: Date;
  note: string;
  accountId: string;
  categoryId: string;
}
