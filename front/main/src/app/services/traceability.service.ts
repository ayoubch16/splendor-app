import {TraceOperation} from "../interfaces/entites";
import {HttpService} from "./http.service";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {endpoints} from "../const/endpoints";


@Injectable({
  providedIn: 'root'
})
export class TraceabilityService {

  constructor(private http: HttpService) {}

  logOperation(operation: Omit<TraceOperation, 'id' | 'timestamp'>): void {
    const fullOperation: TraceOperation = {
      ...operation,
      timestamp: new Date()
    };

    // Enregistrer en base de données
    this.http.post(endpoints.traceability.logOperation, fullOperation).subscribe({
      error: (error) => console.error('Erreur enregistrement traçabilité:', error)
    });
  }

  getAllOperations(): Observable<TraceOperation[]> {
    return this.http.get(endpoints.traceability.getAllOperations)
  }

}
