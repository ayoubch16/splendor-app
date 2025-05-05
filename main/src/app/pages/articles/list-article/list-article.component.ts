import {Component, OnInit} from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {Article} from "../../../interfaces/entites";
import {DataService} from "../../../services/data.service";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {CommonModule} from "@angular/common";
import {MatTableModule} from "@angular/material/table";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {EventBusService} from "../../../services/event-bus.service";
import {Event} from "../../../interfaces/EmitEvent";
import {ConfirmationModalComponent} from "../../../components/confirmation-modal/confirmation-modal.component";
import {MatDialog} from "@angular/material/dialog";

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
    MatTooltipModule
  ],
  templateUrl: './list-article.component.html',
  standalone: true
})
export class ListArticleComponent implements OnInit {
  articles: Article[] = [];
  listearticles: Article[];
  displayedColumns: string[] = ['nameArticle', 'unite', 'category', 'price', 'description', 'actions'];

  constructor(private dataService: DataService,
              private eventBusService: EventBusService,
              private dialog: MatDialog) {

  }

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.dataService.getArticles().subscribe(
      (article => this.listearticles = article)
    );
    this.eventBusService.onObserver([Event.AJOUTER_ARTICLE]).subscribe(
      ()=>this.dataService.getArticles().subscribe(
        (article => this.listearticles = article)
      ))
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
        this.dataService.deleteArticle(articleId).subscribe(
          ()=>    this.eventBusService.emit<Article>(Event.AJOUTER_ARTICLE)
        )
      }
    });
  }

}
