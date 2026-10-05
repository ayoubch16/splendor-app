import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable, map } from "rxjs";
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

  post(endpoint: string, data: any, options: HttpRequestOptions = {}): Observable<any> {
    return this.baseRequest(Method.post, endpoint, data, options);
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
      })
    );
  }

  private getToken(): string {
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
  queryParameters?: Record<string, any>;
}
