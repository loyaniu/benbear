import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash } from 'ionicons/icons';
import { TransactionService } from '../../services/transaction.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { Transaction } from '../../models/transaction.model';
import { CategoryIconComponent } from '../../components/category-icon/category-icon.component';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    CategoryIconComponent,
  ],
  templateUrl: './transactions.page.html',
  styleUrl: './transactions.page.scss',
})
export class TransactionsPage implements OnInit {
  private transactionService = inject(TransactionService);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmDialogService);

  transactions$!: Observable<Transaction[]>;

  constructor() {
    addIcons({ trash });
  }

  ngOnInit() {
    this.transactions$ = this.transactionService.getTransactions();
  }

  onAddTransaction() {
    this.router.navigate(['/tabs/add']);
  }

  onEditTransaction(transaction: Transaction) {
    this.router.navigate(['/transactions/edit', transaction.id]);
  }

  async onDeleteTransaction(transaction: Transaction) {
    const confirmed = await this.confirmDialog.confirm({
      header: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction?',
      confirmText: 'Delete',
      destructive: true,
    });
    if (confirmed) {
      await this.transactionService.deleteTransaction(transaction);
    }
  }

  formatDate(timestamp: any): string {
    const dt = DateTime.fromMillis(timestamp.toMillis());
    return dt.toFormat('MMM d, yyyy');
  }

  formatAmount(transaction: Transaction): string {
    const sign = transaction.amount < 0 ? '-' : '+';
    const absAmount = Math.abs(transaction.amount).toFixed(2);
    return `${sign}$${absAmount}`;
  }

  getAmountColor(transaction: Transaction): string {
    return transaction.amount < 0 ? 'danger' : 'success';
  }
}
