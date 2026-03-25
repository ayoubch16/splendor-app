import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable, catchError, map, throwError } from "rxjs";
import { finalize } from "rxjs/operators";
import { BASE_URL } from "../config";

@Injectable({
  providedIn: 'root',
})
export class HttpService {

  base_url = BASE_URL;

  constructor(
    private httpClient: HttpClient,
  ) { }

  get(endpoint: string, options: HttpRequestOptions = {}): Observable<any> {
    return this.baseRequest(Method.get, endpoint, null, options);
  }

  post(endpoint: string, data: any): Observable<any> {
    return this.baseRequest(Method.post, endpoint, data);
  }

  put(endpoint: string, data: any, options: HttpRequestOptions = {}): Observable<any> {
    return this.baseRequest(Method.put, endpoint, data, options);
  }

  patch(endpoint: string, data: any, options: HttpRequestOptions = {}): Observable<any> {
    return this.baseRequest(Method.patch, endpoint, data, options);
  }

  delete(endpoint: string, options: HttpRequestOptions = {}): Observable<any> {
    return this.baseRequest(Method.delete, endpoint, null, options);
  }

  private baseRequest(method: Method, endpoint: string, data: any, options: HttpRequestOptions = {}): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(options.useToken && { 'Authorization': `Bearer ${this.getToken()}` })
    });

    let params = new HttpParams();
    if (options.queryParameters) {
      Object.entries(options.queryParameters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.append(key, value.toString());
        }
      });
    }

    if (options.showLoading) {
      // Ici, vous pourriez implémenter une logique pour afficher un indicateur de chargement
      // Par exemple: this.loadingService.show();
    }

    return this.httpClient.request(method, `${this.base_url}${endpoint}`, {
      body: data,
      headers: headers,
      params: params,
      responseType: 'text'
    }).pipe(
      map(response => {
        try {
          return typeof response === 'string' && response.trim() ? JSON.parse(response) : response;
        } catch (e) {
          return e;
        }
      }),
      catchError(error => {
        if (options.showErrorAlert) {
          // Ici, vous pourriez implémenter une logique pour afficher une alerte d'erreur
          // Par exemple: this.alertService.showError(error.message);
        }
        return throwError(() => error);
      }),
      finalize(() => {
        if (options.showLoading) {
          // Fin du chargement
          // Par exemple: this.loadingService.hide();
        }
      })
    );
  }

  private getToken(): string {
    // Implémentez la récupération du token depuis le localStorage ou un service d'authentification
    return localStorage.getItem('auth_token') || '';
  }
}

enum Method {
  get = 'GET',
  post = 'POST',
  put = 'PUT',
  patch = 'PATCH',
  delete = 'DELETE'
}

export interface HttpRequestOptions {
  useToken?: boolean;
  showLoading?: boolean;
  showErrorAlert?: boolean;
  usePagination?: boolean;
  queryParameters?: Record<string, any>;
}
