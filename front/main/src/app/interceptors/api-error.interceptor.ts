import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorService } from '../services/error.service';
import { ErrorHandlerService } from '../services/error-handler.service';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);
  const errorHandlerService = inject(ErrorHandlerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = errorHandlerService.getErrorMessage(error);
      errorService.showError(message);
      return throwError(() => error);
    })
  );
};
