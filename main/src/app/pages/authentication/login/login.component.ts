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
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) return;

    this.isLoading = true;

    const loginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    console.log("email : "+this.loginForm.value.email)
    console.log("password : "+this.loginForm.value.password)


    this.authService.getLogin(loginRequest).subscribe({
      next: (userId: number) => {
        // Récupérez les infos complètes de l'utilisateur
        this.dataService.getUser(userId).subscribe({
          next: (user) => {
            const token = btoa(`${userId}:${user.email}`);

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            this.router.navigate(['/dashboard']);
            this.isLoading = false;
          }
        });
      },
        error: (error) => {
          console.error('Login failed', error);
          this.isLoading = false;
          // Show user-friendly error message
          this.errorMessage = 'La connexion a échoué. Veuillez réessayer plus tard.';
        }
    });
  }

  get f() {
    return this.loginForm.controls;
  }
}
