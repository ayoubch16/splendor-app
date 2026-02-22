import {Component, OnInit, ElementRef, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {CommonModule} from "@angular/common";
import {MatTableModule} from "@angular/material/table";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {Article, CategoryArticle, EntityType, OperationType} from "../../../interfaces/entites";
import {Observable} from "rxjs";
import {DataService} from "../../../services/data.service";
import {EventBusService} from "../../../services/event-bus.service";
import {Event} from "../../../interfaces/EmitEvent";
import {ConfirmationModalComponent} from "../../../components/confirmation-modal/confirmation-modal.component";
import {AuthService} from "../../../services/auth.service";
import {TraceabilityService} from "../../../services/traceability.service";

@Component({
  selector: 'app-form-article',
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
    MatDialogModule
  ],
  standalone: true,
  templateUrl: './form-article.component.html'
})
export class FormArticleComponent implements OnInit {
  articleForm: FormGroup;
  articles: Article[] = [];
  categories: Observable<CategoryArticle[]>;
  isEditMode = false;
  currentArticleId: number | null = null;

  // Référence au formulaire pour le scroll
  @ViewChild('formContainer') formContainer!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private eventBusService: EventBusService,
    private dialog: MatDialog,
    private authService: AuthService,
    private traceabilityService: TraceabilityService,
  ) {
    this.articleForm = this.fb.group({
      nameArticle: ['', Validators.required],
      unite: ['unite'],
      categoryId: [null, Validators.required],
      descriptionArticle: [''],
      priceArticle: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.eventBusService.onObserver<Article>([Event.MODIFIER_ARTICLE]).subscribe(
      (article) => {
        this.isEditMode = true;
        this.currentArticleId = article.id;
        this.articleForm.patchValue({
          nameArticle: article.nameArticle,
          unite: article.unite,
          categoryId: article.categoryId,
          descriptionArticle: article.descriptionArticle,
          priceArticle: article.priceArticle
        });

        // Faire glisser vers le formulaire après un court délai pour permettre le rendu
        setTimeout(() => {
          this.scrollToForm();
        }, 100);
      }
    );
    this.categories = this.dataService.getCategories();
  }

  // Fonction pour faire glisser la page vers le formulaire
  private scrollToForm(): void {
    if (this.formContainer && this.formContainer.nativeElement) {
      this.formContainer.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      // Fallback: scroll vers le haut de la page
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
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
      entityType: EntityType.ARTICLE,
      entityId,
      userId: user?.id || 0,
      userName: user?.first_name + ' ' + user?.last_name || 'Unknown',
      details,
      previousState,
      newState
    });
  }

  onSubmit(): void {
    if (this.articleForm.valid) {
      const dialogRef = this.dialog.open(ConfirmationModalComponent, {
        width: '400px',
        data: {
          title: this.isEditMode ? 'Modifier l\'article' : 'Ajouter un nouvel article',
          message: this.isEditMode
            ? 'Êtes-vous sûr de vouloir modifier cet article ?'
            : 'Êtes-vous sûr de vouloir ajouter cet article ?',
          confirmText: 'Confirmer',
          cancelText: 'Annuler'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.saveArticle();
          this.eventBusService.emit(Event.AJOUTER_ARTICLE);
        }
      });
    }
  }

  private saveArticle(): void {
    const articleData: Article = {
      ...this.articleForm.value
    };

    if (this.isEditMode && this.currentArticleId) {
      // Mettre à jour l'article
      this.dataService.updateArticle(this.currentArticleId, articleData).subscribe(
        (updatedArticle) => {
          // Log de l'opération de modification
          this.logOperation(
            OperationType.UPDATE,
            updatedArticle.id!,
            `Modification de l'article "${updatedArticle.nameArticle}"`,
            this.articles.find(a => a.id === this.currentArticleId),
            updatedArticle
          );

          this.showSuccessMessage('Article modifié avec succès !');
          this.eventBusService.emit<void>(Event.AJOUTER_ARTICLE);
          this.resetForm();
        },
        (error) => {
          console.error('Erreur lors de la modification de l\'article:', error);
        }
      );
    } else {
      // Ajouter un nouvel article
      this.dataService.saveArticle(articleData).subscribe(
        (savedArticle) => {
          // Log de l'opération de création
          this.logOperation(
            OperationType.CREATE,
            savedArticle.id!,
            `Création de l'article "${savedArticle.nameArticle}"`,
            null,
            savedArticle
          );

          this.showSuccessMessage('Article ajouté avec succès !');
          this.eventBusService.emit<void>(Event.AJOUTER_ARTICLE);
          this.resetForm();
        },
        (error) => {
          console.error('Erreur lors de l\'ajout de l\'article:', error);
        }
      );
    }
  }

  // Ajouter une méthode pour supprimer un article si nécessaire
  async deleteArticle(article: Article): Promise<void> {
    const confirmed = await this.openConfirmationDialog(
      'Supprimer article',
      `Voulez-vous supprimer l'article "${article.nameArticle}" ?`
    );

    if (confirmed) {
      this.dataService.deleteArticle(article.id!).subscribe(
        () => {
          // Log de l'opération de suppression
          this.logOperation(
            OperationType.DELETE,
            article.id!,
            `Suppression de l'article "${article.nameArticle}"`,
            article,
            null
          );

          this.showSuccessMessage('Article supprimé avec succès !');
          this.eventBusService.emit<void>(Event.AJOUTER_ARTICLE);
        },
        (error) => {
          console.error('Erreur lors de la suppression de l\'article:', error);
        }
      );
    }
  }

  private openConfirmationDialog(title: string, message: string): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: { title, message }
    });
    return dialogRef.afterClosed().toPromise();
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

  resetForm(): void {
    this.articleForm.reset();
    this.isEditMode = false;
    this.currentArticleId = null;
  }
}
