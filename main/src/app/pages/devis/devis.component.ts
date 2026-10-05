import { Component } from '@angular/core';
import {FormDevisComponent} from "./form-devis/form-devis.component";

@Component({
  selector: 'app-devis',
  imports: [FormDevisComponent],
  templateUrl: './devis.component.html',
  standalone: true
})
export class DevisComponent {

}
