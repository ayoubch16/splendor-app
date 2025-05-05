import { Component, OnInit } from '@angular/core';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatTableModule } from "@angular/material/table";
import { CommonModule } from "@angular/common";
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from "rxjs";
import { finalize } from 'rxjs/operators';

import {Article, ArticleTable, Client, Facture, StatutFacture, TypeDocument} from "../../../interfaces/entites";
import { DataService } from "../../../services/data.service";
import { FormArticleComponent } from "../../articles/form-article/form-article.component";
import {MatSpinner} from "@angular/material/progress-spinner";
import {DomSanitizer} from "@angular/platform-browser";
import {PdfService} from "../../../services/pdf.service";
import {PdfViewerModalComponent} from "../../../components/pdf-viewer-modal/pdf-viewer-modal.component";
import {DownloadFactureComponent} from "../download-facture/download-facture.component";
import {DownloadFacturePrintComponent} from "../download-facture-print/download-facture-print.component";
import {ChangeStatusComponent} from "../../../components/change-status/change-status.component";
import {SendEmailComponent} from "../../../components/send-email/send-email.component";

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
    DownloadFacturePrintComponent
  ],
  templateUrl: './form-facture.component.html',
  styleUrls: ['./form-facture.component.scss']
})
export class FormFactureComponent implements OnInit {
  clients: Client[] = [];
  listeArticle: Article[] = [];
  listeFactures: Facture[] = [];
  public articlesSubject = new BehaviorSubject<ArticleTable[]>([]);
  articles$: Observable<ArticleTable[]> = this.articlesSubject.asObservable();

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

  clientName: string ;
  selectedClientId: number | null = null;
  factureDate = new Date().toISOString().split('T')[0];
  factureNumber = '';
  currentFactureId: number | null = null;
  isEditMode = false;

  constructor(
    private dataService: DataService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private pdfService: PdfService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.articles$.subscribe(() => {
      this.calculerTotaux();
    });

    this.loadClients();
    this.loadArticles();
    this.loadFactures();
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

  loadFactures(): void {
    this.isLoading = true;
    this.dataService.getFactures().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe(factures => {
      this.listeFactures = factures;
    });
  }

  ouvrirFormulaireArticle(): void {
    const dialogRef = this.dialog.open(FormArticleComponent, {
      width: '800px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadArticles();
      }
    });
  }

  onArticleSelected(event: any): void {
    const selectedArticle: Article = event.value;
    this.nouvelArticle.description = selectedArticle.descriptionArticle;
    this.nouvelArticle.designation = selectedArticle.nameArticle;
    this.nouvelArticle.prixUnitaire = selectedArticle.priceArticle;
    this.calculerTotal();
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
    this.totalHT = articles.reduce((sum, article) => sum + article.prixTotal, 0);
    this.tva = this.totalHT * 0.2;
    this.totalTTC = this.totalHT + this.tva;
  }

  enregistrerFacture(): void {
    if (!this.selectedClientId || this.articles.length === 0) {
      alert('Veuillez sélectionner un client et ajouter au moins un article');
      return;
    }

    const client = this.clients.find(c => c.id === this.selectedClientId);
    if (!client) return;

    this.isLoading = true;
    const facture: Facture = {
      id: this.currentFactureId!,
      numFacture: this.factureNumber,
      client: client,
      montant: this.totalTTC.toFixed(2),
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
    console.log("length avant :"+facture.articles.length)

    this.dataService.updateFacture(this.currentFactureId!,facture).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.showSuccessMessage('Facture modifiée avec succès');
        console.log("length apres :"+facture.articles.length)

        this.loadFactures();
      },
      error: (error: { message: any; }) => {
        this.showErrorMessage(`Erreur: ${error.message}`);
      }
    });
  }

  editFacture(facture: Facture): void {
    this.isEditMode = true;
    this.currentFactureId! = facture.id!;
    this.clientName=facture.client.raisonSociale
    this.selectedClientId = facture.client.id;
    this.factureDate = facture.date;
    this.factureNumber! = facture.numFacture!;

    const articles: ArticleTable[] = facture.articles.map(article => ({
      designation: article.designation,
      description: article.description,
      quantite: article.quantite,
      prixUnitaire: article.prixUnitaire,
      prixTotal: article.prixTotal
    }));

    this.articlesSubject.next(articles);
    this.scrollToForm();
  }

  deleteFacture(facture: Facture): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      this.isLoading = true;
      this.dataService.deleteFacture(facture.id!).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          this.showSuccessMessage('Facture supprimée avec succès');
          this.loadFactures();
          if (this.currentFactureId === facture.id) {
            this.resetForm();
          }
        },
        error: (error: { message: any; }) => {
          this.showErrorMessage(`Erreur lors de la suppression: ${error.message}`);
        }
      });
    }
  }

  resetForm(): void {
    this.selectedClientId = null;
    this.factureDate = new Date().toISOString().split('T')[0];
    this.factureNumber = '';
    this.articlesSubject.next([]);
    this.currentFactureId = null;
    this.isEditMode = false;
  }

  get canSaveFacture(): boolean {
    return !!this.selectedClientId && this.articles.length > 0;
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

  viewFacturePdf(facture: Facture): void {
    this.isLoading = true;
    this.pdfService.generatePdf(facture)
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


  changerStatut(facture: any) {
    const dialogRef = this.dialog.open(ChangeStatusComponent, {
      data: {
        currentStatus: facture.status,
        documentId: facture.id,
        documentType: TypeDocument.FACTURE
      }
    });

    dialogRef.afterClosed().subscribe(newStatus => {
      if (newStatus) {
              console.log("newStatus : "+newStatus)
              this.isLoading = true;
              this.dataService.updateFactureStatut(facture.id!, newStatus)
                .pipe(finalize(() => this.isLoading = false))
                .subscribe({
                  next: () => {
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

  // Modifiez temporairement votre méthode envoyerParMail
  // envoyerParMail(facture: Facture): void {
  //   const dialogRef = this.dialog.open(SendEmailComponent, {
  //     width: '600px',
  //     data: {
  //             documentId: facture.id!,
  //             documentNumber: facture.numFacture,
  //             clientEmail: facture.client?.email,
  //             typeDocument: TypeDocument.FACTURE
  //     }
  //   });
  //
  //   dialogRef.afterClosed().subscribe(resultEmail => {
  //     if (resultEmail) {
  //       this.isLoading = true;
  //
  //       // TEST SIMPLE SANS FICHIER
  //       this.dataService.sendSimpleEmail({
  //         to: resultEmail.email,
  //         subject: resultEmail.subject,
  //         message: resultEmail.message
  //       }).pipe(finalize(() => this.isLoading = false))
  //         .subscribe({
  //           next: () => this.showSuccessMessage('Email envoyé avec succès'),
  //           error: (error) => {
  //             console.error('Erreur complète:', error);
  //             this.showErrorMessage(`Erreur: ${error.message}`);
  //           }
  //         });
  //     }
  //   });
  // }

  envoyerParMail(facture: Facture): void {
    const dialogRef = this.dialog.open(SendEmailComponent, {
      width: '600px',
      data: {
        documentId: facture.id!,
        documentNumber: facture.numFacture,
        clientEmail: facture.client?.email,
        typeDocument: TypeDocument.FACTURE
      }
    });

    dialogRef.afterClosed().subscribe(resultEmail => {
      if (resultEmail) {
        this.isLoading = true;

        // Supposons que vous avez récupéré le PDF sous forme de Blob
        const pdfBlob = new Blob([/* contenu PDF */], { type: 'application/pdf' });
        const pdfFile = new File([pdfBlob], `facture_${facture.numFacture}.pdf`);

        this.dataService.sendEmailAsJson(
          {
            to: resultEmail.email,
            subject: resultEmail.subject,
            message: resultEmail.message
          },
          pdfFile
        ).pipe(finalize(() => this.isLoading = false))
          .subscribe({
              next: () => {
                this.showSuccessMessage('Email envoyé avec succès');
              },
              error: (error) => {
                console.error('Erreur complète:', error);
                this.showErrorMessage(`Erreur lors de l'envoi: ${error.message}`);
              }
            });

      }
    });
  }


}
