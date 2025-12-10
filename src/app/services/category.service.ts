import {
  Injectable,
  inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  getDocs,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import {
  Category,
  CategoryType,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../models/category.model';
import { Observable, of, switchMap, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private injector = inject(Injector);

  /** Get all categories for the current user */
  getCategories(): Observable<Category[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of([]);
        return runInInjectionContext(this.injector, () => {
          const categoriesRef = collection(
            this.firestore,
            `users/${user.uid}/categories`,
          );
          const q = query(categoriesRef, orderBy('order'));
          return collectionData(q, { idField: 'id' }) as Observable<Category[]>;
        });
      }),
    );
  }

  /** Get categories by type (filtered client-side to avoid composite index) */
  getCategoriesByType(type: CategoryType): Observable<Category[]> {
    return this.getCategories().pipe(
      map((categories) =>
        categories
          .filter((c) => c.type === type)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      ),
    );
  }

  /** Get a single category by ID */
  getCategory(id: string): Observable<Category | undefined> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of(undefined);
        return runInInjectionContext(this.injector, () => {
          const categoryRef = doc(
            this.firestore,
            `users/${user.uid}/categories/${id}`,
          );
          return docData(categoryRef, {
            idField: 'id',
          }) as Observable<Category>;
        });
      }),
    );
  }

  /** Add a new category */
  async addCategory(category: Omit<Category, 'id'>): Promise<string> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const categoriesRef = collection(
      this.firestore,
      `users/${user.uid}/categories`,
    );
    const docRef = await addDoc(categoriesRef, category);
    return docRef.id;
  }

  /** Update an existing category */
  async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const categoryRef = doc(
      this.firestore,
      `users/${user.uid}/categories/${id}`,
    );
    await updateDoc(categoryRef, category);
  }

  /** Delete a category */
  async deleteCategory(id: string): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const categoryRef = doc(
      this.firestore,
      `users/${user.uid}/categories/${id}`,
    );
    await deleteDoc(categoryRef);
  }

  /** Initialize default categories for a new user */
  async initializeDefaultCategories(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const categoriesRef = collection(
      this.firestore,
      `users/${user.uid}/categories`,
    );

    // Check if user already has categories
    const snapshot = await getDocs(categoriesRef);
    if (!snapshot.empty) return;

    // Add default categories
    const allDefaults = [
      ...DEFAULT_EXPENSE_CATEGORIES,
      ...DEFAULT_INCOME_CATEGORIES,
    ];

    for (const category of allDefaults) {
      await addDoc(categoriesRef, category);
    }
  }
}
