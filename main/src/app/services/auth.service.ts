import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {BehaviorSubject, Observable} from 'rxjs';
import {LoginRequest} from "../interfaces/entites";
import {endpoints} from "../const/endpoints";
import {HttpService} from "./http.service";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private router: Router,private httpService : HttpService,private http:HttpClient) {
  }


  getLogin(loginRequest: LoginRequest): Observable<any> {
    return this.httpService.post(endpoints.user.getLogin, loginRequest)
  }


  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/authentication/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
