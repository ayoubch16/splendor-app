import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {CommonModule} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";
import {MatDivider} from "@angular/material/divider";

export interface ConfirmationModalData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isSuccess?: boolean;
}

@Component({
  selector: 'app-confirmation-modal',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatDivider],
  standalone: true,
  templateUrl: './confirmation-modal.component.html'
})
export class ConfirmationModalComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationModalData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
