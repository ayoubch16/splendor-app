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
import {Client} from "../../../interfaces/entites";
import { DataService } from "../../../services/data.service";
import { map, Observable, startWith } from "rxjs";
import { finalize } from 'rxjs/operators';
import { EventBusService } from "../../../services/event-bus.service";
import { Event } from "../../../interfaces/EmitEvent";
import { ConfirmationModalComponent } from "../../../components/confirmation-modal/confirmation-modal.component";
import {MatPaginator} from "@angular/material/paginator";
import {MatProgressSpinner} from "@angular/material/progress-spinner";

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
    MatProgressSpinner
  ],
  templateUrl: './form-client.component.html',
})
export class FormClientComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) matPaginator!: MatPaginator;
  clientForm: FormGroup;
  clients: Client[] = [];
  isEditMode = false;
  currentClientId: number | null = null;
  isLoading = false;
  displayedColumns: string[] = ['raisonSociale', 'adresse', 'ice', 'telephone', 'email', 'actions'];

  // Propriétés pour les filtres
  filtreRaisonSociale: string = '';
  filtreTelephone: string = '';
  filtreEmail: string = '';
  filtreIce: string = '';

  villes: any[] = [];
  filteredVilles: Observable<any[]>;

  dataSource: MatTableDataSource<Client> = new MatTableDataSource<Client>();
  private _paginator!: MatPaginator;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private eventBusService: EventBusService,
    private dialog: MatDialog
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

  @ViewChild(MatPaginator) set paginator(value: MatPaginator) {
    this._paginator = value;
    if (this._paginator) {
      this.dataSource.paginator = this._paginator;
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
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
    return ville && ville.nom ? `${ville.nom} (${ville.codePostal})` : '';
  }

  loadClients(): void {
    this.isLoading = true;
    this.dataService.getClients().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (clientList) => {
        this.clients = clientList;
        this.dataSource = new MatTableDataSource<Client>(this.clients);
        this.dataSource.paginator = this.paginator; // Réassigner le paginator après le chargement
        this.appliquerFiltres();
      },
      error: (error) => {
        console.error('Erreur chargement clients:', error);
      }
    });
  }

  // Méthodes pour les filtres
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

    // Réinitialiser la pagination après filtrage
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
        ville_id: selectedVille.id
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
      ville: this.villes.find(v => v.id === this.clientForm.value.ville_id)
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

    this.clientForm.patchValue({
      ...client,
      ville_id: client.ville?.id
    });
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
