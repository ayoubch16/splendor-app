import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import {map, Observable} from "rxjs";
import {
  Article,
  ArticleTableDevis,
  Bl, CategoriesData,
  CategoryArticle,
  Client,
  Devis, EmailPayload,
  Facture,
  StatutBL, StatutDevis, StatutFacture,
  User,
  Ville, VillesData
} from "../interfaces/entites";
import {endpoints} from "../const/endpoints";
import {HttpService} from "./http.service";



@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient,
              private httpService : HttpService) {
  }

  //**************** Article **********************************

  getArticles(): Observable<Article[]> {
    return this.httpService.get(endpoints.article.list)
  }

  getArticleById(id: number): Observable<Article> {
    return this.httpService.get(endpoints.article.getOne(id))
  }

  saveArticle(article: Article): Observable<Article> {
    return this.httpService.post(endpoints.article.create, article)
  }

  updateArticle(id:number , article: Article): Observable<Article> {
    return this.httpService.put(endpoints.article.update(id),article)
  }

  deleteArticle(id: number): Observable<void> {
    return this.httpService.delete(endpoints.article.delete(id));
  }


  getCategoriesFromAPI(): Observable<CategoryArticle[]> {
    return this.httpService.get(endpoints.article.listcategories)
  }

  getCategories(): Observable<CategoryArticle[]> {
    return this.http.get<CategoriesData>('assets/data/categories.json')
      .pipe(
        map(data => data.categories)
      );
  }

  getNameCategory(id: number): Observable<string | null> {
    return this.getCategories().pipe(
      map(categories => {
        const found = categories.find(cat => cat.id === id);
        return found ? found.category : null;
      })
    );
  }




//**************** Clients **********************************

  getClients(): Observable<Client[]> {
    return this.httpService.get(endpoints.client.list)
  }

  getClientById(id: number): Observable<Client> {
    return this.httpService.get(endpoints.client.getOne(id))
  }

  saveClient(client: Client): Observable<Client> {
    return this.httpService.post(endpoints.client.create, client)
  }

  updateClient(id:number , client: Client): Observable<Client> {
    return this.httpService.put(endpoints.client.update(id),client)
  }

  deleteClient(id: number): Observable<void> {
    return this.httpService.delete(endpoints.client.delete(id));
  }

  getVilles(): Observable<Ville[]> {
    return this.http.get<VillesData>('assets/data/villes.json')
      .pipe(
        map(data => data.villes)
      );
  }

  getVilleById(id: number): Observable<Ville> {
    return this.getVilles().pipe(
      map(villes => {
        const ville = villes.find(v => v.id === id);
        if (!ville) {
          throw new Error(`Ville avec l'ID ${id} non trouvée`);
        }
        return ville;
      })
    );
  }


//************************* Shared ***************************************//
  getCptFacture(): Observable<number>{
    return this.httpService.get(endpoints.shared.getCptFacture)
  }

  getCptDevis(): Observable<number> {
    return this.httpService.get(endpoints.shared.getCptDevis)
  }

  getCptBl(): any {
    return this.httpService.get(endpoints.shared.getCptBl)
  }

  getCptClient(): any {
    return this.httpService.get(endpoints.shared.getCptClient)
  }

  sendDevisByEmail(id: number,  payload: EmailPayload) {
    return this.httpService.post(endpoints.devis.sendDevisByEmail(id), payload)
  }

  sendEmail(formData: FormData) {
    return this.httpService.post(endpoints.shared.sendEmail, formData);
  }

  sendEmailAsJson(emailData: {to: string, subject: string, message: string}, pdfFile: File): Observable<any> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Pdf = (reader.result as string).split(',')[1];
        this.http.post(endpoints.shared.sendEmail, {
          to: emailData.to,
          subject: emailData.subject,
          message: emailData.message,
          pdfBase64: base64Pdf,
          pdfFileName: pdfFile.name
        }, {
          headers: { 'Content-Type': 'application/json' }
        }).subscribe(observer);
      };
      reader.readAsDataURL(pdfFile);
    });
  }


  //************************* User ***************************************//
  getUser(id:number): Observable<User> {
    return this.httpService.get(endpoints.user.getUser(id))
  }

  saveUser(userData: User) :Observable<any> {
    return this.httpService.post(endpoints.user.create,userData);
  }

  updateUser(id:number,updatedUser: any):Observable<any> {
    return this.httpService.put(endpoints.user.update(id),updatedUser);
  }

  //************************* Devis ***************************************//
  getDevis(id: number): Observable<Devis> {
    return this.httpService.get(endpoints.devis.getOne(id))
  }

  getAllDevis(): Observable<Devis[]> {
    return this.httpService.get(endpoints.devis.list)
  }

  getDevisByClient(clientId: number): Observable<Devis[]> {
    return this.httpService.get(endpoints.devis.getByClient(clientId))
  }

  getDevisArticles(id: number): Observable<ArticleTableDevis[]> {
    return this.httpService.get(endpoints.devis.getOne(id))
  }

  createDevis(devisData: Devis): Observable<Devis> {
    return this.httpService.post(endpoints.devis.create, devisData)
  }

  updateDevis(id: number, updatedDevis: Devis): Observable<Devis> {
    return this.httpService.put(endpoints.devis.update(id), updatedDevis)
  }

  updateDevisStatut(id: number, statut: StatutDevis): Observable<Devis> {
    return this.httpService.put(endpoints.devis.updateStatut(id,statut),null)
  }

  deleteDevis(id: number): Observable<void> {
    return this.httpService.delete(endpoints.devis.delete(id))
  }



  //************************* Facture ***************************************//

  createFacture(id:number): Observable<Facture> {
    return this.httpService.post(endpoints.facture.create(id),null)
  }

  getFactures(): Observable<Facture[]> {
    return this.httpService.get(endpoints.facture.list)
  }

  updateFacture(id:number,facture: Facture): Observable<Facture> {
    return this.httpService.put(endpoints.facture.update(id),facture)
  }

  deleteFacture(id: number): Observable<void> {
    return this.httpService.delete(endpoints.facture.delete(id))
  }

  updateFactureStatut(id: number, statut: StatutFacture): Observable<Facture> {
    console.log("id :"+id)
    console.log("statut :"+statut)
    return this.httpService.put(endpoints.facture.updateStatut(id,statut), {})
  }


  //************************* BL ***************************************//

  createBl(id:number): Observable<Bl> {
    return this.httpService.post(endpoints.bl.create(id),null)
  }

  getBls(): Observable<Bl[]> {
    return this.httpService.get(endpoints.bl.list)
  }

  updateBl(id:number,bl: Bl): Observable<Bl> {
    return this.httpService.put(endpoints.bl.update(id),bl)
  }

  deleteBl(id: number): Observable<void> {
    return this.httpService.delete(endpoints.bl.delete(id))
  }

  updateBlStatut(id: number, statut: StatutBL): Observable<Bl> {
    return this.httpService.put(endpoints.bl.updateStatut(id,statut),null)
  }



  //************************* PDF ***************************************//

  genererPDF(data: { id: number; type: string }): Observable<void> {
    return this.httpService.post(endpoints.file.genererPDF, data);
  }



}
