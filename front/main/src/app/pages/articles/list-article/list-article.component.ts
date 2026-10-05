import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import {Article, EntityType, OperationType} from "../../../interfaces/entites";
import { DataService } from "../../../services/data.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { CommonModule } from "@angular/common";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EventBusService } from "../../../services/event-bus.service";
import { Event } from "../../../interfaces/EmitEvent";
import { ConfirmationModalComponent } from "../../../components/confirmation-modal/confirmation-modal.component";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {debounceTime, distinctUntilChanged, takeUntil} from 'rxjs/operators';
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {Subject} from "rxjs";
import {AuthService} from "../../../services/auth.service";
import {TraceabilityService} from "../../../services/traceability.service";

@Component({
  selector: 'app-list-article',
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
    MatPaginator,
    MatSnackBarModule,
    MatProgressSpinner,
    MatPaginatorModule,
  ],
  templateUrl: './list-article.component.html',
  standalone: true
})
export class ListArticleComponent implements OnInit, AfterViewInit {
  articles: Article[] = [];
  displayedColumns: string[] = ['nameArticle', 'unite', 'category', 'price', 'description', 'actions'];
  categoryMap: Map<number, string> = new Map();
  dataSource: MatTableDataSource<Article> = new MatTableDataSource<Article>();
  filterForm: FormGroup;
  isLoading = false;
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private dataService: DataService,
    private eventBusService: EventBusService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private authService: AuthService,
    private traceabilityService: TraceabilityService,
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      category: [null],
      minPrice: [null],
      maxPrice: [null]
    });
  }

  ngOnInit(): void {
    this.initFilters();
    this.loadCategories();
    this.loadArticles();

    this.eventBusService.onObserver<Article>([Event.AJOUTER_ARTICLE])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadArticles();
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  initFilters(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  loadCategories(): void {
    this.dataService.getCategories().subscribe(categories => {
      this.categoryMap = new Map(categories.map(c => [c.id, c.category]));
    });
  }

  loadArticles(): void {
    this.isLoading = true;
    this.dataService.getArticles().pipe(
    ).subscribe({
      next: (articleList) => {
        this.articles = articleList;
        this.dataSource.data = this.articles;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement articles:', error);
        this.isLoading = false;
        this.showErrorMessage('Erreur lors du chargement des articles');
      }
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let filteredData = [...this.articles];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredData = filteredData.filter(article =>
        article.nameArticle.toLowerCase().includes(searchTerm) ||
        article.descriptionArticle.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.category) {
      filteredData = filteredData.filter(article =>
        article.categoryId === filters.category
      );
    }

    if (filters.minPrice) {
      filteredData = filteredData.filter(article =>
        article.priceArticle >= filters.minPrice
      );
    }

    if (filters.maxPrice) {
      filteredData = filteredData.filter(article =>
        article.priceArticle <= filters.maxPrice
      );
    }

    this.dataSource.data = filteredData;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

    // ✅ OBLIGATOIRE
    this.dataSource._updateChangeSubscription();
  }


  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      category: null,
      minPrice: null,
      maxPrice: null
    });
  }

  editArticle(article: Article): void {
    this.eventBusService.emit<Article>(Event.MODIFIER_ARTICLE, article);
  }

  deleteArticle(articleId: number): void {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: {
        title: 'Supprimer article',
        message: 'Êtes-vous sûr de vouloir supprimer cet article ?',
        confirmText: 'Confirmer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.dataService.deleteArticle(articleId).subscribe({
          next: () => {
            this.logOperation(
              OperationType.DELETE,
              articleId!,
              `Suppression de l'article "${articleId}"`,
              null,
              null
            );
            this.showSuccessMessage('Article supprimé avec succès');
            this.eventBusService.emit<Article>(Event.AJOUTER_ARTICLE);
            this.loadArticles();
          },
          error: (error) => {
            this.showErrorMessage('Erreur lors de la suppression');
            this.isLoading = false;
          }
        });
      }
    });
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
