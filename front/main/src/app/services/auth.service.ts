import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {tap} from 'rxjs';
import {endpoints} from "../const/endpoints";
import {HttpService} from "./http.service";
import {User} from "../interfaces/entites";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  redirectUrl: string | null = null;
  constructor(private httpService: HttpService,private router: Router) {
  }

  login(credentials: { username: string, password: string }) {
    return this.httpService.post(endpoints.user.getLogin,credentials).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  private setSession(authResult: any) {
    localStorage.setItem('auth_token', authResult.token);
    this.setCurrentUser(authResult.user);
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

  /** Met à jour l'utilisateur connecté en session (ex: après modification de son profil). */
  setCurrentUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  }

}
