import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import { DataService } from "../../services/data.service";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { EntityType, OperationType, User } from "../../interfaces/entites";
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
import {AuthService} from "../../services/auth.service";
import {TraceabilityService} from "../../services/traceability.service";

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
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private traceabilityService: TraceabilityService
  ) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      first_name: [''],
      last_name: [''],
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

  private logOperation(
    operationType: OperationType,
    entityId: number,
    details: string,
    previousState?: any,
    newState?: any
  ): void {
    const user = this.authService.getCurrentUser()!;

    this.traceabilityService.logOperation({
      operationType,
      entityType: EntityType.USER,
      entityId,
      userId: user?.id || 0,
      userName: user?.first_name + ' ' + user?.last_name || 'Unknown',
      details,
      previousState,
      newState
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
    this.dataService.getUser(this.authService.getCurrentUser()?.id).subscribe(
      (user: User) => {
        this.isEditing = true;
        this.userForm.patchValue({
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
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

    const userId = this.authService.getCurrentUser()?.id;
    const previousState = { ...this.initialFormValues };

    // Ne pas logger le mot de passe pour des raisons de sécurité
    const sanitizedPreviousState = { ...previousState };
    delete sanitizedPreviousState.password;
    delete sanitizedPreviousState.confirmPassword;

    const operation = this.isEditing
      ? this.dataService.updateUser(userId!, userData)
      : this.dataService.saveUser(userData);

    operation.subscribe(
      (response: User) => {
        // Ne pas logger le mot de passe pour des raisons de sécurité
        const sanitizedNewState = { ...response };
        delete (sanitizedNewState as any).password;

        this.logOperation(
          OperationType.UPDATE,
          response.id!,
          `Mise à jour du profil utilisateur ${response.username}`,
          sanitizedPreviousState,
          sanitizedNewState
        );

        this.snackBar.open('Modifications enregistrées avec succès', 'Fermer', {
          duration: 3000
        });
        this.initialFormValues = this.userForm.value;

        // Mettre à jour les informations de l'utilisateur dans le service d'authentification
        if (this.isEditing) {
          this.dataService.updateUser(response.id,response);
        }
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
