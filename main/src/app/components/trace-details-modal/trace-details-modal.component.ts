// trace-details-modal.component.ts
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { TraceOperation } from '../../interfaces/entites';
import {CommonModule, DatePipe, JsonPipe} from '@angular/common';
import {MatIcon, MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'app-trace-details-modal',
  templateUrl: './trace-details-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  providers: [DatePipe]
})
export class TraceDetailsModalComponent {
  constructor(
    public dialogRef: MatDialogRef<TraceDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { operation: TraceOperation },
    private datePipe: DatePipe
  ) {}

  formatDate(date: string | Date): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm:ss') || '';
  }

  close(): void {
    this.dialogRef.close();
  }

  // get isJsonObject(): boolean {
  //   return (value: any): boolean => {
  //     return value && typeof value === 'object' && !Array.isArray(value);
  //   };
  // }
}
