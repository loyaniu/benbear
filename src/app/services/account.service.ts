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
  getDocs,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Account, DEFAULT_ACCOUNT } from '../models/account.model';
import { Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private injector = inject(Injector);

  /** Get all accounts for the current user */
  getAccounts(): Observable<Account[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of([]);
        return runInInjectionContext(this.injector, () => {
          const accountsRef = collection(
            this.firestore,
            `users/${user.uid}/accounts`,
          );
          return collectionData(accountsRef, { idField: 'id' }) as Observable<
            Account[]
          >;
        });
      }),
    );
  }

  /** Fetch all accounts once (direct server read, guaranteed fresh) */
  async fetchAccounts(): Promise<Account[]> {
    const user = this.authService.currentUser;
    if (!user) return [];

    const accountsRef = collection(
      this.firestore,
      `users/${user.uid}/accounts`,
    );
    const snapshot = await getDocs(accountsRef);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Account,
    );
  }

  /** Get a single account by ID */
  getAccount(id: string): Observable<Account | undefined> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of(undefined);
        return runInInjectionContext(this.injector, () => {
          const accountRef = doc(
            this.firestore,
            `users/${user.uid}/accounts/${id}`,
          );
          return docData(accountRef, { idField: 'id' }) as Observable<Account>;
        });
      }),
    );
  }

  /** Add a new account */
  async addAccount(account: Omit<Account, 'id'>): Promise<string> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const accountsRef = collection(
      this.firestore,
      `users/${user.uid}/accounts`,
    );
    const docRef = await addDoc(accountsRef, account);
    return docRef.id;
  }

  /** Update an existing account */
  async updateAccount(id: string, account: Partial<Account>): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const accountRef = doc(this.firestore, `users/${user.uid}/accounts/${id}`);
    await updateDoc(accountRef, account);
  }

  /** Delete an account */
  async deleteAccount(id: string): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const accountRef = doc(this.firestore, `users/${user.uid}/accounts/${id}`);
    await deleteDoc(accountRef);
  }

  /** Initialize default account for a new user */
  async initializeDefaultAccount(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const accountsRef = collection(
      this.firestore,
      `users/${user.uid}/accounts`,
    );

    // Check if user already has accounts
    const snapshot = await getDocs(accountsRef);
    if (!snapshot.empty) return;

    // Add default account
    await addDoc(accountsRef, DEFAULT_ACCOUNT);
  }
}
