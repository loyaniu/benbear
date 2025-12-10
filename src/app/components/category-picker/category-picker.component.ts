import { Component, Input, Output, EventEmitter } from '@angular/core';
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
import { FormsModule } from '@angular/forms';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-category-picker',
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
        <div class="selected-category">
          @if (selectedCategory) {
            <span
              class="category-icon-preview"
              [style.background-color]="selectedCategory.color"
            >
              <i class="ph ph-{{ selectedCategory.icon }}"></i>
            </span>
            <span class="category-name">{{ selectedCategory.name }}</span>
          } @else {
            <span class="placeholder">Select a category</span>
          }
        </div>
      </ion-label>
    </ion-item>

    <ion-modal [isOpen]="isOpen" (didDismiss)="isOpen = false">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Select Category</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="isOpen = false">Done</ion-button>
            </ion-buttons>
          </ion-toolbar>
          @if (categories.length > 6) {
            <ion-toolbar>
              <ion-searchbar
                [(ngModel)]="searchTerm"
                placeholder="Search categories"
                [debounce]="250"
              ></ion-searchbar>
            </ion-toolbar>
          }
        </ion-header>
        <ion-content class="ion-padding">
          <div class="category-grid">
            @for (category of filteredCategories; track category.id) {
              <button
                type="button"
                class="category-option"
                [class.selected]="value === category.id"
                (click)="selectCategory(category)"
              >
                <span
                  class="category-icon"
                  [style.background-color]="category.color"
                >
                  <i class="ph ph-{{ category.icon }}"></i>
                </span>
                <span class="category-label">{{ category.name }}</span>
              </button>
            }
          </div>
          @if (filteredCategories.length === 0) {
            <div class="empty-state">
              <p>No categories found</p>
            </div>
          }
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [
    `
      .selected-category {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
      }

      .category-icon-preview {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1rem;
      }

      .category-name {
        font-size: 1rem;
        color: var(--ion-text-color);
      }

      .placeholder {
        color: var(--ion-color-medium);
      }

      .category-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .category-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 12px 8px;
        border: none;
        border-radius: 12px;
        background: var(--ion-color-light);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          background: var(--ion-color-light-shade);
        }

        &.selected {
          background: var(--ion-color-primary-tint);
          outline: 2px solid var(--ion-color-primary);
        }
      }

      .category-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.5rem;
      }

      .category-label {
        font-size: 0.75rem;
        color: var(--ion-text-color);
        text-align: center;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--ion-color-medium);
      }
    `,
  ],
})
export class CategoryPickerComponent {
  @Input({ required: true }) categories: Category[] = [];
  @Input() value: string | null = null;
  @Input() label = 'Category';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  searchTerm = '';

  get selectedCategory(): Category | undefined {
    return this.categories.find((c) => c.id === this.value);
  }

  get filteredCategories(): Category[] {
    if (!this.searchTerm) return this.categories;
    const term = this.searchTerm.toLowerCase();
    return this.categories.filter((c) => c.name.toLowerCase().includes(term));
  }

  selectCategory(category: Category) {
    this.value = category.id!;
    this.valueChange.emit(category.id!);
    this.isOpen = false;
  }
}
