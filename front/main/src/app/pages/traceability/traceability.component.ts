import { Component, OnInit, ViewChild } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from "@angular/material/card";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef, MatHeaderRow,
  MatHeaderRowDef, MatNoDataRow, MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource
} from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { TraceOperation, OperationType } from "../../interfaces/entites";
import { TraceabilityService } from "../../services/traceability.service";
import {CommonModule, DatePipe} from '@angular/common';

@Component({
  selector: 'app-traceability',
  imports: [
    CommonModule,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatTable,
    MatHeaderCellDef,
    MatHeaderRowDef,
    MatRowDef,
    MatPaginator,
    DatePipe,
    MatHeaderRow,
    MatRow,
    MatNoDataRow
  ],
  standalone: true,
  templateUrl: './traceability.component.html'
})
export class TraceabilityComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource: MatTableDataSource<TraceOperation> = new MatTableDataSource<TraceOperation>();
  traceOperation: TraceOperation[] = [];

  displayedColumns: string[] = [
    'timestamp',
    'operationType',
    'entityType',
    'entityId',
    'userName',
    'details',
    'previousState',
    'newState'
  ];

  // Déclarez l'énumération pour l'utiliser dans le template
  OperationType = OperationType;

  constructor(
    private traceabilityService: TraceabilityService,
  ) {}

  ngOnInit(): void {
    this.loadHistoriques();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadHistoriques(): void {
    this.traceabilityService.getAllOperations().subscribe({
      next: (historiqueList) => {
        this.traceOperation = historiqueList;
        this.dataSource.data = this.traceOperation;
        this.dataSource.paginator = this.paginator;
      },
      error: (error) => {
        console.error('Erreur chargement historiques:', error);
      }
    });
  }

  // Méthode utilitaire pour vérifier si c'est un changement de statut
  isStatusChange(operation: TraceOperation): boolean {
    return operation.operationType === OperationType.STATUS_CHANGE;
  }
}
