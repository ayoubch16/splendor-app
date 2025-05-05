import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatOption, MatSelect } from "@angular/material/select";
import { MatButton } from "@angular/material/button";
import { CommonModule } from "@angular/common";
import {StatutBL, StatutDevis, StatutFacture, TypeDocument} from "../../interfaces/entites";


interface DocumentData {
  currentStatus: string;
  documentId: number;
  documentType: TypeDocument;
}

@Component({
  selector: 'app-change-status',
  standalone: true,
  imports: [
    MatDialogContent,
    MatFormField,
    MatSelect,
    ReactiveFormsModule,
    MatOption,
    MatDialogActions,
    MatButton,
    MatDialogTitle,
    CommonModule,
    MatLabel
  ],
  template: `
    <h2 mat-dialog-title>Changer le statut du {{getDocumentTypeLabel()}}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="fill" class="w-100">
        <mat-label>Nouveau statut</mat-label>
        <mat-select [formControl]="statusControl">
          <mat-option *ngFor="let status of getStatusOptions()" [value]="status">
            {{ status }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSave()">Enregistrer</button>
    </mat-dialog-actions>
  `
})
export class ChangeStatusComponent {
  statusControl = new FormControl(this.data.currentStatus);

  constructor(
    public dialogRef: MatDialogRef<ChangeStatusComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DocumentData
  ) {}

  getDocumentTypeLabel(): string {
    switch(this.data.documentType) {
      case TypeDocument.DEVIS: return 'devis';
      case TypeDocument.FACTURE: return 'facture';
      case TypeDocument.BL: return 'bl';
      default: return 'document';
    }
  }

  getStatusOptions(): string[] {
    switch(this.data.documentType) {
      case TypeDocument.DEVIS:
        return Object.values(StatutDevis);
      case TypeDocument.FACTURE:
        return Object.values(StatutFacture);
      case TypeDocument.BL:
        return Object.values(StatutBL);
      default:
        return [];
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.statusControl.value) {
      this.dialogRef.close(this.statusControl.value);
    }
  }
}
