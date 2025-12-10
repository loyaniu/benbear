import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonModal,
  IonSpinner,
  IonText,
  IonIcon,
  ToastController,
} from '@ionic/angular/standalone';
import { ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { micOutline, createOutline } from 'ionicons/icons';
import { TransactionService } from '../../services/transaction.service';
import { AccountService } from '../../services/account.service';
import { CategoryService } from '../../services/category.service';
import { UserService } from '../../services/user.service';
import { AudioRecorderService } from '../../services/audio-recorder.service';
import { TransactionParserService } from '../../services/transaction-parser.service';
import { Account } from '../../models/account.model';
import { Category, CategoryType } from '../../models/category.model';
import { CategoryPickerComponent } from '../../components/category-picker/category-picker.component';
import { Transaction } from '../../models/transaction.model';
import { firstValueFrom } from 'rxjs';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-add-transaction',
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
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonModal,
    IonSpinner,
    IonText,
    IonIcon,
    CategoryPickerComponent,
  ],
  templateUrl: './add-transaction.page.html',
  styleUrl: './add-transaction.page.scss',
})
export class AddTransactionPage implements ViewWillEnter, OnDestroy {
  private transactionService = inject(TransactionService);
  private accountService = inject(AccountService);
  private categoryService = inject(CategoryService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastController = inject(ToastController);

  // Voice services
  audioRecorderService = inject(AudioRecorderService);
  private transactionParserService = inject(TransactionParserService);

  // Input mode: loaded from user settings
  inputMode: 'voice' | 'manual' = 'voice';

  // Voice/Text input state
  isProcessingAudio = false;
  isProcessingText = false;
  textInput = '';
  allCategories: Category[] = [];

  // Edit mode
  isEditMode = false;
  editTransactionId: string | null = null;
  originalTransaction: Transaction | null = null;

  // Form fields
  transactionType: CategoryType = 'expense';
  amount: number | null = null;
  selectedAccountId = '';
  selectedCategoryId = '';
  date = DateTime.now().toISODate()!; // YYYY-MM-DD format
  note = '';

  accounts: Account[] = [];
  categories: Category[] = [];
  isLoading = false;
  isDateModalOpen = false;

  constructor() {
    addIcons({ micOutline, createOutline });
  }

  async ionViewWillEnter() {
    this.editTransactionId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editTransactionId;

    // In edit mode, always use manual input
    if (this.isEditMode) {
      this.inputMode = 'manual';
    } else {
      // Reset form to initial state for new transactions
      this.resetForm();
      // Load user's default input mode preference
      const profile = await this.userService.fetchUserProfile();
      if (profile?.settings?.defaultInputMode) {
        this.inputMode = profile.settings.defaultInputMode;
      }
    }

    this.loadData();
  }

  private resetForm() {
    this.transactionType = 'expense';
    this.amount = null;
    this.selectedAccountId = '';
    this.selectedCategoryId = '';
    this.date = DateTime.now().toISODate()!;
    this.note = '';
    this.textInput = '';
    this.originalTransaction = null;
  }

  ngOnDestroy() {
    // Cancel any ongoing recording
    this.audioRecorderService.cancelRecording();
  }

  private async loadData() {
    this.accounts = await firstValueFrom(this.accountService.getAccounts());

    // Load all categories for voice parsing
    this.allCategories = await firstValueFrom(
      this.categoryService.getCategories(),
    );

    // If editing, load the transaction first
    if (this.isEditMode && this.editTransactionId) {
      const tx = await firstValueFrom(
        this.transactionService.getTransaction(this.editTransactionId),
      );
      if (tx) {
        this.originalTransaction = tx;
        this.transactionType = tx.categoryType;
        this.amount = Math.abs(tx.amount);
        this.selectedAccountId = tx.accountId;
        this.date = DateTime.fromMillis(tx.date.toMillis()).toISODate()!;
        this.note = tx.note || '';

        await this.loadCategories();
        const categoryId = tx.categoryId;
        setTimeout(() => {
          this.selectedCategoryId = categoryId;
        });
        return;
      }
    }

    // Default flow for new transaction
    await this.loadCategories();

    // Default to first account
    if (this.accounts.length > 0 && !this.selectedAccountId) {
      this.selectedAccountId = this.accounts[0].id!;
    }
  }

  private async loadCategories() {
    this.categories = await firstValueFrom(
      this.categoryService.getCategoriesByType(this.transactionType),
    );

    // Only set default category for new transactions
    if (!this.isEditMode) {
      if (this.categories.length > 0) {
        this.selectedCategoryId = this.categories[0].id!;
      } else {
        this.selectedCategoryId = '';
      }
    }
  }

  // Mode switching
  switchToManual() {
    this.inputMode = 'manual';
  }

  switchToVoice() {
    this.inputMode = 'voice';
  }

  // Voice recording
  async toggleRecording() {
    if (this.audioRecorderService.isRecording()) {
      await this.stopAndProcessRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    try {
      await this.audioRecorderService.startRecording();
    } catch (error: any) {
      this.showToast(error.message || 'Failed to start recording');
    }
  }

  private async stopAndProcessRecording() {
    try {
      this.isProcessingAudio = true;
      const audioBlob = await this.audioRecorderService.stopRecording();

      // Parse audio with Gemini
      const context = {
        accounts: this.accounts.map((a) => ({ id: a.id!, name: a.name })),
        categories: this.allCategories.map((c) => ({
          id: c.id!,
          name: c.name,
          type: c.type,
        })),
        defaultAccountId: this.selectedAccountId || this.accounts[0]?.id,
      };

      const parsedData = await this.transactionParserService.parseAudio(
        audioBlob,
        context,
      );

      // Fill form with parsed data
      await this.applyParsedData(parsedData);
    } catch (error: any) {
      console.error('Voice processing error:', error);
      this.showToast(error.message || 'Failed to process voice input');
    } finally {
      this.isProcessingAudio = false;
    }
  }

  // Text input processing
  async processTextInput() {
    if (!this.textInput.trim()) {
      this.showToast('Please enter a description');
      return;
    }

    try {
      this.isProcessingText = true;

      const context = {
        accounts: this.accounts.map((a) => ({ id: a.id!, name: a.name })),
        categories: this.allCategories.map((c) => ({
          id: c.id!,
          name: c.name,
          type: c.type,
        })),
        defaultAccountId: this.selectedAccountId || this.accounts[0]?.id,
      };

      const parsedData = await this.transactionParserService.parseText(
        this.textInput,
        context,
      );

      // Fill form with parsed data
      await this.applyParsedData(parsedData);
      this.textInput = ''; // Clear input after processing
    } catch (error: any) {
      console.error('Text processing error:', error);
      this.showToast(error.message || 'Failed to process text input');
    } finally {
      this.isProcessingText = false;
    }
  }

  // Apply parsed data to form and switch to manual mode
  private async applyParsedData(data: {
    amount: number | null;
    categoryId: string | null;
    accountId: string | null;
    date: Date | null;
    note: string;
    transactionType: CategoryType;
    rawTranscript: string;
  }) {
    // Update transaction type and reload categories
    if (data.transactionType) {
      this.transactionType = data.transactionType;
      await this.loadCategories();
    }

    // Fill form fields
    if (data.amount !== null) {
      this.amount = data.amount;
    }
    if (data.categoryId) {
      this.selectedCategoryId = data.categoryId;
    }
    if (data.accountId) {
      this.selectedAccountId = data.accountId;
    }
    if (data.date) {
      this.date = DateTime.fromJSDate(data.date).toISODate()!;
    }

    // Put raw transcript in note for reference
    const transcript = data.rawTranscript?.trim();
    if (transcript) {
      this.note = data.note
        ? `${data.note}\n\n📝 "${transcript}"`
        : `📝 "${transcript}"`;
    } else if (data.note) {
      this.note = data.note;
    }

    // Switch to manual mode to show filled form
    this.inputMode = 'manual';
  }

  // Form handlers
  onTypeChange() {
    this.loadCategories();
  }

  onDateChange(event: CustomEvent) {
    // Extract YYYY-MM-DD from the value (could be full ISO or just date)
    const value = event.detail.value;
    if (value) {
      this.date = value.split('T')[0];
    }
    this.isDateModalOpen = false;
  }

  get formattedDate(): string {
    return DateTime.fromISO(this.date).toLocaleString(DateTime.DATE_MED);
  }

  get dateForPicker(): string {
    // Ensure date is in YYYY-MM-DD format for ion-datetime
    return this.date || DateTime.now().toISODate()!;
  }

  async onSave() {
    if (!this.amount || this.amount <= 0) {
      this.showToast('Please enter a valid amount');
      return;
    }

    if (!this.selectedAccountId) {
      this.showToast('Please select an account');
      return;
    }

    if (!this.selectedCategoryId) {
      this.showToast('Please select a category');
      return;
    }

    const account = this.accounts.find((a) => a.id === this.selectedAccountId);
    const category = this.categories.find(
      (c) => c.id === this.selectedCategoryId,
    );

    if (!account || !category) {
      this.showToast('Invalid account or category');
      return;
    }

    this.isLoading = true;

    try {
      const formData = {
        amount: this.amount,
        date: DateTime.fromISO(this.date).toJSDate(),
        note: this.note,
        accountId: this.selectedAccountId,
        categoryId: this.selectedCategoryId,
      };

      if (this.isEditMode && this.originalTransaction) {
        await this.transactionService.updateTransaction(
          this.originalTransaction,
          formData,
          account,
          category,
        );
        this.showToast('Transaction updated!');
      } else {
        await this.transactionService.addTransaction(
          formData,
          account,
          category,
        );
        this.showToast('Transaction saved!');
      }

      this.router.navigate(['/tabs/home']);
    } catch (error: any) {
      this.showToast(error.message || 'Failed to save transaction');
    } finally {
      this.isLoading = false;
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }
}
