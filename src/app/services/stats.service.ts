import {
  Injectable,
  inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { Firestore, doc, docData, getDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import {
  MonthlyStats,
  EMPTY_MONTHLY_STATS,
} from '../models/monthly-stats.model';
import { Observable, of, switchMap, map } from 'rxjs';
import { DateTime } from 'luxon';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private injector = inject(Injector);

  /**
   * Get monthly stats for a specific month
   * @param year - 4-digit year
   * @param month - 1-12 month number
   */
  getMonthlyStats(year: number, month: number): Observable<MonthlyStats> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of(EMPTY_MONTHLY_STATS);
        return runInInjectionContext(this.injector, () => {
          const monthKey = `${year}_${String(month).padStart(2, '0')}`;
          const statsRef = doc(
            this.firestore,
            `users/${user.uid}/monthly_stats/${monthKey}`,
          );
          return docData(statsRef, { idField: 'id' }).pipe(
            map((data) => {
              if (!data) return { ...EMPTY_MONTHLY_STATS, id: monthKey };
              return this.transformStatsData(data, monthKey);
            }),
          );
        });
      }),
    );
  }

  /**
   * Get stats for the current month
   */
  getCurrentMonthStats(): Observable<MonthlyStats> {
    const now = DateTime.now();
    return this.getMonthlyStats(now.year, now.month);
  }

  /**
   * Fetch monthly stats once (direct server read, guaranteed fresh)
   */
  async fetchMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
    const user = this.authService.currentUser;
    if (!user) return EMPTY_MONTHLY_STATS;

    const monthKey = `${year}_${String(month).padStart(2, '0')}`;
    const statsRef = doc(
      this.firestore,
      `users/${user.uid}/monthly_stats/${monthKey}`,
    );

    const snapshot = await getDoc(statsRef);
    if (!snapshot.exists()) {
      return { ...EMPTY_MONTHLY_STATS, id: monthKey };
    }

    return this.transformStatsData(snapshot.data(), monthKey);
  }

  /**
   * Format month key (yyyy_MM) to display string
   */
  formatMonthDisplay(monthKey: string): string {
    const [year, month] = monthKey.split('_');
    const dt = DateTime.fromObject({
      year: parseInt(year),
      month: parseInt(month),
    });
    return dt.toFormat('MMMM yyyy');
  }

  /**
   * Get previous month key
   */
  getPreviousMonthKey(monthKey: string): string {
    const [year, month] = monthKey.split('_');
    const dt = DateTime.fromObject({
      year: parseInt(year),
      month: parseInt(month),
    }).minus({ months: 1 });
    return dt.toFormat('yyyy_MM');
  }

  /**
   * Get next month key
   */
  getNextMonthKey(monthKey: string): string {
    const [year, month] = monthKey.split('_');
    const dt = DateTime.fromObject({
      year: parseInt(year),
      month: parseInt(month),
    }).plus({ months: 1 });
    return dt.toFormat('yyyy_MM');
  }

  /**
   * Check if a month key is in the future
   */
  isFutureMonth(monthKey: string): boolean {
    const now = DateTime.now();
    const currentKey = now.toFormat('yyyy_MM');
    return monthKey > currentKey;
  }

  /**
   * Transform Firestore data with flattened dot-notation keys
   * into properly nested objects
   */
  private transformStatsData(data: any, monthKey: string): MonthlyStats {
    const expenseByCategory: Record<string, number> = {};
    const incomeByCategory: Record<string, number> = {};
    const dailyExpense: Record<string, number> = {};

    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('expenseByCategory.')) {
        const categoryId = key.replace('expenseByCategory.', '');
        expenseByCategory[categoryId] = value as number;
      } else if (key.startsWith('incomeByCategory.')) {
        const categoryId = key.replace('incomeByCategory.', '');
        incomeByCategory[categoryId] = value as number;
      } else if (key.startsWith('dailyExpense.')) {
        const day = key.replace('dailyExpense.', '');
        dailyExpense[day] = value as number;
      }
    }

    return {
      id: monthKey,
      totalExpense: (data['totalExpense'] as number) || 0,
      totalIncome: (data['totalIncome'] as number) || 0,
      expenseByCategory,
      incomeByCategory,
      dailyExpense,
    };
  }
}
