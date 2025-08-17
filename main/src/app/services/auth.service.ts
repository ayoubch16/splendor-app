import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {tap} from 'rxjs';
import {endpoints} from "../const/endpoints";
import {HttpService} from "./http.service";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  redirectUrl: string | null = null; // Ajoutez cette propriété
  constructor(private http: HttpClient,private httpService: HttpService,private router: Router) {
  }

  login(credentials: { username: string, password: string }) {
    // return this.http.post<any>('users/login', credentials).pipe(
    return this.httpService.post(endpoints.user.getLogin,credentials).pipe(
      tap(response => {
        this.setSession(response);
        console.log(response)
      })
    );
  }

  private setSession(authResult: any) {
    localStorage.setItem('auth_token', authResult.token);
    localStorage.setItem('user', JSON.stringify(authResult.user));
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.router.navigate(['/authentication/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  //
  // getLogin(loginRequest: LoginRequest): Observable<any> {
  //   return this.httpService.post(endpoints.user.getLogin, loginRequest);
  // }
  // login(loginRequest: LoginRequest): Observable<any> {
  //   return this.httpService.post(endpoints.user.getLogin, loginRequest);
  // }
  //
  //
  //
  // logout(): void {
  //   localStorage.removeItem('token');
  //   this.router.navigate(['/authentication/login']);
  // }
  //
  // isAuthenticated(): boolean {
  //   return !!localStorage.getItem('token');
  // }
  //
  // getCurrentUser(): any {
  //   const user = localStorage.getItem('user');
  //   return user ? JSON.parse(user) : null;
  // }
  //
  // isLoggedIn(): boolean {
  //   return !!localStorage.getItem('token');
  // }
  //
  // getToken(): string | null {
  //   return localStorage.getItem('token');
  // }
}
