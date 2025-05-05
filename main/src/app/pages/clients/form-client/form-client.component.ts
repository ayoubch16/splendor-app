import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Client } from "../../../interfaces/entites";
import { DataService } from "../../../services/data.service";
import { map, Observable, startWith } from "rxjs";
import { finalize } from 'rxjs/operators';
import { EventBusService } from "../../../services/event-bus.service";
import { Event } from "../../../interfaces/EmitEvent";
import { ConfirmationModalComponent } from "../../../components/confirmation-modal/confirmation-modal.component";

@Component({
  selector: 'app-form-client',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatDialogModule
  ],
  templateUrl: './form-client.component.html',
})
export class FormClientComponent implements OnInit {
  clientForm: FormGroup;
  clients: Client[] = [];
  isEditMode = false;
  currentClientId: number | null = null;
  isLoading = false;
  displayedColumns: string[] = ['raisonSociale', 'adresse', 'ice', 'telephone', 'email', 'actions'];

  villes: any[] = [];
  filteredVilles: Observable<any[]>;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private eventBusService: EventBusService,
    private dialog: MatDialog
  ) {
    this.clientForm = this.fb.group({
      raisonSociale: ['', Validators.required],
      adresse: ['', Validators.required],
      codePostal: ['', Validators.required],
      ville: ['', Validators.required],
      region: ['', Validators.required],
      pays: ['MAROC', Validators.required],
      ice: ['', [Validators.required, Validators.pattern(/^[0-9]{15}$/)]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.filteredVilles = this.clientForm.get('ville')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterVilles(value || ''))
    );
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadVilles();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventBusService.onObserver([Event.AJOUTER_CLIENT]).subscribe(
      () => this.loadClients()
    );
  }

  loadVilles(): void {
    this.dataService.getVilles().subscribe(data => {
      this.villes = data;
    });
  }

  private _filterVilles(value: string | any): any[] {
    if (!value) return this.villes;

    const filterValue = typeof value === 'string'
      ? value.toLowerCase()
      : value.nom.toLowerCase();

    return this.villes.filter(ville =>
      ville.nom.toLowerCase().includes(filterValue) ||
      ville.codePostal.includes(filterValue)
    );
  }

  displayVille(ville: any): string {
    return ville && ville.nom ? ville.nom : '';
  }

  loadClients(): void {
    this.isLoading = true;
    this.dataService.getClients().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe(
      clients => this.clients = clients
    );
  }

  onVilleSelected(event: any): void {
    const selectedVille = typeof event.option.value === 'string'
      ? this.villes.find(v => v.nom === event.option.value)
      : event.option.value;

    if (selectedVille) {
      this.clientForm.patchValue({
        ville: selectedVille, // Affiche seulement le nom dans le champ
        codePostal: selectedVille.codePostal,
        region: selectedVille.region
      });
    }
  }

  onSubmit(): void {
    if (this.clientForm.invalid) return;

    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: {
        title: this.isEditMode ? 'Modifier le client' : 'Ajouter un nouveau client',
        message: this.isEditMode
          ? 'Êtes-vous sûr de vouloir modifier ce client ?'
          : 'Êtes-vous sûr de vouloir ajouter ce client ?',
        confirmText: 'Confirmer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.saveClient();
      }
    });
  }

  private saveClient(): void {
    this.isLoading = true;
    const clientData: Client = {
      ...this.clientForm.value,
    };

    const operation$ = this.isEditMode
      ? this.dataService.updateClient(this.currentClientId!, clientData)
      : this.dataService.saveClient(clientData);

    operation$.pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.showSuccessMessage(`Client ${this.isEditMode ? 'modifié' : 'ajouté'} avec succès`);
        this.resetForm();
        this.eventBusService.emit(Event.AJOUTER_CLIENT);
      },
      error: (error) => {
        this.showErrorMessage(`Erreur: ${error.message}`);
      }
    });
  }

  editClient(client: Client): void {
    this.isEditMode = true;
    this.currentClientId = client.id;

    // Préparation des données pour l'affichage
    const formData = {
      ...client,
      ville: client.ville?.nom || client.ville // Gère le cas où ville est un objet ou juste le nom
    };

    this.clientForm.patchValue(formData);
    this.scrollToForm();
  }

  deleteClient(clientId: number): void {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le client',
        message: 'Êtes-vous sûr de vouloir supprimer ce client ?',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        isDelete: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.dataService.deleteClient(clientId).pipe(
          finalize(() => this.isLoading = false)
        ).subscribe({
          next: () => {
            this.showSuccessMessage('Client supprimé avec succès');
            this.eventBusService.emit(Event.AJOUTER_CLIENT);
          },
          error: (error) => {
            this.showErrorMessage(`Erreur lors de la suppression: ${error.message}`);
          }
        });
      }
    });
  }

  resetForm(): void {
    this.clientForm.reset({
      pays: 'MAROC'
    });
    this.isEditMode = false;
    this.currentClientId = null;
  }

  private scrollToForm(): void {
    const formElement = document.querySelector('.cardWithShadow');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private showSuccessMessage(message: string): void {
    this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: {
        title: 'Succès',
        message: message,
        isSuccess: true,
        confirmText: 'OK'
      }
    });
  }

  private showErrorMessage(message: string): void {
    this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: {
        title: 'Erreur',
        message: message,
        isError: true,
        confirmText: 'OK'
      }
    });
  }
}
