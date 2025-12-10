import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDown, chevronUp } from 'ionicons/icons';
import { StatsService } from '../services/stats.service';
import { CategoryService } from '../services/category.service';
import { TransactionService } from '../services/transaction.service';
import { UserService } from '../services/user.service';
import { Category } from '../models/category.model';
import { Transaction } from '../models/transaction.model';
import {
  MonthlyStats,
  EMPTY_MONTHLY_STATS,
} from '../models/monthly-stats.model';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';

export interface CategoryAmount {
  category: Category;
  amount: number;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
})
export class HomePage implements ViewWillEnter, OnInit, OnDestroy {
  private statsService = inject(StatsService);
  private categoryService = inject(CategoryService);
  private transactionService = inject(TransactionService);
  private userService = inject(UserService);

  pageTitle = signal<string>('Home');
  viewMode = signal<'daily' | 'monthly'>('monthly');
  spendingExpanded = true;
  incomeExpanded = true;

  expenseCategories = signal<Category[]>([]);
  incomeCategories = signal<Category[]>([]);
  monthlyStats = signal<MonthlyStats>(EMPTY_MONTHLY_STATS);
  todayTransactions = signal<Transaction[]>([]);
  isLoading = signal<boolean>(true);

  /** Reactive dark mode signal */
  isDarkMode = signal<boolean>(false);
  private darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private darkModeListener = (e: MediaQueryListEvent) =>
    this.isDarkMode.set(e.matches);

  /** Today's total expense */
  todayExpense = computed(() => {
    return this.todayTransactions()
      .filter((t) => t.categoryType === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  });

  /** Today's total income */
  todayIncome = computed(() => {
    return this.todayTransactions()
      .filter((t) => t.categoryType === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  /** Display expense based on view mode */
  displayExpense = computed(() => {
    return this.viewMode() === 'daily'
      ? this.todayExpense()
      : this.monthlyStats().totalExpense;
  });

  /** Display income based on view mode */
  displayIncome = computed(() => {
    return this.viewMode() === 'daily'
      ? this.todayIncome()
      : this.monthlyStats().totalIncome;
  });

  /** Category spending sorted by amount descending */
  categorySpending = computed<CategoryAmount[]>(() => {
    const cats = this.expenseCategories();

    if (this.viewMode() === 'daily') {
      // Group today's expense transactions by category
      const expenseByCategory: Record<string, number> = {};
      for (const tx of this.todayTransactions()) {
        if (tx.categoryType === 'expense') {
          expenseByCategory[tx.categoryId] =
            (expenseByCategory[tx.categoryId] || 0) + Math.abs(tx.amount);
        }
      }
      const spending: CategoryAmount[] = [];
      for (const [categoryId, amount] of Object.entries(expenseByCategory)) {
        const category = cats.find((c) => c.id === categoryId);
        if (category && amount > 0) {
          spending.push({ category, amount });
        }
      }
      return spending.sort((a, b) => b.amount - a.amount);
    } else {
      // Monthly view
      const stats = this.monthlyStats();
      const expenseByCategory = stats.expenseByCategory;
      const spending: CategoryAmount[] = [];
      for (const [categoryId, amount] of Object.entries(expenseByCategory)) {
        const category = cats.find((c) => c.id === categoryId);
        if (category && amount > 0) {
          spending.push({ category, amount });
        }
      }
      return spending.sort((a, b) => b.amount - a.amount);
    }
  });

  /** Category income sorted by amount descending */
  categoryIncome = computed<CategoryAmount[]>(() => {
    const cats = this.incomeCategories();

    if (this.viewMode() === 'daily') {
      // Group today's income transactions by category
      const incomeByCategory: Record<string, number> = {};
      for (const tx of this.todayTransactions()) {
        if (tx.categoryType === 'income') {
          incomeByCategory[tx.categoryId] =
            (incomeByCategory[tx.categoryId] || 0) + tx.amount;
        }
      }
      const income: CategoryAmount[] = [];
      for (const [categoryId, amount] of Object.entries(incomeByCategory)) {
        const category = cats.find((c) => c.id === categoryId);
        if (category && amount > 0) {
          income.push({ category, amount });
        }
      }
      return income.sort((a, b) => b.amount - a.amount);
    } else {
      // Monthly view
      const stats = this.monthlyStats();
      const incomeByCategory = stats.incomeByCategory;
      const income: CategoryAmount[] = [];
      for (const [categoryId, amount] of Object.entries(incomeByCategory)) {
        const category = cats.find((c) => c.id === categoryId);
        if (category && amount > 0) {
          income.push({ category, amount });
        }
      }
      return income.sort((a, b) => b.amount - a.amount);
    }
  });

  constructor() {
    addIcons({
      chevronDown,
      chevronUp,
    });
  }

  ngOnInit() {
    this.isDarkMode.set(this.darkModeQuery.matches);
    this.darkModeQuery.addEventListener('change', this.darkModeListener);
  }

  ngOnDestroy() {
    this.darkModeQuery.removeEventListener('change', this.darkModeListener);
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const now = DateTime.now();
      const [expenseCategories, incomeCategories, stats, todayTx, userProfile] =
        await Promise.all([
          firstValueFrom(this.categoryService.getCategoriesByType('expense')),
          firstValueFrom(this.categoryService.getCategoriesByType('income')),
          this.statsService.fetchMonthlyStats(now.year, now.month),
          this.transactionService.fetchTodayTransactions(),
          this.userService.fetchUserProfile(),
        ]);
      this.expenseCategories.set(expenseCategories);
      this.incomeCategories.set(incomeCategories);
      this.monthlyStats.set(stats);
      this.todayTransactions.set(todayTx);
      if (userProfile?.displayName) {
        this.pageTitle.set(userProfile.displayName);
      }
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleSpending() {
    this.spendingExpanded = !this.spendingExpanded;
  }

  toggleIncome() {
    this.incomeExpanded = !this.incomeExpanded;
  }

  formatCurrency(amount: number): string {
    return `$${Math.abs(amount).toFixed(0)}`;
  }

  /** Convert hex color to pastel (very light) version for light mode, or dark tinted for dark mode */
  getPastelColor(hex: string, dark = this.isDarkMode()): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return dark ? '#1e293b' : '#f8fafc';

    if (dark) {
      // Dark mode: very subtle tint on dark background (10% color, 90% dark)
      const darkBg = { r: 30, g: 41, b: 59 }; // #1e293b
      const r = Math.round(rgb.r * 0.12 + darkBg.r * 0.88);
      const g = Math.round(rgb.g * 0.12 + darkBg.g * 0.88);
      const b = Math.round(rgb.b * 0.12 + darkBg.b * 0.88);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Light mode: mix with white (85% white, 15% original)
      const r = Math.round(rgb.r * 0.15 + 255 * 0.85);
      const g = Math.round(rgb.g * 0.15 + 255 * 0.85);
      const b = Math.round(rgb.b * 0.15 + 255 * 0.85);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  /** Convert hex color to lighter version for icon background */
  getLighterColor(hex: string, dark = this.isDarkMode()): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return dark ? '#334155' : '#ffffff';

    if (dark) {
      // Dark mode: slightly lighter than card background (15% color)
      const darkBg = { r: 51, g: 65, b: 85 }; // #334155
      const r = Math.round(rgb.r * 0.15 + darkBg.r * 0.85);
      const g = Math.round(rgb.g * 0.15 + darkBg.g * 0.85);
      const b = Math.round(rgb.b * 0.15 + darkBg.b * 0.85);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Light mode: mix with white (70% white, 30% original)
      const r = Math.round(rgb.r * 0.3 + 255 * 0.7);
      const g = Math.round(rgb.g * 0.3 + 255 * 0.7);
      const b = Math.round(rgb.b * 0.3 + 255 * 0.7);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }
}
