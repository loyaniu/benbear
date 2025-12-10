import {
  Injectable,
  inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import {
  Firestore,
  doc,
  docData,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import {
  UserProfile,
  UserSettings,
  DEFAULT_USER_SETTINGS,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private injector = inject(Injector);

  /** Get user profile with real-time updates */
  getUserProfile(): Observable<UserProfile | undefined> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of(undefined);
        return runInInjectionContext(this.injector, () => {
          const userRef = doc(this.firestore, `users/${user.uid}`);
          return docData(userRef) as Observable<UserProfile | undefined>;
        });
      }),
    );
  }

  /** Fetch user profile once */
  async fetchUserProfile(): Promise<UserProfile | null> {
    const user = this.authService.currentUser;
    if (!user) return null;

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      // Create default profile if it doesn't exist
      const defaultProfile: UserProfile = {
        email: user.email || '',
        displayName: '',
        createdAt: serverTimestamp() as any,
        settings: DEFAULT_USER_SETTINGS,
      };
      await setDoc(userRef, defaultProfile);
      return defaultProfile;
    }

    return snapshot.data() as UserProfile;
  }

  /** Update user profile fields */
  async updateProfile(
    data: Partial<Pick<UserProfile, 'displayName'>>,
  ): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userRef = doc(this.firestore, `users/${user.uid}`);
    await updateDoc(userRef, data);
  }

  /** Update user settings */
  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userRef = doc(this.firestore, `users/${user.uid}`);

    // Update nested settings object
    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(settings)) {
      updates[`settings.${key}`] = value;
    }

    await updateDoc(userRef, updates);
  }

  /** Create user profile (called on registration) */
  async createUserProfile(email: string, displayName: string): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const profile: UserProfile = {
      email,
      displayName,
      createdAt: serverTimestamp() as any,
      settings: DEFAULT_USER_SETTINGS,
    };

    await setDoc(userRef, profile);
  }

  /** Delete all user data from Firestore */
  async deleteAllUserData(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    const uid = user.uid;
    const batch = writeBatch(this.firestore);

    // Delete all subcollections
    const subcollections = [
      'transactions',
      'accounts',
      'categories',
      'monthly_stats',
    ];
    for (const subcol of subcollections) {
      const colRef = collection(this.firestore, `users/${uid}/${subcol}`);
      const snapshot = await getDocs(colRef);
      snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
    }

    // Delete user document
    const userRef = doc(this.firestore, `users/${uid}`);
    batch.delete(userRef);

    await batch.commit();
  }
}
