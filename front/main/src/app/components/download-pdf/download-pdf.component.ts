import {Component, Input} from '@angular/core';
import {PdfService} from "../../services/pdf.service";
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {CommonModule} from "@angular/common";
import {Client, TypeDocument} from "../../interfaces/entites";

export interface PdfDocument {
  id: number;
  reference: string;
  client:Client
}

export interface PdfOptions {
  type: TypeDocument;
  withSignature: boolean;
  printVersion?: boolean;
}

@Component({
  selector: 'app-download-pdf',
  template: `
    <ng-content></ng-content>
    <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
  `,
  standalone: true,
  imports: [
    MatProgressSpinner,
    CommonModule
  ],
  styles: [`
    :host {
      display: inline-block;
    }

    mat-spinner {
      margin-left: 8px;
      display: inline-block;
    }
  `]
})
export class DownloadPdfComponent {
  @Input() document!: any;
  @Input() options: PdfOptions = {
    type: TypeDocument.FACTURE,
    withSignature: true
  };
  @Input() filenamePrefix = 'Document';

  isLoading = false;

  constructor(
    private pdfService: PdfService,
    private snackBar: MatSnackBar
  ) { }

  download(): void {
    if (!this.document) {
      console.error('No document provided');
      return;
    }

    this.isLoading = true;

    this.pdfService.generateDocumentPdf(this.document, this.options)
      .then(blob => {
        this.pdfService.downloadPdf(blob, `${this.filenamePrefix}_${this.getDocumentNumber()}.pdf`);
        this.isLoading = false;
      })
      .catch(error => {
        this.showErrorMessage('Erreur lors de la génération du PDF');
        this.isLoading = false;
        console.error(error);
      });
  }

  getDocumentNumber(): string {
    switch (this.options.type) {
      case 'FACTURE':
        return this.document.numFacture;
      case 'DEVIS':
        return this.document.numDevis;
      case 'BL':
        return this.document.numBl;
      default:
        throw new Error('Type de document non supporté');
    }
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
