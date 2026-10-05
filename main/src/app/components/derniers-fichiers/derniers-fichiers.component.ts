import { Component, Input, OnInit } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule, DatePipe } from '@angular/common';
import {DataService} from "../../services/data.service";
import {Observable} from "rxjs";
import {Bl, Devis, Facture, TypeDocument} from "../../interfaces/entites";
import {
  DownloadFacturePrintComponent
} from "../../pages/factures/download-facture-print/download-facture-print.component";
import {DownloadFactureComponent} from "../../pages/factures/download-facture/download-facture.component";
import {DownloadBlPrintComponent} from "../../pages/bl/download-bl-print/download-bl-print.component";
import {DownloadBlComponent} from "../../pages/bl/download-bl/download-bl.component";
import {DownloadDevisPrintComponent} from "../../pages/devis/download-devis-print/download-devis-print.component";
import {DownloadDevisComponent} from "../../pages/devis/download-devis/download-devis.component";
import {PdfViewerModalComponent} from "../pdf-viewer-modal/pdf-viewer-modal.component";
import {PdfService} from "../../services/pdf.service";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";


@Component({
  selector: 'app-derniers-fichiers',
  standalone: true,
  imports: [MaterialModule, MatTableModule, MatMenuModule, CommonModule, DatePipe, DownloadFacturePrintComponent, DownloadFactureComponent, DownloadBlPrintComponent, DownloadBlComponent, DownloadDevisPrintComponent, DownloadDevisComponent],
  templateUrl: './derniers-fichiers.component.html'
})
export class DerniersFichiersComponent implements OnInit {
  @Input() typeDocument = ''; // 'FACTURE', 'DEVIS' ou 'BL'
  listeFichiers: Observable<any[]> ;
  displayedColumns: string[] = ['numero', 'client', 'montant', 'statut', 'date', 'actions'];
  isLoading = false;


  constructor(
    private dataService:DataService,
    private pdfService: PdfService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.chargerDerniersFichiers();
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }


  chargerDerniersFichiers(): void {
    switch(this.typeDocument) {
      case 'FACTURE':
        this.listeFichiers = this.dataService.getLastFactures();
        break;
      case 'DEVIS':
        this.listeFichiers = this.dataService.getLastDevis();
        break;
      case 'BL':
        this.listeFichiers = this.dataService.getLastBls();
        break;
    }
  }

  getCardClass(): string {
    switch(this.typeDocument) {
      case 'DEVIS': return 'bg-light-primary';
      case 'FACTURE': return 'bg-light-error';
      case 'BL': return 'bg-light-success';
      default: return 'bg-light-info';
    }
  }


  getIconClass(): string {
    switch(this.typeDocument) {
      case 'DEVIS':
        return 'bg-primary'; // Couleur d'icône pour DEVIS
      case 'FACTURE':
        return 'bg-error';   // Couleur d'icône pour FACTURE
      case 'BL':
        return 'bg-success'; // Couleur d'icône pour BL
      default:
        return 'bg-info';    // Couleur par défaut
    }
  }
  getDisplayedColumns(): string[] {
    const baseColumns = ['numero', 'client', 'statut', 'date', 'actions'];

    // Ajoute la colonne montant seulement si ce n'est pas un BL
    if (this.typeDocument !== 'BL') {
      baseColumns.splice(2, 0, 'montant'); // Insère 'montant' après 'client'
    }

    return baseColumns;
  }

  consulterDevis(devis: Devis): void {
    this.isLoading = true;

    this.pdfService.generatePdf(devis,{ type: TypeDocument.DEVIS, withSignature: false })
      .then(blob => {
        this.dialog.open(PdfViewerModalComponent, {
          width: '90%',
          maxWidth: '1000px',
          data: {
            title: `Devis ${devis.numDevis}`,
            pdfBlob: blob,
            filename: `Devis_${devis.numDevis}.pdf`
          }
        });
        this.isLoading = false;
      })
      .catch(error => {
        this.showErrorMessage('Erreur lors de la génération du PDF');
        this.isLoading = false;
        console.error(error);
      });
  }

  consulterBl(bl: Bl): void {
    this.isLoading = true;
    this.pdfService.generatePdf(bl, { type: TypeDocument.BL, withSignature: false })
      .then(blob => {

        this.dialog.open(PdfViewerModalComponent, {
          width: '90%',
          maxWidth: '1000px',
          data: {
            title: `BL ${bl.numBl}`,
            pdfBlob: blob,
            filename: `BL_${bl.numBl}.pdf`
          }
        });
        this.isLoading = false;
      })
      .catch(error => {
        this.showErrorMessage('Erreur lors de la génération du PDF');
        this.isLoading = false;
        console.error(error);
      });
  }


  consulterFacture(facture: Facture): void {
    this.isLoading = true;
    this.pdfService.generatePdf(facture, { type: TypeDocument.FACTURE, withSignature: false })
      .then(blob => {

        this.dialog.open(PdfViewerModalComponent, {
          width: '90%',
          maxWidth: '1000px',
          data: {
            title: `Facture ${facture.numFacture}`,
            pdfBlob: blob,
            filename: `Facture_${facture.numFacture}.pdf`
          }
        });
        this.isLoading = false;
      })
      .catch(error => {
        this.showErrorMessage('Erreur lors de la génération du PDF');
        this.isLoading = false;
        console.error(error);
      });
  }

}
