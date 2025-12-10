# Benbear - Project Design

## 1. Page/View Design

### 1.1 Login Page
- Email and password input fields
- "Sign In" button → authenticates via Firebase Auth → navigates to Dashboard
- "Sign Up" link → navigates to Register page

### 1.2 Register Page
- Email, password, confirm password fields
- "Create Account" button → creates Firebase user → navigates to Dashboard

### 1.3 Dashboard (Home)
- Displays total balance (sum of all accounts)
- Shows recent transactions list (last 10)
- Floating "+" button → navigates to Add Transaction page
- Tapping a transaction → navigates to Transaction Detail

### 1.4 Add/Edit Transaction Page
- Amount input (numeric keypad)
- Category selector (grid of icons) → tapping selects category
- Account selector (dropdown)
- Date picker (defaults to today)
- Note input (optional)
- "Save" button → writes to Firestore → returns to Dashboard

### 1.5 Accounts Page
- List of all accounts with name, type, and balance
- "+" button → opens Add Account modal
- Tapping an account → opens Edit Account modal
- Swipe left → reveals delete option

### 1.6 Categories Page
- Two tabs: Expense / Income
- Grid of category icons with names
- "+" button → opens Add Category modal
- Long press → enters edit mode

### 1.7 Statistics Page
- Month selector (left/right arrows to navigate)
- Total income and expense summary
- Pie chart showing expense by category → tapping a slice shows details
- Bar chart showing daily expense trend

### 1.8 Settings Page
- User profile display (email, display name)
- Voice input preference toggle (default input mode: voice or manual)
- "Sign Out" button → clears session → returns to Login

---

## 2. Component Design

### Page Components

| Component | Purpose | Data (Signals) |
|-----------|---------|----------------|
| `LoginPage` | User authentication | `email`, `password`, `loading` |
| `RegisterPage` | User registration | `email`, `password`, `confirmPassword` |
| `DashboardPage` | Main overview | `totalBalance`, `recentTransactions` |
| `TransactionFormPage` | Add/edit transaction | `amount`, `selectedCategory`, `selectedAccount`, `date`, `note` |
| `AccountsPage` | Manage accounts | `accounts`, `isModalOpen` |
| `CategoriesPage` | Manage categories | `categories`, `activeTab` |
| `StatsPage` | View statistics | `currentMonth`, `monthlyStats` |
| `SettingsPage` | User settings | - |

### Services

| Service | Purpose |
|---------|---------|
| `AuthService` | Firebase Auth operations (login, register, logout, auth state) |
| `UserService` | User profile and settings operations |
| `AccountService` | CRUD operations for accounts |
| `CategoryService` | CRUD operations for categories |
| `TransactionService` | CRUD operations for transactions, balance updates |
| `StatsService` | Read/write monthly statistics |

---

## 3. Database Structure (Firestore)

### User Profile
**Path:** `users/{uid}`
```json
{
  "email": "user@example.com",
  "displayName": "User Name",
  "createdAt": "Timestamp",
  "settings": {
    "defaultInputMode": "voice"
  }
}
```

### Accounts
**Path:** `users/{uid}/accounts/{accountId}`
```json
{
  "name": "Chase Bank",
  "type": "debit",
  "balance": 1200.50,
  "icon": "bank",
  "color": "#3B82F6"
}
```

### Categories
**Path:** `users/{uid}/categories/{categoryId}`
```json
{
  "name": "Food",
  "type": "expense",
  "icon": "fork-knife",
  "color": "#EF4444",
  "order": 1
}
```

### Transactions
**Path:** `users/{uid}/transactions/{txId}`
```json
{
  "amount": -15.00,
  "date": "Timestamp",
  "createdAt": "Timestamp",
  "note": "Lunch",
  "accountId": "acc_123",
  "accountName": "Chase Bank",
  "categoryId": "cat_456",
  "categoryName": "Food",
  "categoryIcon": "fork-knife"
}
```

### Monthly Statistics
**Path:** `users/{uid}/monthly_stats/{yyyy_MM}`
```json
{
  "totalExpense": 1500.00,
  "totalIncome": 5000.00,
  "expenseByCategory": {
    "cat_456": 300.00,
    "cat_789": 1000.00
  },
  "dailyExpense": {
    "01": 50.00,
    "02": 120.00
  }
}
```

---

## 4. Implementation Plan

1. Firebase project setup, Auth service, Login/Register pages
2. Account CRUD (service + UI)
3. Category CRUD (service + UI)
4. Transaction CRUD (service + UI), balance update logic
5. Statistics aggregation, charts integration
6. Testing, bug fixes, polish

---

## 5. Team Responsibilities

| Member | Responsibilities |
|--------|------------------|
| **Ben** | UI/UX design, page layouts, component styling, responsive design |
| **Loya** | Firebase configuration, services implementation, business logic, data flow |
