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
import { CategoryService } from '../../services/category.service';
import { ColorPickerComponent } from '../../components/color-picker/color-picker.component';
import { IconPickerComponent } from '../../components/icon-picker/icon-picker.component';
import {
  Category,
  CategoryType,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from '../../models/category.model';

@Component({
  selector: 'app-category-form',
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
  templateUrl: './category-form.page.html',
  styleUrl: './category-form.page.scss',
})
export class CategoryFormPage implements OnInit {
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = false;
  categoryId: string | null = null;
  isLoading = false;
  errorMessage = '';

  name = '';
  type: CategoryType = 'expense';
  icon = 'fork-knife';
  color = '#EF4444';
  order = 1;

  readonly icons = CATEGORY_ICONS;
  readonly colors = CATEGORY_COLORS;

  ngOnInit() {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.categoryId;

    if (this.isEditMode) {
      this.loadCategory();
    } else {
      // Get type from query params for new category
      const typeParam = this.route.snapshot.queryParamMap.get('type');
      if (typeParam === 'income' || typeParam === 'expense') {
        this.type = typeParam;
      }
    }
  }

  private loadCategory() {
    if (!this.categoryId) return;

    this.isLoading = true;
    this.categoryService.getCategory(this.categoryId).subscribe({
      next: (category) => {
        if (category) {
          this.name = category.name;
          this.type = category.type;
          this.icon = category.icon;
          this.color = category.color;
          this.order = category.order;
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load category';
        this.isLoading = false;
      },
    });
  }

  async onSave() {
    if (!this.name.trim()) {
      this.errorMessage = 'Please enter category name';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const categoryData: Omit<Category, 'id'> = {
      name: this.name.trim(),
      type: this.type,
      icon: this.icon,
      color: this.color,
      order: this.order,
    };

    try {
      if (this.isEditMode && this.categoryId) {
        await this.categoryService.updateCategory(
          this.categoryId,
          categoryData,
        );
      } else {
        await this.categoryService.addCategory(categoryData);
      }
      this.router.navigate(['/categories']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to save category';
    } finally {
      this.isLoading = false;
    }
  }
}
