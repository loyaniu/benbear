import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSearchbar,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [
    FormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonSearchbar,
    IonItem,
    IonLabel,
  ],
  template: `
    <ion-item button (click)="isOpen = true">
      <ion-label>
        <p>{{ label }}</p>
        <div class="selected-icon">
          <span class="icon-preview" [style.color]="previewColor">
            <i class="ph ph-{{ value }}"></i>
          </span>
          <span class="icon-name">{{ value }}</span>
        </div>
      </ion-label>
    </ion-item>

    <ion-modal [isOpen]="isOpen" (didDismiss)="isOpen = false">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Select Icon</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="isOpen = false">Done</ion-button>
            </ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar
              [(ngModel)]="searchTerm"
              placeholder="Search icons"
              [debounce]="250"
            ></ion-searchbar>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="icon-grid">
            @for (icon of filteredIcons; track icon) {
              <button
                type="button"
                class="icon-option"
                [class.selected]="value === icon"
                (click)="selectIcon(icon)"
                [attr.aria-label]="'Select icon ' + icon"
              >
                <i class="ph ph-{{ icon }}"></i>
              </button>
            }
          </div>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [
    `
      .selected-icon {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
      }

      .icon-preview {
        font-size: 1.5rem;
      }

      .icon-name {
        font-size: 1rem;
        color: var(--ion-text-color);
      }

      .icon-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
        gap: 8px;
      }

      .icon-option {
        width: 56px;
        height: 56px;
        border: none;
        border-radius: 12px;
        background: var(--ion-color-light);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: var(--ion-text-color);
        transition: all 0.15s ease;

        &:hover {
          background: var(--ion-color-light-shade);
        }

        &.selected {
          background: var(--ion-color-primary);
          color: var(--ion-color-primary-contrast);
        }
      }
    `,
  ],
})
export class IconPickerComponent {
  @Input({ required: true }) icons!: readonly string[];
  @Input() value = '';
  @Input() label = 'Icon';
  @Input() previewColor = 'var(--ion-text-color)';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  searchTerm = '';

  get filteredIcons(): readonly string[] {
    if (!this.searchTerm) return this.icons;
    const term = this.searchTerm.toLowerCase();
    return this.icons.filter((icon) => icon.toLowerCase().includes(term));
  }

  selectIcon(icon: string) {
    this.value = icon;
    this.valueChange.emit(icon);
    this.isOpen = false;
  }
}
