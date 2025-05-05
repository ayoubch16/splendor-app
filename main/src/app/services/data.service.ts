import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable} from "rxjs";
import {
  Article,
  ArticleTableDevis,
  Bl,
  CategoryArticle,
  Client,
  Devis,
  Facture,
  StatutBL, StatutDevis, StatutFacture,
  User,
  Ville
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
    console.log("article :"+JSON.stringify(article));
    console.log("endpoints all :   "+endpoints.article.create);
    return this.httpService.post(endpoints.article.create, article)
  }

  updateArticle(id:number , article: Article): Observable<Article> {
    return this.httpService.put(endpoints.article.update(id),article)
  }

  deleteArticle(id: number): Observable<void> {
    return this.httpService.delete(endpoints.article.delete(id));
  }


  getCategories(): Observable<CategoryArticle[]> {
    return this.httpService.get(endpoints.article.listcategories)
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
    return this.httpService.get(endpoints.client.listVilles)
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

  sendDevisByEmail(id: number) {
    return this.httpService.post(endpoints.shared.sendDevisByEmail, null)
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

  sendSimpleEmail(emailData: {to: string, subject: string, message: string}): Observable<any> {
    return this.http.post(endpoints.shared.sendSimple, emailData, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  checkFacture(num : string): Observable<boolean> {
    return this.httpService.get(endpoints.shared.checkFacture(num))
  }

  checkBonLivraison(num : string): Observable<boolean> {
    return this.httpService.get(endpoints.shared.checkBl(num))
  }

  checkDevis(num : string): Observable<boolean> {
    return this.httpService.get(endpoints.shared.checkDevis(num))
  }

  checkBl(num : string): Observable<boolean> {
    return this.httpService.get(endpoints.shared.checkBl(num))
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
    return this.httpService.get(endpoints.devis.getArticles(id))
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

  getLastDevisId(): Observable<number> {
    return this.httpService.get(endpoints.devis.getLastId)
  }

  getLastDevis(): Observable<Devis> {
    return this.httpService.get(endpoints.devis.getLast)
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
    return this.httpService.put(endpoints.facture.updateStatut(id,statut),null)
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



}
