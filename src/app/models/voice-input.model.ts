export interface ParsedTransactionData {
  amount: number | null;
  categoryId: string | null;
  categoryName: string | null;
  accountId: string | null;
  accountName: string | null;
  date: Date;
  note: string;
  transactionType: 'expense' | 'income';
  rawTranscript: string;
}

export interface ParserContext {
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; type: 'expense' | 'income' }[];
  defaultAccountId?: string;
}
