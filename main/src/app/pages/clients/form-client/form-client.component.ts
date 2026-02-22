import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {Client, EntityType, OperationType, Ville} from "../../../interfaces/entites";
import { DataService } from "../../../services/data.service";
import { map, Observable, startWith } from "rxjs";
import { finalize } from 'rxjs/operators';
import { EventBusService } from "../../../services/event-bus.service";
import { Event } from "../../../interfaces/EmitEvent";
import { ConfirmationModalComponent } from "../../../components/confirmation-modal/confirmation-modal.component";
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {AuthService} from "../../../services/auth.service";
import {TraceabilityService} from "../../../services/traceability.service";

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
    MatDialogModule,
    MatPaginator,
    FormsModule,
    MatProgressSpinner,
    MatPaginatorModule,
  ],
  templateUrl: './form-client.component.html',
})
export class FormClientComponent implements OnInit, AfterViewInit {
  clientForm: FormGroup;
  clients: Client[] = [];
  isEditMode = false;
  currentClientId: number | null = null;
  isLoading = false;
  displayedColumns: string[] = ['raisonSociale', 'adresse', 'ice', 'telephone', 'email', 'actions'];

  // Filtres
  filtreRaisonSociale: string = '';
  filtreTelephone: string = '';
  filtreEmail: string = '';
  filtreIce: string = '';

  villes: Ville[] = [];
  filteredVilles: Observable<Ville[]>;

  dataSource: MatTableDataSource<Client> = new MatTableDataSource<Client>();
  private _paginator!: MatPaginator;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private eventBusService: EventBusService,
    private dialog: MatDialog,
    private authService: AuthService,
    private traceabilityService: TraceabilityService
  ) {
    this.clientForm = this.fb.group({
      raisonSociale: ['', Validators.required],
      adresse: ['', Validators.required],
      ville_id: ['', Validators.required],
      ice: ['', [Validators.required, Validators.pattern(/^[0-9]{15}$/)]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.filteredVilles = this.clientForm.get('ville_id')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterVilles(value || ''))
    );
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadVilles();
    this.setupEventListeners();
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  private logOperation(
    operationType: OperationType,
    entityId: number,
    details: string,
    previousState?: any,
    newState?: any
  ): void {
    const user = this.authService.getCurrentUser()!;

    this.traceabilityService.logOperation({
      operationType,
      entityType: EntityType.CLIENT,
      entityId,
      userId: user?.id || 0,
      userName: user?.first_name + ' ' + user?.last_name || 'Unknown',
      details,
      previousState,
      newState
    });
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

  private _filterVilles(value: string | Ville): Ville[] {
    if (!value) return this.villes;

    const filterValue = typeof value === 'string'
      ? value.toLowerCase()
      : value.nom.toLowerCase();

    return this.villes.filter(ville =>
      ville.nom.toLowerCase().includes(filterValue) ||
      ville.codePostal.includes(filterValue)
    );
  }

  displayVille(ville: Ville): string {
    return ville && ville.nom ? `${ville.nom} (${ville.codePostal})` : '';
  }

  loadClients(): void {
    this.isLoading = true;
    this.dataService.getClients().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (clientList) => {
        this.clients = clientList;
        this.dataSource.data = this.clients; // ✅
        this.appliquerFiltres();
      },
      error: (error) => {
        console.error('Erreur chargement clients:', error);
      }
    });
  }


  appliquerFiltres(): void {
    let filteredData = this.clients;

    if (this.filtreRaisonSociale) {
      filteredData = filteredData.filter(client =>
        client.raisonSociale.toLowerCase().includes(this.filtreRaisonSociale.toLowerCase())
      );
    }

    if (this.filtreTelephone) {
      filteredData = filteredData.filter(client =>
        client.telephone.includes(this.filtreTelephone)
      );
    }

    if (this.filtreEmail) {
      filteredData = filteredData.filter(client =>
        client.email.toLowerCase().includes(this.filtreEmail.toLowerCase())
      );
    }

    if (this.filtreIce) {
      filteredData = filteredData.filter(client =>
        client.ice.includes(this.filtreIce)
      );
    }

    this.dataSource.data = filteredData;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

    // ✅ OBLIGATOIRE
    this.dataSource._updateChangeSubscription();
  }


  reinitialiserFiltres(): void {
    this.filtreRaisonSociale = '';
    this.filtreTelephone = '';
    this.filtreEmail = '';
    this.filtreIce = '';
    this.appliquerFiltres();
  }

  onVilleSelected(event: any): void {
    const selectedVille = typeof event.option.value === 'string'
      ? this.villes.find(v => v.nom === event.option.value)
      : event.option.value;

    if (selectedVille) {
      this.clientForm.patchValue({
        ville_id: selectedVille
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

    const formValue = this.clientForm.value;
    const villeObj = formValue.ville_id; // contient l'objet Ville complet

    const clientData: Client = {
      ...formValue,
      ville_id: villeObj?.id ?? villeObj // ✅ on envoie seulement l'id numérique
    };

    // Supprimer la propriété 'ville' pour éviter toute confusion côté backend
    delete (clientData as any).ville;

    const operation$ = this.isEditMode
      ? this.dataService.updateClient(this.currentClientId!, clientData)
      : this.dataService.saveClient(clientData);

    operation$.pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (savedClient) => {
        const operationType = this.isEditMode ? OperationType.UPDATE : OperationType.CREATE;
        this.logOperation(
          operationType,
          savedClient.id!,
          `${operationType} client "${savedClient.raisonSociale}"`,
          this.isEditMode ? this.clients.find(c => c.id === this.currentClientId) : null,
          savedClient
        );

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

    // Charger la ville par ID
    const villeId = client.ville?.id || (client as any).ville_id;
    if (villeId) {
      this.dataService.getVilleById(villeId).subscribe(ville => {
        this.clientForm.patchValue({
          ...client,
          ville_id: ville
        });
      });
    } else {
      this.clientForm.patchValue({
        ...client
      });
    }

    this.scrollToForm();
  }

  deleteClient(client: Client): void {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le client',
        message: `Êtes-vous sûr de vouloir supprimer le client "${client.raisonSociale}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        isDelete: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.dataService.deleteClient(client.id!).pipe(
          finalize(() => this.isLoading = false)
        ).subscribe({
          next: () => {
            this.logOperation(
              OperationType.DELETE,
              client.id!,
              `Suppression client "${client.raisonSociale}"`,
              client,
              null
            );

            this.showSuccessMessage('Client supprimé avec succès');
            this.eventBusService.emit(Event.AJOUTER_CLIENT);
          },
          error: (error) => {
            const message = error.error?.message || 'Impossible de supprimer ce client car il possède des bons de livraison, devis ou factures associés.';
            this.showErrorMessage(message); // ✅ affiche le message du backend
          }
        });
      }
    });
  }

  resetForm(): void {
    this.clientForm.reset();
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
