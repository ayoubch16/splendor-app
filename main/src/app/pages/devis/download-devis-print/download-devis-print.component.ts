import { Component, Input } from '@angular/core';
import {DownloadPdfComponent} from "../../../components/download-pdf/download-pdf.component";
import {MatIcon} from "@angular/material/icon";
import {Devis, TypeDocument} from "../../../interfaces/entites";
import {MatMenuItem} from "@angular/material/menu";

@Component({
  selector: 'app-download-devis-print',
  template: `
    <app-download-pdf
      [document]="devis"
      [options]="{type: TypeDocument.DEVIS, withSignature: false, printVersion: true}"
      filenamePrefix="Devis_print"
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
export class DownloadDevisPrintComponent {
  @Input() devis!: Devis;
  protected readonly TypeDocument = TypeDocument;
}
