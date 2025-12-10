import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  IonListHeader,
  IonToggle,
  IonSpinner,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, createOutline, trashOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { UserProfile } from '../../models/user.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
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
    IonListHeader,
    IonToggle,
    IonSpinner,
  ],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private alertController = inject(AlertController);
  private router = inject(Router);

  userProfile = signal<UserProfile | null>(null);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  isDeleting = signal<boolean>(false);

  constructor() {
    addIcons({ logOutOutline, createOutline, trashOutline });
  }

  async ngOnInit() {
    await this.loadProfile();
  }

  private async loadProfile() {
    this.isLoading.set(true);
    try {
      const profile = await this.userService.fetchUserProfile();
      this.userProfile.set(profile);
    } finally {
      this.isLoading.set(false);
    }
  }

  get isVoiceInputDefault(): boolean {
    return this.userProfile()?.settings?.defaultInputMode === 'voice';
  }

  async onInputModeChange(event: CustomEvent) {
    const isVoice = event.detail.checked;
    this.isSaving.set(true);
    try {
      await this.userService.updateSettings({
        defaultInputMode: isVoice ? 'voice' : 'manual',
      });
      // Update local state
      const profile = this.userProfile();
      if (profile) {
        this.userProfile.set({
          ...profile,
          settings: {
            ...profile.settings,
            defaultInputMode: isVoice ? 'voice' : 'manual',
          },
        });
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  async onSignOut() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  async editDisplayName() {
    const alert = await this.alertController.create({
      header: 'Edit Display Name',
      inputs: [
        {
          name: 'displayName',
          type: 'text',
          placeholder: 'Enter display name',
          value: this.userProfile()?.displayName || '',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save',
          handler: async (data) => {
            if (data.displayName !== undefined) {
              this.isSaving.set(true);
              try {
                await this.userService.updateProfile({
                  displayName: data.displayName,
                });
                const profile = this.userProfile();
                if (profile) {
                  this.userProfile.set({
                    ...profile,
                    displayName: data.displayName,
                  });
                }
              } finally {
                this.isSaving.set(false);
              }
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async onDeleteAccount() {
    const confirmAlert = await this.alertController.create({
      header: 'Delete Account',
      message:
        'This will permanently delete your account and all data. This action cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Continue',
          role: 'destructive',
          handler: () => {
            this.showPasswordPrompt();
          },
        },
      ],
    });
    await confirmAlert.present();
  }

  private async showPasswordPrompt() {
    const passwordAlert = await this.alertController.create({
      header: 'Confirm Password',
      message: 'Please enter your password to confirm deletion.',
      inputs: [{ name: 'password', type: 'password', placeholder: 'Password' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: (data) => {
            this.executeDelete(data.password);
          },
        },
      ],
    });
    await passwordAlert.present();
  }

  private async executeDelete(password: string) {
    if (!password) return;

    this.isDeleting.set(true);
    try {
      await this.userService.deleteAllUserData();
      await this.authService.reauthenticateAndDeleteUser(password);
      this.router.navigate(['/login']);
    } catch (error: any) {
      const errorAlert = await this.alertController.create({
        header: 'Error',
        message:
          error.code === 'auth/wrong-password'
            ? 'Incorrect password. Please try again.'
            : 'Failed to delete account. Please try again.',
        buttons: ['OK'],
      });
      await errorAlert.present();
    } finally {
      this.isDeleting.set(false);
    }
  }
}
