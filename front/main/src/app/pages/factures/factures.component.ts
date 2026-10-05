import { Component } from '@angular/core';
import {FormFactureComponent} from "./form-facture/form-facture.component";

@Component({
  selector: 'app-factures',
  imports: [FormFactureComponent],
  standalone: true,
  templateUrl: './factures.component.html'
})
export class FacturesComponent {

}
