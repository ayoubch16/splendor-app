import { Component, Input } from '@angular/core';
import {DownloadPdfComponent} from "../../../components/download-pdf/download-pdf.component";
import {MatIcon} from "@angular/material/icon";
import {Facture, TypeDocument} from "../../../interfaces/entites";
import {MatMenuItem} from "@angular/material/menu";

@Component({
  selector: 'app-download-facture-print',
  template: `
    <app-download-pdf
      [document]="facture"
      [options]="{type: TypeDocument.FACTURE, withSignature: false, printVersion: true}"
      filenamePrefix="Facture_print"
      #downloadPdf>
      <button mat-menu-item (click)="downloadPdf.download()">
        <mat-icon>print</mat-icon> Version imprimable
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
export class DownloadFacturePrintComponent {
  @Input() facture!: Facture;
  protected readonly TypeDocument = TypeDocument;
}
