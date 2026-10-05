import { Routes } from "@angular/router";
import { UsersComponent } from "./users.component";
import { roleGuard } from "../../services/role.guard";
import { ERole } from "../../interfaces/entites";

export const UsersRoutes: Routes = [
  {
    path: '',
    component: UsersComponent,
    canActivate: [roleGuard],
    data: { roles: [ERole.ROLE_ADMIN, ERole.ROLE_SUPER_ADMIN] }
  }
]
