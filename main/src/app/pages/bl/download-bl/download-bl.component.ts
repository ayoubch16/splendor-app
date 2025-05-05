import { Component, Input } from '@angular/core';
import {DownloadPdfComponent} from "../../../components/download-pdf/download-pdf.component";
import {MatIcon} from "@angular/material/icon";
import {Bl, TypeDocument} from "../../../interfaces/entites";
import {MatMenuItem} from "@angular/material/menu";

@Component({
  selector: 'app-download-bl',
  template: `
    <app-download-pdf
      [document]="bl"
      [options]="{type: TypeDocument.BL, withSignature: true}"
      filenamePrefix="Bl"
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
export class DownloadBlComponent {
  @Input() bl!: Bl;
  protected readonly TypeDocument = TypeDocument;
}
