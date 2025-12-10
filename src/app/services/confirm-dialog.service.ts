import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';

export interface ConfirmDialogOptions {
  header: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private alertController = inject(AlertController);

  async confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: options.header,
        message: options.message,
        buttons: [
          {
            text: options.cancelText ?? 'Cancel',
            role: 'cancel',
            handler: () => resolve(false),
          },
          {
            text: options.confirmText ?? 'Confirm',
            role: options.destructive ? 'destructive' : undefined,
            handler: () => resolve(true),
          },
        ],
      });
      await alert.present();
    });
  }

  async confirmDelete(itemName: string, itemType: string): Promise<boolean> {
    return this.confirm({
      header: `Delete ${itemType}`,
      message: `Are you sure you want to delete "${itemName}"?`,
      confirmText: 'Delete',
      destructive: true,
    });
  }
}
