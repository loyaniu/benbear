import {
  Injectable,
  inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  writeBatch,
  query,
  orderBy,
  Timestamp,
  increment,
  limit,
  getDocs,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Transaction, TransactionFormData } from '../models/transaction.model';
import { Account } from '../models/account.model';
import { Category } from '../models/category.model';
import { Observable, of, switchMap } from 'rxjs';
import { DateTime } from 'luxon';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private injector = inject(Injector);

  /** Get recent transactions */
  getTransactions(limitCount = 50): Observable<Transaction[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of([]);
        return runInInjectionContext(this.injector, () => {
          const transactionsRef = collection(
            this.firestore,
            `users/${user.uid}/transactions`,
          );
          const q = query(
            transactionsRef,
            orderBy('date', 'desc'),
            limit(limitCount),
          );
          return collectionData(q, { idField: 'id' }) as Observable<
            Transaction[]
          >;
        });
      }),
    );
  }

  /** Fetch recent transactions once (direct server read, guaranteed fresh) */
  async fetchTransactions(limitCount = 50): Promise<Transaction[]> {
    const user = this.authService.currentUser;
    if (!user) return [];

    const transactionsRef = collection(
      this.firestore,
      `users/${user.uid}/transactions`,
    );
    const q = query(
      transactionsRef,
      orderBy('date', 'desc'),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Transaction,
    );
  }

  /** Fetch today's transactions */
  async fetchTodayTransactions(): Promise<Transaction[]> {
    const transactions = await this.fetchTransactions(100);
    const today = DateTime.now().startOf('day');
    return transactions.filter((tx) => {
      const txDate = DateTime.fromMillis(tx.date.toMillis()).startOf('day');
      return txDate.equals(today);
    });
  }

  /** Get a single transaction by ID */
  getTransaction(id: string): Observable<Transaction | undefined> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of(undefined);
        return runInInjectionContext(this.injector, () => {
          const txRef = doc(
            this.firestore,
            `users/${user.uid}/transactions/${id}`,
          );
          return docData(txRef, { idField: 'id' }) as Observable<Transaction>;
        });
      }),
    );
  }

  /**
   * Update a transaction by deleting the old one and creating a new one
   * This handles all balance and stats updates correctly
   */
  async updateTransaction(
    oldTransaction: Transaction,
    formData: TransactionFormData,
    account: Account,
    category: Category,
  ): Promise<void> {
    // Delete the old transaction (reverses its effects)
    await this.deleteTransaction(oldTransaction);
    // Add the new transaction
    await this.addTransaction(formData, account, category);
  }

  /**
   * Add a new transaction with batch write
   * Updates: transactions, account balance, monthly stats
   */
  async addTransaction(
    formData: TransactionFormData,
    account: Account,
    category: Category,
  ): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const batch = writeBatch(this.firestore);
    const now = Timestamp.now();
    const txDate = Timestamp.fromDate(formData.date);

    // Determine if expense (negative) or income (positive)
    const signedAmount =
      category.type === 'expense'
        ? -Math.abs(formData.amount)
        : Math.abs(formData.amount);

    // 1. Create transaction document
    const transactionsRef = collection(
      this.firestore,
      `users/${user.uid}/transactions`,
    );
    const newTxRef = doc(transactionsRef);

    const transaction: Omit<Transaction, 'id'> = {
      amount: signedAmount,
      currency: account.currency,
      date: txDate,
      createdAt: now,
      note: formData.note,
      accountId: account.id!,
      accountName: account.name,
      categoryId: category.id!,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
      categoryType: category.type,
    };

    batch.set(newTxRef, transaction);

    // 2. Update account balance
    const accountRef = doc(
      this.firestore,
      `users/${user.uid}/accounts/${account.id}`,
    );
    batch.update(accountRef, {
      balance: increment(signedAmount),
    });

    // 3. Update monthly stats
    const dt = DateTime.fromJSDate(formData.date);
    const monthKey = dt.toFormat('yyyy_MM');
    const dayKey = dt.toFormat('dd');

    const monthlyStatsRef = doc(
      this.firestore,
      `users/${user.uid}/monthly_stats/${monthKey}`,
    );

    if (category.type === 'expense') {
      batch.set(
        monthlyStatsRef,
        {
          totalExpense: increment(Math.abs(formData.amount)),
          [`expenseByCategory.${category.id}`]: increment(
            Math.abs(formData.amount),
          ),
          [`dailyExpense.${dayKey}`]: increment(Math.abs(formData.amount)),
        },
        { merge: true },
      );
    } else {
      batch.set(
        monthlyStatsRef,
        {
          totalIncome: increment(formData.amount),
          [`incomeByCategory.${category.id}`]: increment(formData.amount),
        },
        { merge: true },
      );
    }

    await batch.commit();
  }

  /**
   * Delete a transaction and reverse its effects
   */
  async deleteTransaction(transaction: Transaction): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const batch = writeBatch(this.firestore);

    // 1. Delete transaction
    const txRef = doc(
      this.firestore,
      `users/${user.uid}/transactions/${transaction.id}`,
    );
    batch.delete(txRef);

    // 2. Reverse account balance change
    const accountRef = doc(
      this.firestore,
      `users/${user.uid}/accounts/${transaction.accountId}`,
    );
    batch.update(accountRef, {
      balance: increment(-transaction.amount),
    });

    // 3. Reverse monthly stats
    const dt = DateTime.fromMillis(transaction.date.toMillis());
    const monthKey = dt.toFormat('yyyy_MM');
    const dayKey = dt.toFormat('dd');

    const monthlyStatsRef = doc(
      this.firestore,
      `users/${user.uid}/monthly_stats/${monthKey}`,
    );

    if (transaction.categoryType === 'expense') {
      batch.set(
        monthlyStatsRef,
        {
          totalExpense: increment(transaction.amount), // amount is negative, so this subtracts
          [`expenseByCategory.${transaction.categoryId}`]: increment(
            transaction.amount,
          ),
          [`dailyExpense.${dayKey}`]: increment(transaction.amount),
        },
        { merge: true },
      );
    } else {
      batch.set(
        monthlyStatsRef,
        {
          totalIncome: increment(-transaction.amount),
          [`incomeByCategory.${transaction.categoryId}`]: increment(
            -transaction.amount,
          ),
        },
        { merge: true },
      );
    }

    await batch.commit();
  }
}
