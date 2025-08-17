import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatError, MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { HttpClientModule } from '@angular/common/http';
import {AuthService} from "../../../services/auth.service";
import {DataService} from "../../../services/data.service";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatLabel,
    MatError,
    CommonModule,
    HttpClientModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private dataService: DataService,
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required],
    });
  }
  login() {
    this.isLoading = true;
    this.errorMessage = '';

    const loginRequest = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password
    };

    this.authService.login(loginRequest).subscribe({
      next: () => {
        const redirectUrl = this.authService.redirectUrl || '/dashboard';
        this.router.navigateByUrl(redirectUrl);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Login failed', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'La connexion a échoué. Veuillez réessayer.';
      }
    });
  }

  // onSubmit() {
  //   this.submitted = true;
  //   this.errorMessage = '';
  //
  //   if (this.loginForm.invalid) return;
  //
  //   this.isLoading = true;
  //
  //   const loginRequest = {
  //     username: this.loginForm.value.username,
  //     password: this.loginForm.value.password
  //   };
  //
  //   console.log("username :"+loginRequest.username)
  //   console.log("password :"+loginRequest.password)
  //   this.authService.login(loginRequest).subscribe({
  //     next: (response: any) => {
  //       // Stockage du token Sanctum
  //       localStorage.setItem('auth_token', response.token);
  //
  //       // Stockage des infos utilisateur
  //       localStorage.setItem('user', JSON.stringify(response.user));
  //
  //       // Définition du header par défaut
  //       this.apiService.setAuthToken(response.token);
  //
  //       // Redirection
  //       this.router.navigate(['/dashboard']);
  //       this.isLoading = false;
  //
  //       // Optionnel : Planifier le refresh token
  //       this.scheduleTokenRefresh();
  //     },
  //     error: (error) => {
  //       console.error('Login failed', error);
  //       this.isLoading = false;
  //
  //       // Messages d'erreur spécifiques
  //       if (error.status === 401) {
  //         this.errorMessage = 'Identifiants incorrects';
  //       } else if (error.status === 0) {
  //         this.errorMessage = 'Serveur indisponible';
  //       } else {
  //         this.errorMessage = 'Erreur de connexion. Veuillez réessayer.';
  //       }
  //     }
  //   });
  // }

  get f() {
    return this.loginForm.controls;
  }
}
