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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trash } from 'ionicons/icons';
import { CategoryService } from '../../services/category.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { Category, CategoryType } from '../../models/category.model';
import { CategoryIconComponent } from '../../components/category-icon/category-icon.component';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    CategoryIconComponent,
  ],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.scss',
})
export class CategoriesPage implements OnInit {
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmDialogService);

  categories$!: Observable<Category[]>;
  selectedType: CategoryType = 'expense';

  constructor() {
    addIcons({ add, trash });
  }

  ngOnInit() {
    this.loadCategories();
  }

  private loadCategories() {
    this.categories$ = this.categoryService
      .getCategories()
      .pipe(
        map((categories) =>
          categories.filter((c) => c.type === this.selectedType),
        ),
      );
  }

  onSegmentChange(event: CustomEvent) {
    this.selectedType = event.detail.value as CategoryType;
    this.loadCategories();
  }

  onAddCategory() {
    this.router.navigate(['/categories/new'], {
      queryParams: { type: this.selectedType },
    });
  }

  onEditCategory(category: Category) {
    this.router.navigate(['/categories/edit', category.id]);
  }

  async onDeleteCategory(category: Category) {
    const confirmed = await this.confirmDialog.confirmDelete(
      category.name,
      'Category',
    );
    if (confirmed) {
      this.categoryService.deleteCategory(category.id!);
    }
  }
}
