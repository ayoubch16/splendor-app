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
import {AuthService} from "../../../services/auth.service";

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
    CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
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
  get f() {
    return this.loginForm.controls;
  }
}
