import {EntityType, TraceOperation} from "../interfaces/entites";
import {HttpService} from "./http.service";
import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {endpoints} from "../const/endpoints";


@Injectable({
  providedIn: 'root'
})
export class TraceabilityService {
  private operations = new BehaviorSubject<TraceOperation[]>([]);

  constructor(private http: HttpService) {}

  logOperation(operation: Omit<TraceOperation, 'id' | 'timestamp'>): void {
    const fullOperation: TraceOperation = {
      ...operation,
      timestamp: new Date()
    };

    // Enregistrer en base de données
    this.http.post(endpoints.traceability.logOperation, fullOperation).subscribe({
      next: (savedOp) => {
        const currentOps = this.operations.value;
        this.operations.next([...currentOps, savedOp as TraceOperation]);
      },
      error: (error) => console.error('Erreur enregistrement traçabilité:', error)
    });
  }

  getOperationsByEntity(entityType: EntityType, entityId: number): Observable<TraceOperation[]> {
    return this.http.get(endpoints.traceability.getOperationsByEntity(entityId))
  }

  getAllOperations(): Observable<TraceOperation[]> {
    return this.http.get(endpoints.traceability.getAllOperations)
  }


}
