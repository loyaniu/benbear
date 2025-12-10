/**
 * Monthly statistics aggregated from transactions
 * Path: users/{uid}/monthly_stats/{yyyy_MM}
 */
export interface MonthlyStats {
  id?: string; // Document ID in format yyyy_MM

  /** Total expense amount for the month (positive number) */
  totalExpense: number;

  /** Total income amount for the month */
  totalIncome: number;

  /** Expense breakdown by category ID */
  expenseByCategory: Record<string, number>;

  /** Income breakdown by category ID */
  incomeByCategory: Record<string, number>;

  /** Daily expense breakdown (key is day number: "01", "02", etc.) */
  dailyExpense: Record<string, number>;
}

/** Default empty stats for months with no data */
export const EMPTY_MONTHLY_STATS: MonthlyStats = {
  totalExpense: 0,
  totalIncome: 0,
  expenseByCategory: {},
  incomeByCategory: {},
  dailyExpense: {},
};
