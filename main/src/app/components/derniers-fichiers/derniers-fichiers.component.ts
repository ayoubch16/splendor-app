import { Component, Input, OnInit } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule, DatePipe } from '@angular/common';
import {DataService} from "../../services/data.service";
import {map, Observable} from "rxjs";
import {Bl, Devis, Facture} from "../../interfaces/entites";
import {
  DownloadFacturePrintComponent
} from "../../pages/factures/download-facture-print/download-facture-print.component";
import {DownloadFactureComponent} from "../../pages/factures/download-facture/download-facture.component";
import {DownloadBlPrintComponent} from "../../pages/bl/download-bl-print/download-bl-print.component";
import {DownloadBlComponent} from "../../pages/bl/download-bl/download-bl.component";
import {DownloadDevisPrintComponent} from "../../pages/devis/download-devis-print/download-devis-print.component";
import {DownloadDevisComponent} from "../../pages/devis/download-devis/download-devis.component";


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


  constructor(private dataService:DataService) { }

  ngOnInit(): void {
    this.chargerDerniersFichiers();
  }

  chargerDerniersFichiers(): void {
    // Simulation de données - À remplacer par un appel API réel
    switch(this.typeDocument) {
      case 'FACTURE':
        this.listeFichiers = this.getSampleFactures();
        break;
      case 'DEVIS':
        this.listeFichiers = this.getSampleDevis();
        break;
      case 'BL':
        this.listeFichiers = this.getSampleBL();
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



  download(element: any): void {
    console.log('Télécharger', element);
  }

  print(element: any): void {
    console.log('Imprimer', element);
  }

  // Exemples de données (à remplacer par des appels API)
   getSampleFactures(): Observable<Facture[]> {
    return this.dataService.getFactures()
  }

  getSampleDevis(): Observable<Devis[]> {
    return this.dataService.getAllDevis().pipe(
      map(devisList => devisList.slice(0, 5))
    );
  }

  private getSampleBL(): Observable<Bl[]>  {
    return this.dataService.getBls()
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
}
