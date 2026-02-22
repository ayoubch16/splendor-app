import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {MatInputModule} from "@angular/material/input";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {CommonModule} from "@angular/common";
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {BehaviorSubject, Observable} from "rxjs";
import {finalize} from 'rxjs/operators';

import {Article, ArticleTable, Bl, Client, EntityType, OperationType, StatutBL, TypeDocument} from "../../../interfaces/entites";
import {DataService} from "../../../services/data.service";
import {MatSpinner} from "@angular/material/progress-spinner";
import {DownloadBlComponent} from "../download-bl/download-bl.component";
import {DownloadBlPrintComponent} from "../download-bl-print/download-bl-print.component";
import {ChangeStatusComponent} from "../../../components/change-status/change-status.component";
import {PdfService} from "../../../services/pdf.service";
import {PdfViewerModalComponent} from "../../../components/pdf-viewer-modal/pdf-viewer-modal.component";
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import {AuthService} from "../../../services/auth.service";
import {TraceabilityService} from "../../../services/traceability.service";
import {ConfirmationModalComponent} from "../../../components/confirmation-modal/confirmation-modal.component";

@Component({
  selector: 'app-form-bl',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatTableModule,
    CommonModule,
    MatIconModule,
    MatMenuModule,
    MatSnackBarModule,
    MatSpinner,
    DownloadBlComponent,
    DownloadBlPrintComponent,
    MatPaginator,
    MatPaginatorModule,
  ],
  templateUrl: './form-bl.component.html'
})
export class FormBlComponent implements OnInit, AfterViewInit {
  clients: Client[] = [];
  listeArticle: Article[] = [];
  listeBls: Bl[] = [];
  public articlesSubject = new BehaviorSubject<ArticleTable[]>([]);
  articles$: Observable<ArticleTable[]> = this.articlesSubject.asObservable();

  // Propriétés pour les filtres
  filtreNumero: string = '';
  filtreClient: string = '';
  filtreStatut: StatutBL | null = null;
  filtreDateDebut: string = '';
  filtreDateFin: string = '';
  statutsBL: StatutBL[] = Object.values(StatutBL);

  get articles(): ArticleTable[] {
    return this.articlesSubject.value;
  }

  colonnesAffichees: string[] = ['#', 'designation', 'description', 'quantite', 'prixUnitaire', 'prixTotal', 'actions'];
  displayedColumns2: string[] = ['numBl', 'clientName', 'statut', 'date', 'menu'];

  nouvelArticle: ArticleTable = this.initialiserNouvelArticle();
  modeEdition = false;
  articleEnEditionIndex = -1;
  isLoading = false;

  clientName: string;
  selectedClientId: number | null = null;
  blDate: string = new Date().toISOString().split('T')[0];
  blNumber = '';
  bcNumber = '';
  currentBlId: number | null = null;
  isEditMode = false;

  dataSource: MatTableDataSource<Bl> = new MatTableDataSource<Bl>();
  private _paginator!: MatPaginator;

  constructor(
    private dataService: DataService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private pdfService: PdfService,
    private authService: AuthService,
    private traceabilityService: TraceabilityService
  ) { }

  ngOnInit(): void {
    this.articles$.subscribe(() => {
      this.calculerTotaux();
    });

    this.loadClients();
    this.loadArticles();
    this.loadBls();
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
      entityType: EntityType.BON_LIVRAISON,
      entityId,
      userId: user?.id || 0,
      userName: user?.first_name + ' ' + user?.last_name || 'Unknown',
      details,
      previousState,
      newState
    });
  }

  // Méthodes de chargement des données
  loadClients(): void {
    this.isLoading = true;
    this.dataService.getClients().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe(clients => {
      this.clients = clients;
    });
  }

  loadArticles(): void {
    this.isLoading = true;
    this.dataService.getArticles().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe(articles => {
      this.listeArticle = articles;
    });
  }

  loadBls(): void {
    this.isLoading = true;
    this.dataService.getBls().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (blList) => {
        this.listeBls = blList;
        this.appliquerFiltres();
      },
      error: (error) => {
        console.error('Erreur chargement BLs:', error);
      }
    });
  }

  // Méthodes pour les filtres
  appliquerFiltres(): void {
    if (!this.listeBls) return;

    const dateDebut = this.filtreDateDebut ? new Date(this.filtreDateDebut) : null;
    const dateFin = this.filtreDateFin ? new Date(this.filtreDateFin) : null;

    const searchNumero = this.filtreNumero?.toLowerCase() || '';
    const searchClient = this.filtreClient?.toLowerCase() || '';

    this.dataSource.data = this.listeBls.filter(bl => {
      if (searchNumero && !bl.numBl?.toLowerCase().includes(searchNumero)) return false;
      if (searchClient && !bl.client?.raisonSociale?.toLowerCase().includes(searchClient)) return false;
      if (this.filtreStatut && bl.statut !== this.filtreStatut) return false;

      if (dateDebut || dateFin) {
        const dateBl = new Date(bl.date);
        if (dateDebut && dateBl < dateDebut) return false;
        if (dateFin && dateBl > dateFin) return false;
      }

      return true;
    });

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

    // ✅ OBLIGATOIRE
    this.dataSource._updateChangeSubscription();
  }


  reinitialiserFiltres(): void {
    this.filtreNumero = '';
    this.filtreClient = '';
    this.filtreStatut = null;
    this.filtreDateDebut = '';
    this.filtreDateFin = '';
    this.appliquerFiltres();
  }

  // Méthodes pour la gestion des articles
  initialiserNouvelArticle(): ArticleTable {
    return {
      designation: '',
      description: '',
      quantite: 1,
      prixUnitaire: 0,
      prixTotal: 0
    };
  }

  onArticleSelected(event: any): void {
    const selectedArticle: Article = event.value;
    this.nouvelArticle.description = selectedArticle.descriptionArticle;
    this.nouvelArticle.designation = selectedArticle.nameArticle;
    this.nouvelArticle.prixUnitaire = selectedArticle.priceArticle;
    this.calculerTotal();
  }

  calculerTotal(): void {
    this.nouvelArticle.prixTotal = this.nouvelArticle.quantite * this.nouvelArticle.prixUnitaire;
  }

  ajouterArticle(): void {
    if (this.nouvelArticle.designation && this.nouvelArticle.quantite && this.nouvelArticle.prixUnitaire) {
      const currentArticles = this.articlesSubject.value;

      if (this.modeEdition && this.articleEnEditionIndex >= 0) {
        const updatedArticles = [...currentArticles];
        updatedArticles[this.articleEnEditionIndex] = { ...this.nouvelArticle };
        this.articlesSubject.next(updatedArticles);
        this.modeEdition = false;
        this.articleEnEditionIndex = -1;
      } else {
        this.articlesSubject.next([...currentArticles, { ...this.nouvelArticle }]);
      }

      this.nouvelArticle = this.initialiserNouvelArticle();
    }
  }

  supprimerArticle(index: number): void {
    const currentArticles = this.articlesSubject.value;
    const updatedArticles = currentArticles.filter((_, i) => i !== index);
    this.articlesSubject.next(updatedArticles);
  }

  modifierArticle(index: number): void {
    this.modeEdition = true;
    this.articleEnEditionIndex = index;
    this.nouvelArticle = { ...this.articlesSubject.value[index] };
  }

  calculerTotaux(): void {
    // Pas de calcul de total pour les BLs (optionnel selon besoin)
  }

  // Méthodes pour la gestion des BLs
  async enregistrerBl(): Promise<void> {
    if (!this.selectedClientId || this.articles.length === 0) {
      this.showErrorMessage('Veuillez sélectionner un client et ajouter au moins un article');
      return;
    }

    const client = this.clients.find(c => c.id === this.selectedClientId);
    if (!client) return;

    const confirmed = await this.openConfirmationDialog(
      this.isEditMode ? 'Modifier BL' : 'Créer BL',
      this.isEditMode
        ? `Voulez-vous modifier le BL ${this.blNumber} ?`
        : `Voulez-vous créer un nouveau BL pour ${client.raisonSociale} ?`
    );

    if (!confirmed) return;

    this.isLoading = true;
    const bl: Bl = {
      id: this.currentBlId || 0,
      numBl: this.blNumber,
      numBC: this.bcNumber,
      client: client,
      statut: StatutBL.NON_LIVRE,
      date: this.blDate,
      articles: this.articles.map(article => ({
        designation: article.designation,
        description: article.description,
        quantite: article.quantite,
        prixUnitaire: article.prixUnitaire,
        prixTotal: article.prixTotal
      }))
    };

    const operation$ = this.isEditMode
      ? this.dataService.updateBl(this.currentBlId!, bl)
      : this.dataService.createBl(bl.id);

    operation$.pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (savedBl) => {
        const operationType = this.isEditMode ? OperationType.UPDATE : OperationType.CREATE;
        this.logOperation(
          operationType,
          savedBl.id!,
          `${operationType} BL ${savedBl.numBl}`,
          this.isEditMode ? bl : null,
          savedBl
        );

        this.showSuccessMessage(`BL ${this.isEditMode ? 'modifié' : 'créé'} avec succès`);
        this.loadBls();
        this.resetForm();
      },
      error: (error) => {
        this.showErrorMessage(`Erreur: ${error.message}`);
      }
    });
  }

  async editBl(bl: Bl): Promise<void> {
    const confirmed = await this.openConfirmationDialog(
      'Modifier BL',
      `Voulez-vous modifier le BL ${bl.numBl} ?`
    );

    if (!confirmed) return;

    this.isEditMode = true;
    this.currentBlId = bl.id;
    this.selectedClientId = bl.client.id;
    this.clientName = bl.client.raisonSociale;
    this.blDate = bl.date;
    this.blNumber = bl.numBl;
    this.bcNumber = bl.numBC!;

    const articles: ArticleTable[] = bl.articles.map(article => ({
      designation: article.designation,
      description: article.description,
      quantite: article.quantite,
      prixUnitaire: article.prixUnitaire,
      prixTotal: article.prixTotal
    }));

    this.articlesSubject.next(articles);
    this.scrollToForm();
  }

  async deleteBl(bl: Bl): Promise<void> {
    const confirmed = await this.openConfirmationDialog(
      'Supprimer BL',
      `Voulez-vous supprimer définitivement le BL ${bl.numBl} pour ${bl.client.raisonSociale} ?`
    );

    if (!confirmed) return;

    this.isLoading = true;
    this.dataService.deleteBl(bl.id).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.logOperation(
          OperationType.DELETE,
          bl.id!,
          `Suppression BL ${bl.numBl}`,
          bl,
          null
        );

        this.showSuccessMessage('BL supprimé avec succès');
        this.loadBls();
        if (this.currentBlId === bl.id) {
          this.resetForm();
        }
      },
      error: (error) => {
        this.showErrorMessage(`Erreur lors de la suppression: ${error.message}`);
      }
    });
  }

  resetForm(): void {
    this.selectedClientId = null;
    this.blDate = new Date().toISOString().split('T')[0];
    this.blNumber = '';
    this.articlesSubject.next([]);
    this.currentBlId = null;
    this.isEditMode = false;
  }

  // Méthodes pour les PDF
  consulterBl(bl: Bl): void {
    this.isLoading = true;
    this.pdfService.generatePdf(bl, { type: TypeDocument.BL, withSignature: false })
      .then(blob => {

        this.dialog.open(PdfViewerModalComponent, {
          width: '90%',
          maxWidth: '1000px',
          data: {
            title: `BL ${bl.numBl}`,
            pdfBlob: blob,
            filename: `BL_${bl.numBl}.pdf`
          }
        });
        this.isLoading = false;
      })
      .catch(error => {
        this.showErrorMessage('Erreur lors de la génération du PDF');
        this.isLoading = false;
        console.error(error);
      });
  }

  async changerStatut(bl: Bl): Promise<void> {
    const dialogRef = this.dialog.open(ChangeStatusComponent, {
      width: '400px',
      data: { currentStatus: bl.statut, blId: bl.id!, documentType: TypeDocument.BL }
    });

    dialogRef.afterClosed().subscribe(async (newStatus) => {
      if (newStatus) {
        const confirmed = await this.openConfirmationDialog(
          'Changer statut',
          `Voulez-vous changer le statut de "${bl.statut}" à "${newStatus}" ?`
        );

        if (!confirmed) return;

        this.isLoading = true;
        this.dataService.updateBlStatut(bl.id!, newStatus)
          .pipe(finalize(() => this.isLoading = false))
          .subscribe({
            next: () => {
              this.logOperation(
                OperationType.STATUS_CHANGE,
                bl.id!,
                `Changement statut de ${bl.statut} à ${newStatus}`,
                { statut: bl.statut },
                { statut: newStatus }
              );

              this.showSuccessMessage('Statut mis à jour avec succès');
              this.loadBls();
            },
            error: (error) => {
              this.showErrorMessage(`Erreur: ${error.message}`);
            }
          });
      }
    });
  }

  // Méthodes utilitaires
  private scrollToForm(): void {
    const formElement = document.querySelector('.cardWithShadow');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private openConfirmationDialog(title: string, message: string): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: { title, message }
    });
    return dialogRef.afterClosed().toPromise();
  }

  formatNumberForDisplay(value: any): number {
    if (typeof value === 'number') return value;

    const stringValue = String(value).replace(/[^0-9.]/g, '');
    const parts = stringValue.split('.');
    const cleanValue = parts.length > 1
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : parts[0];

    return parseFloat(cleanValue) || 0;
  }
}
