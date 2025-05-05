import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatError, MatFormField, MatLabel} from "@angular/material/form-field";
import {CommonModule} from "@angular/common";
import {MatInput} from "@angular/material/input";
import {MatButton} from "@angular/material/button";
import {TypeDocument} from "../../interfaces/entites";



@Component({
  selector: 'app-send-email',
  standalone: true,
  imports: [
    MatDialogContent,
    MatFormField,
    MatDialogTitle,
    ReactiveFormsModule,
    MatDialogActions,
    CommonModule,
    MatInput,
    MatButton,
    MatLabel,
    MatError
  ],
  template: `
    <h2 mat-dialog-title>Envoyer le {{getDocumentTypeLabel()}} par email</h2>
    <mat-dialog-content>
      <mat-form-field appearance="fill" class="w-100">
        <mat-label>Email</mat-label>
        <input matInput [formControl]="emailControl" required>
        <mat-error *ngIf="emailControl.hasError('required')">Email requis</mat-error>
        <mat-error *ngIf="emailControl.hasError('email')">Email invalide</mat-error>
      </mat-form-field>

      <mat-form-field appearance="fill" class="w-100">
        <mat-label>Objet</mat-label>
        <input matInput [formControl]="subjectControl" required>
      </mat-form-field>

      <mat-form-field appearance="fill" class="w-100">
        <mat-label>Message</mat-label>
        <textarea matInput [formControl]="messageControl" rows="5"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="primary"
              (click)="onSend()"
              [disabled]="!emailControl.valid || !subjectControl.valid">
        Envoyer
      </button>
    </mat-dialog-actions>
  `
})
export class SendEmailComponent {
  emailControl = new FormControl(this.data.clientEmail, [Validators.required, Validators.email]);
  subjectControl = new FormControl(`${this.getDocumentTypeLabel()} ${this.data.documentNumber}`, [Validators.required]);
  messageControl = new FormControl(this.getDefaultMessage());

  constructor(
    public dialogRef: MatDialogRef<SendEmailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      documentId: number,
      documentNumber: string,
      clientEmail: string,
      typeDocument: TypeDocument
    }
  ) {}

  getDocumentTypeLabel(): string {
    switch(this.data.typeDocument) {
      case TypeDocument.DEVIS: return 'devis';
      case TypeDocument.FACTURE: return 'facture';
      case TypeDocument.BL: return 'bon de livraison';
      default: return 'document';
    }
  }

  getDefaultMessage(): string {
    const documentLabel = this.getDocumentTypeLabel();
    return `Bonjour,\n\nMerci de trouver ci-joint notre ${documentLabel} ${this.data.documentNumber}.\n\nCordialement,\nL'équipe`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSend(): void {
    if (this.emailControl.valid && this.subjectControl.valid) {
      this.dialogRef.close({
        email: this.emailControl.value,
        subject: this.subjectControl.value,
        message: this.messageControl.value,
        documentType: this.data.typeDocument
      });
    }
  }
}
