import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BehaviorSubject, map, Observable, startWith } from "rxjs";
import { finalize } from 'rxjs/operators';

import { Article, ArticleTable, Client, Devis, StatutDevis, TypeDocument } from "../../../interfaces/entites";
import { DataService } from "../../../services/data.service";
import { FormArticleComponent } from "../../articles/form-article/form-article.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatTableModule } from "@angular/material/table";
import { CommonModule } from "@angular/common";
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {MatProgressSpinner, MatSpinner} from "@angular/material/progress-spinner";
import { EventBusService } from "../../../services/event-bus.service";
import { Event } from "../../../interfaces/EmitEvent";
import { DownloadDevisComponent } from "../download-devis/download-devis.component";
import { DownloadDevisPrintComponent } from "../download-devis-print/download-devis-print.component";
import { PdfService } from "../../../services/pdf.service";
import { ChangeStatusComponent } from "../../../components/change-status/change-status.component";
import { SendEmailComponent } from "../../../components/send-email/send-email.component";
import { PdfViewerModalComponent } from "../../../components/pdf-viewer-modal/pdf-viewer-modal.component";
import { ConfirmationModalComponent } from "../../../components/confirmation-modal/confirmation-modal.component";

@Component({
  selector: 'app-form-devis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    MatMenuModule,
    MatSnackBarModule,
    MatSpinner,
    MatAutocompleteModule,
    DownloadDevisComponent,
    DownloadDevisPrintComponent,
    MatProgressSpinner
  ],
  templateUrl: './form-devis.component.html',
  styleUrls: ['./form-devis.component.scss']
})
export class FormDevisComponent implements OnInit {
  clients: Client[] = [];
  listeArticle: Article[] = [];
  listeDevis: Devis[] = [];

  private articlesSubject = new BehaviorSubject<ArticleTable[]>([]);
  articles$: Observable<ArticleTable[]> = this.articlesSubject.asObservable();

  clientFilterCtrl = new FormControl();
  articleFilterCtrl = new FormControl();
  filteredClients: Client[] = [];
  filteredArticles: Article[] = [];

  selectedClient: Client | null = null;
  selectedArticle: Article | null = null;
  selectedClientId: number | null = null;
  selectedArticleId: number | null = null;

  colonnesAffichees: string[] = ['#', 'designation', 'description', 'category', 'quantite', 'prixUnitaire', 'prixTotal', 'actions'];
  displayedColumns2: string[] = ['numDevis', 'clientName', 'montant', 'statut', 'date', 'menu'];

  nouvelArticle: ArticleTable = this.initialiserNouvelArticle();
  totalHT = 0;
  tva = 0;
  totalTTC = 0;
  devisDate = new Date().toISOString().split('T')[0];
  devisNumber = '';
  currentDevisId: number | null = null;

  modeEdition = false;
  articleEnEditionIndex = -1;
  isLoading = false;

  @Output() articlesChanged = new EventEmitter<ArticleTable[]>();

  constructor(
    private dataService: DataService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private eventBusService: EventBusService,
    private pdfService: PdfService
  ) { }

  get articles(): ArticleTable[] {
    return this.articlesSubject.value;
  }

  ngOnInit(): void {
    this.configurerSubscriptions();
    this.chargerDonnees();
    this.loadArticles();
    this.eventBusService.onObserver([Event.AJOUTER_ARTICLE]).subscribe(
      () => this.loadArticles()
    );
  }

  private configurerSubscriptions(): void {
    this.articles$.subscribe(articles => {
      this.calculerTotaux();
      this.articlesChanged.emit(articles);
    });

    this.clientFilterCtrl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value?.raisonSociale),
        map(name => name ? this._filterClients(name) : this.clients.slice())
      )
      .subscribe(clients => {
        this.filteredClients = clients;
      });

    this.articleFilterCtrl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value?.nameArticle),
        map(name => name ? this._filterArticles(name) : this.listeArticle.slice())
      )
      .subscribe(articles => {
        this.filteredArticles = articles;
      });
  }

  private chargerDonnees(): void {
    this.loadClients();
    this.loadDevis();
  }

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

  loadDevis(): void {
    this.isLoading = true;
    this.dataService.getAllDevis().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe(devis => {
      this.listeDevis = devis;
    });
  }

  private _filterArticles(value: string): Article[] {
    const filterValue = value.toLowerCase();
    return this.listeArticle.filter(article =>
      article.nameArticle.toLowerCase().includes(filterValue)
    );
  }

  private _filterClients(value: string): Client[] {
    const filterValue = value.toLowerCase();
    return this.clients.filter(client =>
      client.raisonSociale.toLowerCase().includes(filterValue)
    );
  }

  onClientSelected(event: MatAutocompleteSelectedEvent): void {
    this.selectedClient = event.option.value;
    this.selectedClientId = this.selectedClient?.id || null;
  }

  onArticleSelected(event: MatAutocompleteSelectedEvent): void {
    this.selectedArticle = event.option.value;
    this.selectedArticleId = this.selectedArticle?.id || null;

    if (this.selectedArticle) {
      this.nouvelArticle.description = this.selectedArticle.descriptionArticle;
      this.nouvelArticle.designation = this.selectedArticle.nameArticle;
      this.nouvelArticle.prixUnitaire = this.selectedArticle.priceArticle;
      this.calculerTotal();
    }
  }

  displayClient(client?: Client): string {
    return client ? client.raisonSociale : '';
  }

  displayArticle(article?: Article): string {
    return article ? article.nameArticle : '';
  }

  initialiserNouvelArticle(): ArticleTable {
    return {
      designation: '',
      description: '',
      quantite: 1,
      prixUnitaire: 0,
      prixTotal: 0
    };
  }

  calculerTotal(): void {
    this.nouvelArticle.prixTotal = this.nouvelArticle.quantite * this.nouvelArticle.prixUnitaire;
  }

  async ajouterArticle(): Promise<void> {
    if (!this.nouvelArticle.designation || !this.nouvelArticle.quantite || !this.nouvelArticle.prixUnitaire) {
      this.showErrorMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const message = this.modeEdition
      ? `Voulez-vous modifier l'article "${this.nouvelArticle.designation}" ?`
      : `Voulez-vous ajouter l'article "${this.nouvelArticle.designation}" au devis ?`;

    const confirmed = await this.openConfirmationDialog(
      this.modeEdition ? 'Modifier article' : 'Ajouter article',
      message
    );

    if (confirmed) {
      const currentArticles = this.articlesSubject.value;

      if (this.modeEdition && this.articleEnEditionIndex >= 0) {
        const updatedArticles = [...currentArticles];
        updatedArticles[this.articleEnEditionIndex] = { ...this.nouvelArticle };
        this.articlesSubject.next(updatedArticles);
        this.modeEdition = false;
        this.articleEnEditionIndex = -1;
        this.showSuccessMessage(`Article "${this.nouvelArticle.designation}" modifié avec succès`);
      } else {
        this.articlesSubject.next([...currentArticles, { ...this.nouvelArticle }]);
        this.showSuccessMessage(`Article "${this.nouvelArticle.designation}" ajouté avec succès`);
      }

      this.nouvelArticle = this.initialiserNouvelArticle();
      this.articleFilterCtrl.setValue('');
      this.selectedArticle = null;
    }
  }

  async supprimerArticle(index: number): Promise<void> {
    const articleASupprimer = this.articlesSubject.value[index];
    const confirmed = await this.openConfirmationDialog(
      'Supprimer article',
      `Voulez-vous supprimer l'article "${articleASupprimer.designation}" ?`
    );

    if (confirmed) {
      const currentArticles = this.articlesSubject.value;
      const updatedArticles = currentArticles.filter((_, i) => i !== index);
      this.articlesSubject.next(updatedArticles);
      this.showSuccessMessage(`Article "${articleASupprimer.designation}" supprimé avec succès`);

      if (this.modeEdition && this.articleEnEditionIndex === index) {
        this.nouvelArticle = this.initialiserNouvelArticle();
        this.modeEdition = false;
        this.articleEnEditionIndex = -1;
      }
    }
  }

  modifierArticle(index: number): void {
    this.modeEdition = true;
    this.articleEnEditionIndex = index;
    this.nouvelArticle = { ...this.articlesSubject.value[index] };

    const formElement = document.querySelector('.article-table-container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  calculerTotaux(): void {
    const articles = this.articlesSubject.value;
    this.totalHT = articles.reduce((sum, article) => sum + article.prixTotal, 0);
    this.tva = this.totalHT * 0.2;
    this.totalTTC = this.totalHT + this.tva;
  }

  async enregistrerDevis(): Promise<void> {
    if (!this.selectedClientId || this.articles.length === 0) {
      this.showErrorMessage('Veuillez sélectionner un client et ajouter au moins un article');
      return;
    }

    const client = this.clients.find(c => c.id === this.selectedClientId);
    if (!client) {
      this.showErrorMessage('Client invalide');
      return;
    }

    const confirmMessage = this.currentDevisId
      ? `Voulez-vous modifier le devis ${this.devisNumber} ?`
      : `Voulez-vous enregistrer ce nouveau devis pour ${client.raisonSociale} ?`;

    const confirmed = await this.openConfirmationDialog(
      this.currentDevisId ? 'Modifier devis' : 'Créer devis',
      confirmMessage
    );

    if (!confirmed) return;

    this.isLoading = true;



    const devis: Devis = {
      id: this.currentDevisId || undefined,
      numDevis: this.devisNumber,
      client: client,
      montant: this.totalTTC.toFixed(2),
      statut: StatutDevis.EN_ATTENTE,
      date: this.devisDate,
      articles: this.articles.map(article => ({
        designation: article.designation,
        description: article.description,
        quantite: article.quantite,
        prixUnitaire: article.prixUnitaire,
        prixTotal: article.prixTotal
      }))
    };

    const operation$ = this.currentDevisId
      ? this.dataService.updateDevis(this.currentDevisId, devis)
      : this.dataService.createDevis(devis);

    operation$.pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.showSuccessMessage(`Devis ${this.currentDevisId ? 'modifié' : 'ajouté'} avec succès`);
        this.resetForm();
        this.loadDevis();
      },
      error: (error) => {
        this.showErrorMessage(`Erreur: ${error.message || 'Opération échouée'}`);
      }
    });
  }

  async editDevis(devis: Devis): Promise<void> {
    const confirmed = await this.openConfirmationDialog(
      'Modifier devis',
      `Voulez-vous modifier le devis ${devis.numDevis} ?`
    );

    if (!confirmed) return;

    this.currentDevisId = devis.id || null;
    this.selectedClient = devis.client;
    this.selectedClientId = devis.client.id;
    this.clientFilterCtrl.setValue(devis.client.raisonSociale);
    this.devisDate = devis.date;
    this.devisNumber = devis.numDevis;

    const articles: ArticleTable[] = devis.articles.map(article => ({
      designation: article.designation,
      description: article.description,
      quantite: article.quantite,
      prixUnitaire: article.prixUnitaire,
      prixTotal: article.prixTotal
    }));

    this.articlesSubject.next(articles);
    this.calculerTotaux();
    this.scrollToForm();
  }

  async deleteDevis(devis: Devis): Promise<void> {
    const confirmed = await this.openConfirmationDialog(
      'Supprimer devis',
      `Voulez-vous supprimer définitivement le devis ${devis.numDevis} pour ${devis.client.raisonSociale} ?`
    );

    if (!confirmed) return;

    this.isLoading = true;
    this.dataService.deleteDevis(devis.id!).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.showSuccessMessage(`Devis ${devis.numDevis} supprimé avec succès`);
        this.loadDevis();
        if (this.currentDevisId === devis.id) {
          this.resetForm();
        }
      },
      error: (error) => {
        this.showErrorMessage(`Erreur lors de la suppression: ${error.message || 'Opération échouée'}`);
      }
    });
  }

  async resetForm(): Promise<void> {
    if (this.selectedClientId || this.articles.length > 0) {
      const confirmed = await this.openConfirmationDialog(
        'Annuler modifications',
        'Voulez-vous annuler ? Toutes les modifications non enregistrées seront perdues.'
      );

      if (!confirmed) return;
    }

    this.selectedClientId = null;
    this.selectedClient = null;
    this.clientFilterCtrl.setValue('');
    this.articleFilterCtrl.setValue('');
    this.devisDate = new Date().toISOString().split('T')[0];
    this.articlesSubject.next([]);
    this.currentDevisId = null;
    this.nouvelArticle = this.initialiserNouvelArticle();
    this.modeEdition = false;
    this.articleEnEditionIndex = -1;
  }

  get canSaveDevis(): boolean {
    return !!this.selectedClientId && this.articles.length > 0;
  }

  ouvrirFormulaireArticle(): void {
    const dialogRef = this.dialog.open(FormArticleComponent, {
      width: '800px',
      data: {},
      disableClose: true,
      hasBackdrop: true,
      panelClass: 'custom-dialog-container'
    });

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'custom-close-button';
    closeButton.onclick = () => dialogRef.close();

    dialogRef.afterOpened().subscribe(() => {
      const dialogContainer = document.querySelector('.custom-dialog-container');
      if (dialogContainer) {
        dialogContainer.appendChild(closeButton);
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadArticles();
      }
      if (closeButton.parentNode) {
        closeButton.parentNode.removeChild(closeButton);
      }
    });
  }

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

  consulterDevis(devis: Devis): void {
    this.isLoading = true;
    this.pdfService.generatePdf(devis)
      .then(blob => {
        this.dialog.open(PdfViewerModalComponent, {
          width: '90%',
          maxWidth: '1000px',
          data: {
            title: `Devis ${devis.numDevis}`,
            pdfBlob: blob,
            filename: `Devis_${devis.numDevis}.pdf`
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

  changerStatut(devis: Devis): void {
    const dialogRef = this.dialog.open(ChangeStatusComponent, {
      width: '400px',
      data: { currentStatus: devis.statut, devisId: devis.id!, documentType: TypeDocument.DEVIS }
    });

    dialogRef.afterClosed().subscribe(newStatus => {
      if (newStatus) {
        this.isLoading = true;
        this.dataService.updateDevisStatut(devis.id!, newStatus)
          .pipe(finalize(() => this.isLoading = false))
          .subscribe({
            next: () => {
              this.showSuccessMessage('Statut mis à jour avec succès');
              this.loadDevis();
            },
            error: (error) => {
              this.showErrorMessage(`Erreur: ${error.message}`);
            }
          });
      }
    });
  }

  async genererFacture(devis: Devis): Promise<void> {
    const factureDejaExistante = await this.factureExists(devis);

    if (factureDejaExistante) {
      const numFact = devis.numDevis.replace('DEV', 'FACT');
      const confirmerNouvelleFacture = await this.openConfirmationDialog(
        'Facture existante',
        `Une facture existe déjà pour ce devis (${numFact}). Voulez-vous quand même créer une nouvelle facture?`
      );

      if (!confirmerNouvelleFacture) {
        return;
      }
    }

    const confirmed = await this.openConfirmationDialog(
      'Générer facture',
      `Voulez-vous générer une facture à partir du devis ${devis.numDevis} ?`
    );

    if (confirmed) {
      this.isLoading = true;
      this.dataService.createFacture(devis.id!)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.showSuccessMessage('Facture générée avec succès');
            this.loadDevis();
          },
          error: (error) => {
            this.showErrorMessage(`Erreur: ${error.message}`);
          }
        });
    }
  }

  factureExists(devis: Devis): Promise<boolean> {
    return new Promise((resolve) => {
      const numFact = devis.numDevis.replace('DEV', 'FACT');
      this.dataService.checkFacture(numFact).subscribe({
        next: (result) => resolve(result),
        error: () => resolve(false)
      });
    });
  }

  envoyerParMail(devis: Devis): void {
    const dialogRef = this.dialog.open(SendEmailComponent, {
      width: '600px',
      data: {
        documentId: devis.id!,
        documentNumber: devis.numDevis,
        clientEmail: devis.client?.email,
        typeDocument: TypeDocument.DEVIS
      }
    });

    dialogRef.afterClosed().subscribe(resultEmail => {
      if (resultEmail) {
        this.isLoading = true;
        this.dataService.sendDevisByEmail(devis.id!)
          .pipe(finalize(() => this.isLoading = false))
          .subscribe({
            next: () => {
              this.showSuccessMessage('Email envoyé avec succès');
            },
            error: (error) => {
              this.showErrorMessage(`Erreur: ${error.message}`);
            }
          });
      }
    });
  }

  async genererBonLivraison(devis: Devis): Promise<void> {
    const blDejaExistant = await this.bonLivraisonExists(devis);

    if (blDejaExistant) {
      const numBL = devis.numDevis.replace('DEV', 'BL');
      const confirmerNouveauBL = await this.openConfirmationDialog(
        'Bon de livraison existant',
        `Un bon de livraison existe déjà pour ce devis (${numBL}). Voulez-vous quand même créer un nouveau bon de livraison?`
      );

      if (!confirmerNouveauBL) {
        return;
      }
    }

    const confirmed = await this.openConfirmationDialog(
      'Générer bon de livraison',
      `Voulez-vous générer un bon de livraison à partir du devis ${devis.numDevis} ?`
    );

    if (confirmed) {
      this.isLoading = true;
      this.dataService.createBl(devis.id!)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.showSuccessMessage('Bon de livraison généré avec succès');
            this.loadDevis();
          },
          error: (error) => {
            this.showErrorMessage(`Erreur: ${error.message}`);
          }
        });
    }
  }

  bonLivraisonExists(devis: Devis): Promise<boolean> {
    return new Promise((resolve) => {
      const numBL = devis.numDevis.replace('DEV', 'BL');
      this.dataService.checkBonLivraison(numBL).subscribe({
        next: (result) => resolve(result),
        error: () => resolve(false)
      });
    });
  }

  private openConfirmationDialog(title: string, message: string): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: { title, message }
    });
    return dialogRef.afterClosed().toPromise();
  }

}
