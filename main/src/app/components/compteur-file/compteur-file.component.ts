import { Component, Input, OnInit } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { MatButtonModule } from '@angular/material/button';
import { TablerIconsModule } from 'angular-tabler-icons';
import {NgClass} from "@angular/common";
import {DataService} from "../../services/data.service";

@Component({
  selector: 'app-compteur-file',
  standalone: true,
  imports: [MaterialModule, MatButtonModule, TablerIconsModule, NgClass],
  templateUrl: './compteur-file.component.html'
})
export class CompteurFileComponent implements OnInit {
  @Input() typeDocument = ''; // DEVIS, FACTURE ou BL
  nombreDocuments: number;

  constructor(private dataService: DataService) {
  }


  ngOnInit(): void {
    this.calculerNombreDocuments();
    this.dataService.getCptFacture().subscribe();
  }

  calculerNombreDocuments(): void {
    switch(this.typeDocument) {
      case 'DEVIS':
        this.dataService.getCptDevis().subscribe(
          (count: number) => this.nombreDocuments = count
        );
        break;
      case 'FACTURE':
        this.dataService.getCptFacture().subscribe(
          (count: number) => this.nombreDocuments = count
        );
        break;
      case 'BL':
        this.dataService.getCptBl().subscribe(
          (count: number) => this.nombreDocuments = count
        );
        break;
      default:
        this.nombreDocuments = 0;
    }
  }

  getCardClass(): string {
    switch(this.typeDocument) {
      case 'DEVIS':
        return 'bg-light-primary'; // Classe CSS pour DEVIS
      case 'FACTURE':
        return 'bg-light-error';   // Classe CSS pour FACTURE
      case 'BL':
        return 'bg-light-success'; // Classe CSS pour BL
      default:
        return 'bg-light-info';    // Classe par défaut
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
}
