import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonDatetime,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonDatetime,
    IonItem,
    IonLabel,
  ],
  template: `
    <ion-item button (click)="isOpen = true">
      <ion-label>
        <p>{{ label }}</p>
        <h2>{{ formattedDate }}</h2>
      </ion-label>
    </ion-item>

    <ion-modal [isOpen]="isOpen" (didDismiss)="isOpen = false">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Select Date</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="isOpen = false">Done</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-datetime
            presentation="date"
            [value]="value"
            (ionChange)="onDateChange($event)"
          ></ion-datetime>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
})
export class DatePickerComponent {
  @Input() value = DateTime.now().toISODate()!; // YYYY-MM-DD format
  @Input() label = 'Date';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;

  get formattedDate(): string {
    return DateTime.fromISO(this.value).toLocaleString(DateTime.DATE_MED);
  }

  onDateChange(event: CustomEvent) {
    const val = event.detail.value;
    if (val) {
      this.value = val.split('T')[0];
      this.valueChange.emit(this.value);
    }
    this.isOpen = false;
  }
}
