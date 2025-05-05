import { Component, Input } from '@angular/core';
import {DownloadPdfComponent} from "../../../components/download-pdf/download-pdf.component";
import {MatIcon} from "@angular/material/icon";
import {Facture, TypeDocument} from "../../../interfaces/entites";
import {MatMenuItem} from "@angular/material/menu";

@Component({
  selector: 'app-download-facture',
  template: `
    <app-download-pdf
      [document]="facture"
      [options]="{type: TypeDocument.FACTURE, withSignature: true}"
      filenamePrefix="Facture"
      #downloadPdf>
      <button mat-menu-item (click)="downloadPdf.download()">
        <mat-icon>download</mat-icon> Télécharger
      </button>
    </app-download-pdf>
  `,
  standalone: true,
  imports: [
    DownloadPdfComponent,
    MatIcon,
    MatMenuItem
  ],
  styles: []
})
export class DownloadFactureComponent {
  @Input() facture!: Facture;
  protected readonly TypeDocument = TypeDocument;
}
