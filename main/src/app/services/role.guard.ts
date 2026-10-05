import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Restreint l'accès à une route selon le rôle de l'utilisateur connecté.
 * Les rôles autorisés sont déclarés dans `data: { roles: [...] }` de la route.
 * Aucune restriction n'est appliquée si `roles` est absent.
 */
export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const allowedRoles = route.data?.['roles'] as string[] | undefined;
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const currentUser = authService.getCurrentUser();
  if (currentUser && allowedRoles.includes(currentUser.role)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
