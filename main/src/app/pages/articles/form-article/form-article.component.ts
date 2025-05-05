import {Component, OnInit} from '@angular/core';
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
import {Article, CategoryArticle} from "../../../interfaces/entites";
import {Observable} from "rxjs";
import {DataService} from "../../../services/data.service";
import {EventBusService} from "../../../services/event-bus.service";
import {Event} from "../../../interfaces/EmitEvent";
import {ConfirmationModalComponent} from "../../../components/confirmation-modal/confirmation-modal.component";

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

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private eventBusService: EventBusService,
    private dialog: MatDialog
  ) {
    this.articleForm = this.fb.group({
      nameArticle: ['', Validators.required],
      unite: [''],
      categoryArticle: [null, Validators.required],
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
          categoryArticle: article.categoryArticle,
          descriptionArticle: article.descriptionArticle,
          priceArticle: article.priceArticle
        });
      }
    );
    this.categories = this.dataService.getCategories();
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
          this.eventBusService.emit(Event.AJOUTER_ARTICLE)
        }
      });
    }
  }

  private saveArticle(): void {
    const articleData: Article = {
      ...this.articleForm.value
    };

    if (this.isEditMode) {
      // Mettre à jour l'article
      const index = this.articles.findIndex(a => a.id === this.currentArticleId);
      if (index !== -1) {
        this.articles[index] = articleData;
      }
      this.dataService.updateArticle(this.currentArticleId!,articleData).subscribe(
        ()=>{
          this.showSuccessMessage('Article modifié avec succès !');
          this.eventBusService.emit<void>(Event.AJOUTER_ARTICLE);
        }
      );
    } else {
      // Ajouter un nouvel article
      this.articles.push(articleData);
      this.dataService.saveArticle(articleData).subscribe(
        ()=>{
          this.showSuccessMessage('Article ajouté avec succès !');
          this.eventBusService.emit<void>(Event.AJOUTER_ARTICLE);
        }
      );
    }

    this.resetForm();
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
