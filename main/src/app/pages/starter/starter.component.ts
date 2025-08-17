import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import { MaterialModule } from '../../material.module';
import {CompteurFileComponent} from "../../components/compteur-file/compteur-file.component";
import {TypeDocument} from "../../interfaces/entites";
import {DerniersFichiersComponent} from "../../components/derniers-fichiers/derniers-fichiers.component";
import {AuthService} from "../../services/auth.service";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-starter',
  imports: [
    MaterialModule,
    CompteurFileComponent,
    DerniersFichiersComponent,
    CommonModule
  ],
  templateUrl: './starter.component.html',
  encapsulation: ViewEncapsulation.None,
  standalone: true
})
export class StarterComponent {
  @Input() typeDocument: TypeDocument;

  constructor(public authService: AuthService) {
  }

  user: any;

}
