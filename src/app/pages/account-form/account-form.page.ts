import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { AccountService } from '../../services/account.service';
import { ColorPickerComponent } from '../../components/color-picker/color-picker.component';
import { IconPickerComponent } from '../../components/icon-picker/icon-picker.component';
import {
  Account,
  AccountType,
  ACCOUNT_ICONS,
  ACCOUNT_COLORS,
} from '../../models/account.model';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    ColorPickerComponent,
    IconPickerComponent,
  ],
  templateUrl: './account-form.page.html',
  styleUrl: './account-form.page.scss',
})
export class AccountFormPage implements OnInit {
  private accountService = inject(AccountService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = false;
  accountId: string | null = null;
  isLoading = false;
  errorMessage = '';

  name = '';
  type: AccountType = 'debit';
  currency = 'USD';
  balance = 0;
  icon = 'bank';
  color = '#3B82F6';

  readonly accountTypes: { value: AccountType; label: string }[] = [
    { value: 'debit', label: 'Debit Card' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'wallet', label: 'E-Wallet' },
  ];

  readonly icons = ACCOUNT_ICONS;
  readonly colors = ACCOUNT_COLORS;

  readonly currencies = ['USD', 'CNY', 'EUR', 'JPY', 'GBP'];

  ngOnInit() {
    this.accountId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.accountId;

    if (this.isEditMode) {
      this.loadAccount();
    }
  }

  private loadAccount() {
    if (!this.accountId) return;

    this.isLoading = true;
    this.accountService.getAccount(this.accountId).subscribe({
      next: (account) => {
        if (account) {
          this.name = account.name;
          this.type = account.type;
          this.currency = account.currency;
          this.balance = account.balance;
          this.icon = account.icon;
          this.color = account.color;
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load account';
        this.isLoading = false;
      },
    });
  }

  async onSave() {
    if (!this.name.trim()) {
      this.errorMessage = 'Please enter account name';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const accountData: Omit<Account, 'id'> = {
      name: this.name.trim(),
      type: this.type,
      currency: this.currency,
      balance: this.balance,
      icon: this.icon,
      color: this.color,
    };

    try {
      if (this.isEditMode && this.accountId) {
        await this.accountService.updateAccount(this.accountId, accountData);
      } else {
        await this.accountService.addAccount(accountData);
      }
      this.router.navigate(['/accounts']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to save account';
    } finally {
      this.isLoading = false;
    }
  }
}
