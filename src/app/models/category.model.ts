export type CategoryType = 'expense' | 'income';

export interface Category {
  id?: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  order: number;
}

export const CATEGORY_ICONS = [
  'fork-knife',
  'shopping-cart',
  'house',
  'car',
  'airplane',
  'train',
  'bus',
  'gift',
  'heart',
  'game-controller',
  'music-notes',
  'film-strip',
  'book',
  'graduation-cap',
  'first-aid-kit',
  'pill',
  't-shirt',
  'sneaker',
  'dog',
  'cat',
  'plant',
  'lightning',
  'drop',
  'wifi-high',
  'phone',
  'money',
  'briefcase',
  'chart-line-up',
] as const;

export const CATEGORY_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#10B981', // emerald
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
] as const;

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id'>[] = [
  {
    name: 'Food',
    type: 'expense',
    icon: 'fork-knife',
    color: '#EF4444',
    order: 1,
  },
  {
    name: 'Transport',
    type: 'expense',
    icon: 'car',
    color: '#3B82F6',
    order: 2,
  },
  {
    name: 'Shopping',
    type: 'expense',
    icon: 'shopping-cart',
    color: '#F97316',
    order: 3,
  },
  {
    name: 'Entertainment',
    type: 'expense',
    icon: 'game-controller',
    color: '#8B5CF6',
    order: 4,
  },
  {
    name: 'Housing',
    type: 'expense',
    icon: 'house',
    color: '#10B981',
    order: 5,
  },
  {
    name: 'Health',
    type: 'expense',
    icon: 'first-aid-kit',
    color: '#EC4899',
    order: 6,
  },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id'>[] = [
  {
    name: 'Salary',
    type: 'income',
    icon: 'briefcase',
    color: '#22C55E',
    order: 1,
  },
  {
    name: 'Investment',
    type: 'income',
    icon: 'chart-line-up',
    color: '#3B82F6',
    order: 2,
  },
  { name: 'Gift', type: 'income', icon: 'gift', color: '#F59E0B', order: 3 },
];
