# Expense Tracker Technical Specification

## 1. Tech Stack Overview

- **Frontend Architecture**
  - Core Framework: Angular (v17+)
  - Mobile Container: Ionic Framework (Capacitor) — handles iOS/Android native calls
  - Styling System: TailwindCSS — UI customization
  - State Management: Angular Signals — reactive streams and local state sync
  - Charting Library: ApexCharts (via ng-apexcharts) — statistical charts
  - Icon Library: Phosphor Icons — interface icons
  - Date Handling: Luxon — timezone and date calculations

- **Backend & Data**
  - BaaS Platform: Google Firebase
  - Database: Cloud Firestore (NoSQL)
  - Offline Strategy: Firestore SDK with `enableIndexedDbPersistence` (local-first, auto-sync when online)
  - Authentication: Firebase Auth

## 2. Core Business Logic

### Local-First
- All read/write operations go directly through the Firestore SDK.
- Leverages SDK's latency compensation mechanism for "zero-latency" interaction experience in offline environments.

### Custom Categories
- Users have their own independent category collection, supporting add/edit/delete operations.

### Transfer Logic
- MVP Phase: Regular transfers are manually recorded as one expense and one income transaction.

## 3. Database Schema (Firestore)

- Uses `users/{userId}` as the root directory for user private data.

### A. User Profile
- Path: `users/{uid}`
```json
{
  "email": "user@example.com",
  "displayName": "User Name",
  "createdAt": "Timestamp",
  "settings": {
    "defaultInputMode": "voice"  // voice | manual
  }
}
```

### B. Accounts
- Path: `users/{uid}/accounts/{accountId}`
```json
{
  "name": "Chase Bank",
  "type": "debit",         // debit, credit, cash, wallet
  "balance": 1200.50,      // current balance
  "icon": "bank",
  "color": "#3B82F6"       // Hex color code (e.g. Tailwind blue-500)
}
```

### C. Categories
- Path: `users/{uid}/categories/{categoryId}`
```json
{
  "name": "Food & Dining",
  "type": "expense",       // expense | income
  "icon": "fork-knife",
  "color": "#EF4444",      // Hex color code
  "order": 1               // sort weight
}
```

### D. Transactions
- Path: `users/{uid}/transactions/{txId}`
- Note: Contains redundant data to avoid join queries
```json
{
  "amount": -15.00,          // original amount

  // Time fields
  "date": "Timestamp",       // business time: when transaction actually occurred
  "createdAt": "Timestamp",  // system time: when record was created

  "note": "Shake Shack",

  // Redundant associated data
  "accountId": "acc_123",
  "accountName": "Chase Bank",
  "categoryId": "cat_456",
  "categoryName": "Food & Dining",
  "categoryIcon": "fork-knife"
}
```

### E. Monthly Stats (Aggregation Layer)
- Path: `users/{uid}/monthly_stats/{yyyy_MM}`
- Note: Write-time Aggregation
```json
{
  // Overview
  "totalExpense": 1500.00,
  "totalIncome": 5000.00,

  // Category breakdown (for pie charts)
  "expenseByCategory": {
    "cat_456": 300.00,          // Food & Dining total
    "cat_789": 1000.00          // Rent total
  },

  // Daily trends (for bar charts)
  // Key corresponds to the date in transaction.date
  "dailyExpense": {
    "01": 50.00,
    "02": 120.00
  }
}
```

## 4. Key Workflows

### Add Transaction
When user saves a transaction, execute Firebase Batch Write (atomic operation), updating three locations simultaneously:
- **Transactions:** `addDoc()` to write the transaction record
- **Accounts:** `updateDoc()` to deduct/add balance from corresponding account
- **Monthly Stats:** `setDoc({ merge: true })`

Operation Flow:
1. Use `increment()` atomic operation to update `totalExpense`
2. Use `increment()` to update corresponding `expenseByCategory` and `dailyExpense` fields
