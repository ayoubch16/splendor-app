import { Component, Input } from '@angular/core';
import {DownloadPdfComponent} from "../../../components/download-pdf/download-pdf.component";
import {MatIcon} from "@angular/material/icon";
import {Bl, TypeDocument} from "../../../interfaces/entites";
import {MatMenuItem} from "@angular/material/menu";

@Component({
  selector: 'app-download-bl-print',
  template: `
    <app-download-pdf
      [document]="bl"
      [options]="{type: TypeDocument.BL, withSignature: false, printVersion: true}"
      filenamePrefix="Bl_print"
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
export class DownloadBlPrintComponent {
  @Input() bl!: Bl;
  protected readonly TypeDocument = TypeDocument;
}
