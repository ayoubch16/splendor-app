import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from '../components/error-dialog/error-dialog.component';

@Injectable({ providedIn: 'root' })
export class ErrorService {

  constructor(private dialog: MatDialog) {}

  showError(message: string, errors?: Record<string, string[]>): void {
    // Évite d'ouvrir plusieurs popups d'erreur simultanément
    if (this.dialog.openDialogs.some(d => d.componentInstance instanceof ErrorDialogComponent)) {
      return;
    }

    const data: ErrorDialogData = { message, errors };
    this.dialog.open(ErrorDialogComponent, {
      data,
      width: 'auto',
      maxWidth: '560px',
      disableClose: false,
      panelClass: 'error-dialog-panel',
    });
  }
}
