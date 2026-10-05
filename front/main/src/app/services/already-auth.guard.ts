import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const alreadyAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // Si déjà authentifié, redirection vers le dashboard
    return router.createUrlTree(['/dashboard']);
  }

  // Si non authentifié, autorise l'accès à la page de login
  return true;
};
