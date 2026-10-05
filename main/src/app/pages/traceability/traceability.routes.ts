import {Route} from "@angular/router";
import {TraceabilityComponent} from "./traceability.component";
import {roleGuard} from "../../services/role.guard";
import {ERole} from "../../interfaces/entites";


export const TraceabilityRoutes:Route[] = [
  {
    path: '',
    component: TraceabilityComponent,
    canActivate: [roleGuard],
    data: { roles: [ERole.ROLE_ADMIN, ERole.ROLE_SUPER_ADMIN] }
  }
]
