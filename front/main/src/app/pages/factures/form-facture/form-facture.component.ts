import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import { CommonModule } from "@angular/common";
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from "rxjs";
import { finalize } from 'rxjs/operators';

import {Article, ArticleTable, Client, EntityType, Facture, OperationType, StatutFacture, TypeDocument} from "../../../interfaces/entites";
import { DataService } from "../../../services/data.service";
import {MatSpinner} from "@angular/material/progress-spinner";
import {PdfService} from "../../../services/pdf.service";
import {PdfViewerModalComponent} from "../../../components/pdf-viewer-modal/pdf-viewer-modal.component";
import {DownloadFactureComponent} from "../download-facture/download-facture.component";
import {DownloadFacturePrintComponent} from "../download-facture-print/download-facture-print.component";
import {ChangeStatusComponent} from "../../../components/change-status/change-status.component";
import {SendEmailComponent} from "../../../components/send-email/send-email.component";
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import {AuthService} from "../../../services/auth.service";
import {TraceabilityService} from "../../../services/traceability.service";
import {ConfirmationModalComponent} from "../../../components/confirmation-modal/confirmation-modal.component";

@Component({
  selector: 'app-form-facture',
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
    DownloadFactureComponent,
    DownloadFacturePrintComponent,
    MatPaginator,
    MatPaginatorModule
  ],
  templateUrl: './form-facture.component.html'
})
export class FormFactureComponent implements OnInit, AfterViewInit {
  clients: Client[] = [];
  listeArticle: Article[] = [];
  listeFactures: Facture[] = [];
  public articlesSubject = new BehaviorSubject<ArticleTable[]>([]);
  articles$: Observable<ArticleTable[]> = this.articlesSubject.asObservable();

  // Propriétés pour les filtres
  filtreNumero: string = '';
  filtreClient: string = '';
  filtreStatut: StatutFacture | null = null;
  filtreDateDebut: string = '';
  filtreDateFin: string = '';
  statutsFacture: StatutFacture[] = Object.values(StatutFacture);

  get articles(): ArticleTable[] {
    return this.articlesSubject.value;
  }

  colonnesAffichees: string[] = ['#', 'designation', 'description', 'quantite', 'prixUnitaire', 'prixTotal', 'actions'];
  displayedColumns2: string[] = ['numFacture', 'clientName', 'montant', 'statut', 'date', 'menu'];

  nouvelArticle: ArticleTable = this.initialiserNouvelArticle();
  totalHT = 0;
  tva = 0;
  totalTTC = 0;
  modeEdition = false;
  articleEnEditionIndex = -1;
  isLoading = false;

  clientName: string;
  selectedClientId: number | null = null;
  factureDate = new Date().toISOString().split('T')[0];
  factureNumber = '';
  bcNumber = '';
  currentFactureId: number | null = null;
  isEditMode = false;

  dataSource: MatTableDataSource<Facture> = new MatTableDataSource<Facture>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

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
    this.loadFactures();
  }

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
      entityType: EntityType.FACTURE,
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

  loadFactures(): void {
    this.isLoading = true;
    this.dataService.getFactures().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (factureList) => {
        this.listeFactures = factureList;
        this.appliquerFiltres();
      },
      error: (error) => {
        console.error('Erreur chargement Facture:', error);
      }
    });
  }

  // Méthodes pour les filtres
  appliquerFiltres(): void {
    if (!this.listeFactures) return;

    const dateDebut = this.filtreDateDebut ? new Date(this.filtreDateDebut) : null;
    const dateFin = this.filtreDateFin ? new Date(this.filtreDateFin) : null;

    const searchNumero = this.filtreNumero?.toLowerCase() || '';
    const searchClient = this.filtreClient?.toLowerCase() || '';

    this.dataSource.data = this.listeFactures.filter(facture => {
      if (searchNumero && !facture.numFacture?.toLowerCase().includes(searchNumero)) return false;
      if (searchClient && !facture.client?.raisonSociale?.toLowerCase().includes(searchClient)) return false;
      if (this.filtreStatut && facture.statut !== this.filtreStatut) return false;

      if (dateDebut || dateFin) {
        const dateFacture = new Date(facture.date);
        if (dateDebut && dateFacture < dateDebut) return false;
        if (dateFin && dateFacture > dateFin) return false;
      }

      return true;
    });

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

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
    const articles = this.articlesSubject.value;
    this.totalHT = articles.reduce((sum, article) => {
      const prixTotal = (article.quantite ?? 0) * (article.prixUnitaire ?? 0);
      return sum + prixTotal;
    }, 0);
    this.tva = this.totalHT * 0.2;
    this.totalTTC = this.totalHT + this.tva;
  }

  // Méthodes pour la gestion des factures
  async enregistrerFacture(): Promise<void> {
    // Une facture se crée uniquement depuis un devis : ce formulaire ne sert qu'à la modification
    if (!this.isEditMode || !this.currentFactureId) return;

    if (!this.selectedClientId || this.articles.length === 0) {
      this.showErrorMessage('Veuillez sélectionner un client et ajouter au moins un article');
      return;
    }

    const client = this.clients.find(c => c.id === this.selectedClientId);
    if (!client) return;

    const confirmed = await this.openConfirmationDialog(
      'Modifier facture',
      `Voulez-vous modifier la facture ${this.factureNumber} ?`
    );

    if (!confirmed) return;

    this.isLoading = true;
    const facture: Facture = {
      id: this.currentFactureId,
      numFacture: this.factureNumber,
      numBC : this.bcNumber,
      client: client,
      client_id: client.id,
      montant: Number(this.totalTTC).toFixed(2),
      statut: StatutFacture.NON_PAYEE,
      date: this.factureDate,
      articles: this.articles.map(article => ({
        designation: article.designation,
        description: article.description,
        quantite: article.quantite,
        prixUnitaire: article.prixUnitaire,
        prixTotal: article.prixTotal
      }))
    };

    this.dataService.updateFacture(this.currentFactureId, facture).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (savedFacture) => {
        this.logOperation(
          OperationType.UPDATE,
          savedFacture.id!,
          `${OperationType.UPDATE} facture ${savedFacture.numFacture}`,
          facture,
          savedFacture
        );

        this.showSuccessMessage('Facture modifiée avec succès');
        this.loadFactures();
        this.resetForm();
      },
      error: (error) => {
        this.showErrorMessage(`Erreur: ${error.message}`);
      }
    });
  }

  async editFacture(facture: Facture): Promise<void> {
    const confirmed = await this.openConfirmationDialog(
      'Modifier facture',
      `Voulez-vous modifier la facture ${facture.numFacture} ?`
    );

    if (!confirmed) return;

    this.isEditMode = true;
    this.currentFactureId = facture.id!;
    this.clientName = facture.client.raisonSociale;
    this.selectedClientId = facture.client.id;
    this.factureDate = facture.date;
    this.factureNumber = facture.numFacture!;
    this.bcNumber=facture.numBC!;

    const articles: ArticleTable[] = facture.articles.map(article => ({
      designation: article.designation,
      description: article.description,
      quantite: article.quantite ?? 0,
      prixUnitaire: article.prixUnitaire ?? 0,
      prixTotal: (article.quantite ?? 0) * (article.prixUnitaire ?? 0)
    }));

    this.articlesSubject.next(articles);
    this.scrollToForm();
  }

  async deleteFacture(facture: Facture): Promise<void> {
    const confirmed = await this.openConfirmationDialog(
      'Supprimer facture',
      `Voulez-vous supprimer définitivement la facture ${facture.numFacture} pour ${facture.client.raisonSociale} ?`
    );

    if (!confirmed) return;

    this.isLoading = true;
    this.dataService.deleteFacture(facture.id!).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.logOperation(
          OperationType.DELETE,
          facture.id!,
          `Suppression facture ${facture.numFacture}`,
          facture,
          null
        );

        this.showSuccessMessage('Facture supprimée avec succès');
        this.loadFactures();
        if (this.currentFactureId === facture.id) {
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
    this.factureDate = new Date().toISOString().split('T')[0];
    this.factureNumber = '';
    this.bcNumber = '';
    this.articlesSubject.next([]);
    this.currentFactureId = null;
    this.isEditMode = false;
  }

  get canSaveFacture(): boolean {
    return !!this.selectedClientId && this.articles.length > 0;
  }

  // Méthodes pour les PDF et emails
  viewFacturePdf(facture: Facture): void {
    this.isLoading = true;
    this.pdfService.generatePdf(facture, { type: TypeDocument.FACTURE, withSignature: false })
      .then(blob => {

        this.dialog.open(PdfViewerModalComponent, {
          width: '90%',
          maxWidth: '1000px',
          data: {
            title: `Facture ${facture.numFacture}`,
            pdfBlob: blob,
            filename: `Facture_${facture.numFacture}.pdf`
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

  async changerStatut(facture: Facture): Promise<void> {
    const dialogRef = this.dialog.open(ChangeStatusComponent, {
      data: {
        currentStatus: facture.statut,
        documentId: facture.id,
        documentType: TypeDocument.FACTURE
      }
    });

    dialogRef.afterClosed().subscribe(async (newStatus) => {
      if (newStatus) {
        const confirmed = await this.openConfirmationDialog(
          'Changer statut',
          `Voulez-vous changer le statut de "${facture.statut}" à "${newStatus}" ?`
        );

        if (!confirmed) return;

        this.isLoading = true;
        this.dataService.updateFactureStatut(facture.id!, newStatus)
          .pipe(finalize(() => this.isLoading = false))
          .subscribe({
            next: () => {
              this.logOperation(
                OperationType.STATUS_CHANGE,
                facture.id!,
                `Changement statut de ${facture.statut} à ${newStatus}`,
                { statut: facture.statut },
                { statut: newStatus }
              );

              this.showSuccessMessage('Statut mis à jour avec succès');
              this.loadFactures();
            },
            error: (error) => {
              this.showErrorMessage(`Erreur: ${error.message}`);
            }
          });
      }
    });
  }

  async envoyerParMail(facture: Facture): Promise<void> {
    const dialogRef = this.dialog.open(SendEmailComponent, {
      width: '600px',
      data: {
        documentId: facture.id!,
        documentNumber: facture.numFacture,
        clientEmail: facture.client?.email,
        typeDocument: TypeDocument.FACTURE
      }
    });

    dialogRef.afterClosed().subscribe(async (resultEmail) => {
      if (resultEmail) {
        const confirmed = await this.openConfirmationDialog(
          'Envoyer par email',
          `Voulez-vous envoyer la facture ${facture.numFacture} à ${resultEmail.email} ?`
        );

        if (!confirmed) return;

        this.isLoading = true;
        this.pdfService.generatePdf(facture, { type: TypeDocument.FACTURE, withSignature: true })
          .then(pdfBlob => {
            const pdfFile = new File([pdfBlob], `facture_${facture.numFacture}.pdf`);

            this.dataService.sendEmail(
              {
                to: resultEmail.email,
                subject: resultEmail.subject || `Facture ${facture.numFacture}`,
                message: resultEmail.message || `Veuillez trouver ci-joint notre facture n°${facture.numFacture}.`
              },
              pdfFile
            ).pipe(finalize(() => this.isLoading = false))
              .subscribe({
                next: () => {
                  this.logOperation(
                    OperationType.EMAIL_SENT,
                    facture.id!,
                    `Email envoyé à ${resultEmail.email}`,
                    null,
                    { email: resultEmail.email, subject: resultEmail.subject }
                  );

                  this.showSuccessMessage('Email envoyé avec succès');
                },
                error: (error) => {
                  console.error('Erreur complète:', error);
                  this.showErrorMessage(`Erreur lors de l'envoi: ${error.message}`);
                }
              });
          })
          .catch(error => {
            this.isLoading = false;
            this.showErrorMessage('Erreur lors de la génération du PDF');
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
