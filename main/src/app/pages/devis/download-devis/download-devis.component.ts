import { Component, Input } from '@angular/core';
import {DownloadPdfComponent} from "../../../components/download-pdf/download-pdf.component";
import {MatIcon} from "@angular/material/icon";
import {Devis, TypeDocument} from "../../../interfaces/entites";
import {MatMenuItem} from "@angular/material/menu";

@Component({
  selector: 'app-download-devis',
  template: `
    <app-download-pdf
      [document]="devis"
      [options]="{type: TypeDocument.DEVIS, withSignature: true}"
      filenamePrefix="Devis"
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
export class DownloadDevisComponent {
  @Input() devis!: Devis;
  protected readonly TypeDocument = TypeDocument;
}
