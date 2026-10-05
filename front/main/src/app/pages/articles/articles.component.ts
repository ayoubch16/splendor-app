import { Component } from '@angular/core';
import {FormArticleComponent} from "./form-article/form-article.component";
import {ListArticleComponent} from "./list-article/list-article.component";

@Component({
  selector: 'app-articles',
  imports: [FormArticleComponent, ListArticleComponent],
  templateUrl: './articles.component.html',
  standalone: true
})
export class ArticlesComponent {

}
