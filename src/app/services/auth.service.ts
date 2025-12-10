import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user,
  User,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);

  /** Observable of the current user state */
  user$: Observable<User | null> = user(this.auth);

  /** Sign in with email and password */
  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  /** Create a new account with email and password */
  async register(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email, password);
  }

  /** Sign out the current user */
  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  /** Get the current user synchronously (may be null) */
  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  /** Re-authenticate and delete the current user account */
  async reauthenticateAndDeleteUser(password: string): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error('No user logged in');
    }

    const credential = EmailAuthProvider.credential(
      currentUser.email,
      password,
    );
    await reauthenticateWithCredential(currentUser, credential);
    await deleteUser(currentUser);
  }
}
