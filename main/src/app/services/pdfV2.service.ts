// src/app/services/pdf.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {PdfViewerModalComponent} from "../components/pdf-viewer-modal/pdf-viewer-modal.component";
import {MatDialog} from "@angular/material/dialog";

@Injectable({
  providedIn: 'root'
})
export class PdfV2Service {
  // private apiUrl = 'http://localhost:8000/api';
  private apiUrl = 'https://splendorart.ma/app/api/index.php';


  constructor(private http: HttpClient,
              private dialog: MatDialog,
  ) { }

  downloadPdf(documentType: 'devis'|'facture'|'bl', documentId: number, imprimable : boolean): void {
    this.http.post(
      `${this.apiUrl}/download-pdf`,
      { type: documentType, id: documentId , imprimable:imprimable},
      { responseType: 'blob' as 'json' } // Solution clé ici
    ).subscribe({
      next: (response: any) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        this.savePdf(blob, documentType, documentId,imprimable);
      },
      error: (err) => {
        console.error('Erreur lors du téléchargement', err);
      }
    });
  }

  public savePdf(blob: Blob, type: string, id: number,imprimable:boolean): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_${id}_${new Date().toISOString().slice(0,10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  previewPdf(documentType: 'devis'|'facture'|'bl', documentId: number,imprimable : boolean): void {
    this.http.post(
      `${this.apiUrl}/download-pdf`,
      { type: documentType, id: documentId,imprimable : imprimable },
      { responseType: 'blob' } // La réponse est un Blob
    ).subscribe({
      next: (pdfBlob: Blob) => { // Type corrigé en Blob
        this.openPdfModal(pdfBlob, documentType, documentId);
      },
      error: (err) => {
        console.error('Erreur lors du chargement du PDF', err);
      }
    });
  }

  public openPdfModal(pdfBlob: Blob, type: string, id: number): void {
    this.dialog.open(PdfViewerModalComponent, {
      width: '80%',
      maxWidth: '900px',
      data: {
        title: `${type.toUpperCase()} N°${id}`,
        pdfBlob: pdfBlob, // Doit être un Blob
        filename: `${type}_${id}_${new Date().toISOString().slice(0,10)}.pdf`
      }
    });
  }
}
