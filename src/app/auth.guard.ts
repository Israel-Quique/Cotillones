import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

  if (token) {
    return true;
  }

  router.navigate([''], { queryParams: { redirectTo: state.url } });
  return false;
};

