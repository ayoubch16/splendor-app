import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = 'https://devchoukri.com/splendor/api/index.php'; // Remplacez par votre URL d'API

  constructor(private http: HttpClient) {}

  sendDevisByEmail(devisId: number, payload: EmailPayload): Observable<EmailResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<EmailResponse>(
      `${this.apiUrl}/devis/${devisId}/send-email`,
      payload,
      { headers }
    );
  }
}

// Utilisation de votre PdfService existant
import { PdfService } from './pdf.service'; // Votre service existant
import {Devis, EmailPayload, EmailResponse, TypeDocument} from '../interfaces/entites';
import {MatDialog} from "@angular/material/dialog";
import {SendEmailComponent} from "../components/send-email/send-email.component";
import {finalize} from "rxjs/operators";

// Composant principal avec la fonction modifiée utilisant votre PdfService
export class DevisComponent {
  private isLoading: boolean;

  constructor(
    private dialog: MatDialog,
    private dataService: any, // Votre service de données
    private emailService: EmailService,
    private pdfService: PdfService // Votre service PDF existant
  ) {}

  async envoyerParMail(devis: Devis): Promise<void> {
    const dialogRef = this.dialog.open(SendEmailComponent, {
      width: '600px',
      data: {
        documentId: devis.id!,
        documentNumber: devis.numDevis,
        clientEmail: devis.client?.email,
        typeDocument: TypeDocument.DEVIS,
        options: {
          imprimable: true
        }
      }
    });

    dialogRef.afterClosed().subscribe(async (resultEmail) => {
      if (resultEmail) {
        this.isLoading = true;

        try {
          let pdfBase64 = '';
          let fileName = '';

          // Générer le PDF si nécessaire
          if (resultEmail.options?.imprimable) {
            this.showInfoMessage('Génération du PDF en cours...');

            // Utiliser votre PdfService existant
            const pdfOptions = {
              type: TypeDocument.DEVIS,
              withSignature: true,
              printVersion: true
            };

            // Générer le PDF en utilisant votre service
            const pdfBlob = await this.pdfService.generatePdf(devis, pdfOptions);

            // Convertir le Blob en base64
            pdfBase64 = await this.blobToBase64(pdfBlob);
            fileName = `devis-${devis.numDevis}.pdf`;
          }

          const payload: EmailPayload = {
            email: resultEmail.email,
            subject: resultEmail.subject || `Devis ${devis.numDevis}`,
            message: resultEmail.message || `Veuillez trouver ci-joint notre devis n°${devis.numDevis}.`,
            imprimable: resultEmail.options?.imprimable || false,
            pdfBase64: pdfBase64,
            fileName: fileName
          };

          // Envoyer l'email
          this.emailService.sendDevisByEmail(devis.id!, payload)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                if (response.success) {
                  this.showSuccessMessage('Email envoyé avec succès');
                } else {
                  this.showErrorMessage(`Erreur: ${response.message}`);
                }
              },
              error: (error) => {
                this.showErrorMessage(`Erreur lors de l'envoi: ${error.message}`);
              }
            });

        } catch (error) {
          this.isLoading = false;
          this.showErrorMessage(`Erreur lors de la génération du PDF:`+error);
        }
      }
    });
  }

  // Fonction utilitaire pour convertir Blob en base64
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private showSuccessMessage(message: string): void {
    // Implémentez votre logique de notification (toast, snackbar, etc.)
    console.log('Success:', message);
  }

  private showErrorMessage(message: string): void {
    // Implémentez votre logique de notification d'erreur
    console.error('Error:', message);
  }

  private showInfoMessage(message: string): void {
    // Implémentez votre logique de notification d'info
    console.info('Info:', message);
  }
}
