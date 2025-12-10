import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  walletOutline,
  gridOutline,
  settingsOutline,
  chevronForward,
} from 'ionicons/icons';

@Component({
  selector: 'app-more',
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>More</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item button (click)="navigateTo('/accounts')" detail>
          <ion-icon name="wallet-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Accounts</h2>
            <p>Manage your accounts</p>
          </ion-label>
        </ion-item>

        <ion-item button (click)="navigateTo('/categories')" detail>
          <ion-icon name="grid-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Categories</h2>
            <p>Manage expense & income categories</p>
          </ion-label>
        </ion-item>

        <ion-item button (click)="navigateTo('/settings')" detail>
          <ion-icon name="settings-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>Settings</h2>
            <p>App preferences & profile</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      :host {
        ion-content {
          --padding-start: var(--space-4);
          --padding-end: var(--space-4);
          --padding-top: var(--space-4);
        }
      }

      ion-icon[slot='start'] {
        font-size: 1.5rem;
        margin-right: var(--space-4);
        color: var(--app-primary);
      }

      ion-item {
        --background: var(--app-surface);
        --min-height: 72px;
        border-radius: var(--radius-md);
        margin-bottom: var(--space-2);
      }

      h2 {
        font-weight: 500;
        font-size: var(--text-base);
        color: var(--app-text-primary);
        margin-bottom: var(--space-1);
      }

      p {
        font-size: var(--text-sm);
        color: var(--app-text-secondary);
      }
    `,
  ],
})
export class MorePage {
  constructor(private router: Router) {
    addIcons({
      walletOutline,
      gridOutline,
      settingsOutline,
      chevronForward,
    });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
