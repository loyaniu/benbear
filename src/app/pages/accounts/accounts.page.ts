import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trash } from 'ionicons/icons';
import { AccountService } from '../../services/account.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { Account } from '../../models/account.model';
import { CategoryIconComponent } from '../../components/category-icon/category-icon.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonNote,
    CategoryIconComponent,
  ],
  templateUrl: './accounts.page.html',
  styleUrl: './accounts.page.scss',
})
export class AccountsPage implements OnInit {
  private accountService = inject(AccountService);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmDialogService);

  accounts$!: Observable<Account[]>;

  constructor() {
    addIcons({ add, trash });
  }

  ngOnInit() {
    this.accounts$ = this.accountService.getAccounts();
  }

  onAddAccount() {
    this.router.navigate(['/accounts/new']);
  }

  onEditAccount(account: Account) {
    this.router.navigate(['/accounts/edit', account.id]);
  }

  async onDeleteAccount(account: Account) {
    const confirmed = await this.confirmDialog.confirmDelete(
      account.name,
      'Account',
    );
    if (confirmed) {
      this.accountService.deleteAccount(account.id!);
    }
  }

  getAccountTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      debit: 'Debit Card',
      credit: 'Credit Card',
      cash: 'Cash',
      wallet: 'E-Wallet',
    };
    return labels[type] || type;
  }
}
