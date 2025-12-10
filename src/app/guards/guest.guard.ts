import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, timeout } from 'rxjs/operators';

/** Redirect authenticated users away from login/register pages */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    timeout(5000),
    take(1),
    map((user) => {
      if (user) {
        // User is logged in, redirect to tabs home
        router.navigate(['/tabs/home']);
        return false;
      }
      return true;
    }),
  );
};
