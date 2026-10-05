import { Component } from '@angular/core';
import { FormUserComponent } from "./form-user/form-user.component";

@Component({
  selector: 'app-users',
  imports: [FormUserComponent],
  templateUrl: './users.component.html',
  standalone: true
})
export class UsersComponent {

}
