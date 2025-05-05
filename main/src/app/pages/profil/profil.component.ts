import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import { DataService } from "../../services/data.service";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { User } from "../../interfaces/entites";
import {ConfirmationModalComponent} from "../../components/confirmation-modal/confirmation-modal.component";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {CommonModule} from "@angular/common";
import {MatTableModule} from "@angular/material/table";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule
  ],
  // ... vos imports existants
})
export class ProfilComponent implements OnInit {
  hideNewPassword = true;
  hideConfirmPassword = true;
  userForm: FormGroup;
  isEditing = false;
  initialFormValues: any;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: [''],
      password: ['', [Validators.minLength(6)]],
      confirmPassword: ['']
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadUserData();
    // Sauvegarder les valeurs initiales pour comparaison
    this.userForm.valueChanges.subscribe(() => {
      if (!this.initialFormValues) {
        this.initialFormValues = this.userForm.value;
      }
    });
  }

  // Vérifie si le formulaire a des modifications
  formHasChanges(): boolean {
    if (!this.initialFormValues) return false;
    return JSON.stringify(this.userForm.value) !== JSON.stringify(this.initialFormValues);
  }

  // Réinitialiser le formulaire
  resetForm() {
    this.userForm.patchValue(this.initialFormValues);
  }

  loadUserData() {
    this.dataService.getUser(1).subscribe(
      (user: User) => {
        this.isEditing = true;
        this.userForm.patchValue({
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        });
        this.initialFormValues = this.userForm.value;
      },
      (error) => {
        console.error('Erreur lors du chargement des données utilisateur', error);
      }
    );
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      formGroup.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }

  onSubmit() {
    if (this.userForm.valid) {
      if (this.isEditing) {
        this.openConfirmationDialog();
      } else {
        this.saveUser();
      }
    }
  }

  openConfirmationDialog(): void {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '350px',
      data: {
        title: 'Confirmation',
        message: 'Êtes-vous sûr de vouloir mettre à jour vos informations?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveUser();
      }
    });
  }

  saveUser() {
    const userData = this.userForm.value;
    delete userData.confirmPassword;

    // Ne pas envoyer le mot de passe s'il n'est pas modifié
    if (!userData.password) {
      delete userData.password;
    } else {
      // Ici vous pourriez hacher le mot de passe avant envoi
      // userData.password = this.hashPassword(userData.password);
    }

    const operation = this.isEditing
      ? this.dataService.updateUser(1, userData)
      : this.dataService.saveUser(userData);

    operation.subscribe(
      response => {
        this.snackBar.open('Modifications enregistrées avec succès', 'Fermer', {
          duration: 3000
        });
        this.initialFormValues = this.userForm.value;
      },
      error => {
        console.error('Erreur', error);
        this.snackBar.open('Une erreur est survenue', 'Fermer', {
          duration: 3000
        });
      }
    );
  }
}
