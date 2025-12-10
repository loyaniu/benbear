import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward } from 'ionicons/icons';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StatsService } from '../../services/stats.service';
import { CategoryService } from '../../services/category.service';
import {
  MonthlyStats,
  EMPTY_MONTHLY_STATS,
} from '../../models/monthly-stats.model';
import { Category } from '../../models/category.model';
import { DateTime } from 'luxon';
import { switchMap, startWith, Subject, takeUntil } from 'rxjs';
import {
  ApexChart,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexDataLabels,
  ApexLegend,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexPlotOptions,
  ApexFill,
} from 'ng-apexcharts';

export type PieChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  responsive: ApexResponsive[];
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
};

export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  dataLabels: ApexDataLabels;
};

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
  templateUrl: './statistics.page.html',
  styleUrl: './statistics.page.scss',
})
export class StatisticsPage implements OnInit, OnDestroy {
  private statsService = inject(StatsService);
  private categoryService = inject(CategoryService);
  private destroy$ = new Subject<void>();

  currentMonthKey = signal<string>(DateTime.now().toFormat('yyyy_MM'));

  // Reactive stats based on currentMonthKey - auto-updates when data changes
  private stats$ = toObservable(this.currentMonthKey).pipe(
    switchMap((monthKey) => {
      const [year, month] = monthKey.split('_');
      return this.statsService.getMonthlyStats(parseInt(year), parseInt(month));
    }),
  );
  stats = toSignal(this.stats$, { initialValue: EMPTY_MONTHLY_STATS });

  // Categories loaded once
  categories = toSignal(this.categoryService.getCategories(), {
    initialValue: [] as Category[],
  });

  isLoading = signal<boolean>(true);

  monthDisplay = computed(() =>
    this.statsService.formatMonthDisplay(this.currentMonthKey()),
  );

  balance = computed(
    () => this.stats().totalIncome - this.stats().totalExpense,
  );

  canGoNext = computed(
    () =>
      !this.statsService.isFutureMonth(
        this.statsService.getNextMonthKey(this.currentMonthKey()),
      ),
  );

  pieChartOptions = computed<PieChartOptions | null>(() => {
    const expenseByCategory = this.stats().expenseByCategory || {};
    const cats = this.categories();

    if (Object.keys(expenseByCategory).length === 0) {
      return null;
    }

    const labels: string[] = [];
    const series: number[] = [];
    const colors: string[] = [];

    for (const [categoryId, amount] of Object.entries(expenseByCategory)) {
      if (amount > 0) {
        const category = cats.find((c) => c.id === categoryId);
        labels.push(category?.name || 'Unknown');
        series.push(amount);
        colors.push(category?.color || '#6b7280');
      }
    }

    return {
      series,
      chart: {
        type: 'donut',
        height: 280,
      },
      labels,
      colors,
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: { width: 280 },
            legend: { position: 'bottom' },
          },
        },
      ],
      dataLabels: {
        enabled: false,
      },
      legend: {
        position: 'bottom',
        fontSize: '14px',
      },
    };
  });

  barChartOptions = computed<BarChartOptions | null>(() => {
    const dailyExpense = this.stats().dailyExpense || {};

    if (Object.keys(dailyExpense).length === 0) {
      return null;
    }

    // Get days in month
    const [year, month] = this.currentMonthKey().split('_');
    const dt = DateTime.fromObject({
      year: parseInt(year),
      month: parseInt(month),
    });
    const daysInMonth = dt.daysInMonth || 30;

    const categories: string[] = [];
    const data: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = String(day).padStart(2, '0');
      categories.push(String(day));
      data.push(dailyExpense[dayKey] || 0);
    }

    return {
      series: [{ name: 'Expense', data }],
      chart: {
        type: 'bar',
        height: 200,
        toolbar: { show: false },
      },
      xaxis: {
        categories,
        labels: {
          show: true,
          rotate: 0,
          style: { fontSize: '10px' },
        },
        tickAmount: 10,
      },
      plotOptions: {
        bar: {
          borderRadius: 2,
          columnWidth: '60%',
        },
      },
      fill: {
        colors: ['#ef4444'],
      },
      dataLabels: {
        enabled: false,
      },
    };
  });

  constructor() {
    addIcons({ chevronBack, chevronForward });
  }

  ngOnInit() {
    // Track loading state based on stats emission
    this.stats$.pipe(takeUntil(this.destroy$), startWith(null)).subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false),
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToPreviousMonth() {
    this.isLoading.set(true);
    this.currentMonthKey.set(
      this.statsService.getPreviousMonthKey(this.currentMonthKey()),
    );
  }

  goToNextMonth() {
    if (this.canGoNext()) {
      this.isLoading.set(true);
      this.currentMonthKey.set(
        this.statsService.getNextMonthKey(this.currentMonthKey()),
      );
    }
  }

  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }
}
