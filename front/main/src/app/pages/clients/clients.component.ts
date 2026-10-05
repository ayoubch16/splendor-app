import { Component } from '@angular/core';
import {FormClientComponent} from "./form-client/form-client.component";

@Component({
  selector: 'app-clients',
  imports: [FormClientComponent],
  templateUrl: './clients.component.html',
  standalone: true
})
export class ClientsComponent {

}
