import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { EntityType, ERole, OperationType, User } from "../../../interfaces/entites";
import { DataService } from "../../../services/data.service";
import { EventBusService } from "../../../services/event-bus.service";
import { Event } from "../../../interfaces/EmitEvent";
import { ConfirmationModalComponent } from "../../../components/confirmation-modal/confirmation-modal.component";
import { AuthService } from "../../../services/auth.service";
import { TraceabilityService } from "../../../services/traceability.service";

interface RoleOption {
  value: ERole;
  label: string;
}

@Component({
  selector: 'app-form-user',
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
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatPaginator,
    FormsModule,
    MatProgressSpinner,
    MatPaginatorModule,
  ],
  templateUrl: './form-user.component.html',
})
export class FormUserComponent implements OnInit, AfterViewInit {
  userForm: FormGroup;
  users: User[] = [];
  isEditMode = false;
  currentUserId: number | null = null;
  isLoading = false;
  displayedColumns: string[] = ['username', 'nomComplet', 'email', 'role', 'statut', 'actions'];

  readonly roleOptions: RoleOption[] = [
    { value: ERole.ROLE_SUPER_ADMIN, label: 'Super Administrateur' },
    { value: ERole.ROLE_ADMIN, label: 'Administrateur' },
    { value: ERole.ROLE_USER, label: 'Utilisateur' },
  ];

  /** Seuls ADMIN et SUPER_ADMIN peuvent voir/gérer (modifier, activer/désactiver, supprimer) les comptes existants. */
  get canManageAccounts(): boolean {
    const currentRole = this.authService.getCurrentUser()?.role;
    return currentRole === ERole.ROLE_ADMIN || currentRole === ERole.ROLE_SUPER_ADMIN;
  }

  /**
   * Options de rôle visibles dans le formulaire de création/édition :
   * - SUPER_ADMIN : tous les rôles.
   * - ADMIN : tous sauf SUPER_ADMIN.
   * - Autres (ex: ROLE_USER) : uniquement "Utilisateur" (ne peut pas créer de compte privilégié).
   */
  get visibleRoleOptions(): RoleOption[] {
    const currentRole = this.authService.getCurrentUser()?.role;
    if (currentRole === ERole.ROLE_SUPER_ADMIN) {
      return this.roleOptions;
    }
    if (currentRole === ERole.ROLE_ADMIN) {
      return this.roleOptions.filter(r => r.value !== ERole.ROLE_SUPER_ADMIN);
    }
    return this.roleOptions.filter(r => r.value === ERole.ROLE_USER);
  }

  // Filtres
  filtreUsername = '';
  filtreEmail = '';
  filtreRole = '';
  filtreStatut = '';

  dataSource: MatTableDataSource<User> = new MatTableDataSource<User>();

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private eventBusService: EventBusService,
    private dialog: MatDialog,
    private authService: AuthService,
    private traceabilityService: TraceabilityService
  ) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      role: ['', Validators.required],
      password: ['', [Validators.minLength(8)]],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // La liste est visible par tous les rôles ayant accès à la page ;
    // seules les actions (modifier/activer-désactiver/supprimer) restent réservées à ADMIN/SUPER_ADMIN.
    this.loadUsers();
    this.setupEventListeners();
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  private setupEventListeners(): void {
    this.eventBusService.onObserver([Event.AJOUTER_USER]).subscribe(
      () => this.loadUsers()
    );
  }

  private passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else if (formGroup.get('confirmPassword')?.hasError('passwordMismatch')) {
      formGroup.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }

  private logOperation(
    operationType: OperationType,
    entityId: number,
    details: string,
    previousState?: any,
    newState?: any
  ): void {
    const currentUser = this.authService.getCurrentUser();

    this.traceabilityService.logOperation({
      operationType,
      entityType: EntityType.USER,
      entityId,
      userId: currentUser?.id || 0,
      userName: (currentUser?.first_name + ' ' + currentUser?.last_name) || 'Unknown',
      details,
      previousState: this.sanitize(previousState),
      newState: this.sanitize(newState)
    });
  }

  /** Retire le mot de passe avant de l'envoyer vers la traçabilité. */
  private sanitize(state: Record<string, unknown> | null | undefined): Record<string, unknown> | null | undefined {
    if (!state) return state;
    const sanitized = { ...state };
    delete sanitized['password'];
    delete sanitized['confirmPassword'];
    return sanitized;
  }

  get currentUserId$(): number | undefined {
    return this.authService.getCurrentUser()?.id;
  }

  isSelf(user: User): boolean {
    return user.id === this.currentUserId$;
  }

  /**
   * Un compte de même niveau (même rôle) que l'utilisateur connecté.
   * Le SUPER_ADMIN est l'autorité suprême : il n'est jamais limité par cette règle,
   * même face à un autre SUPER_ADMIN (sinon personne ne pourrait gérer un super admin problématique).
   * Seul l'ADMIN reste protégé contre la gestion par un autre ADMIN (même niveau).
   */
  isSameLevel(user: User): boolean {
    const currentRole = this.authService.getCurrentUser()?.role;
    if (currentRole === ERole.ROLE_SUPER_ADMIN) return false;
    return !!currentRole && user.role === currentRole;
  }

  /** Seul un ADMIN/SUPER_ADMIN peut supprimer un compte ; jamais le sien, ni un compte de même niveau. */
  canManageUser(user: User): boolean {
    return this.canManageAccounts && !this.isSelf(user) && !this.isSameLevel(user);
  }

  /** Seul un ADMIN/SUPER_ADMIN peut modifier un compte ; le sien est autorisé, pas un compte de même niveau. */
  canEditUser(user: User): boolean {
    return this.canManageAccounts && (this.isSelf(user) || !this.isSameLevel(user));
  }

  /**
   * Seul un ADMIN/SUPER_ADMIN peut activer/désactiver un compte.
   * Activer/désactiver son propre compte est interdit.
   * Entre comptes de même niveau (ex: admin vs admin), seule l'ACTIVATION d'un compte désactivé
   * est autorisée (ex: débloquer un nouvel admin créé désactivé) ; la désactivation d'un pair reste interdite.
   */
  canToggleStatus(user: User): boolean {
    if (!this.canManageAccounts || this.isSelf(user)) return false;
    if (this.isSameLevel(user)) return !user.isActive;
    return true;
  }

  editTooltip(user: User): string {
    if (!this.canManageAccounts) return 'Action réservée aux administrateurs';
    if (!this.isSelf(user) && this.isSameLevel(user)) return 'Impossible de modifier un compte de même niveau';
    return 'Modifier';
  }

  toggleTooltip(user: User): string {
    if (!this.canManageAccounts) return 'Action réservée aux administrateurs';
    if (this.isSelf(user)) return 'Impossible de modifier le statut de votre propre compte';
    if (this.isSameLevel(user) && user.isActive) return 'Impossible de désactiver un compte de même niveau';
    return user.isActive ? 'Désactiver' : 'Activer';
  }

  deleteTooltip(user: User): string {
    if (!this.canManageAccounts) return 'Action réservée aux administrateurs';
    if (this.isSelf(user)) return 'Impossible de supprimer votre propre compte';
    if (this.isSameLevel(user)) return 'Impossible de supprimer un compte de même niveau';
    return 'Supprimer';
  }

  getRoleLabel(role: string): string {
    return this.roleOptions.find(r => r.value === role)?.label || role;
  }

  loadUsers(): void {
    this.isLoading = true;
    this.dataService.getUsers().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (userList) => {
        const currentUser = this.authService.getCurrentUser();
        const currentRole = currentUser?.role;
        // Un compte SUPER_ADMIN n'est visible que pour lui-même ou un autre compte de même niveau.
        let users = currentRole === ERole.ROLE_SUPER_ADMIN
          ? userList
          : userList.filter(u => u.role !== ERole.ROLE_SUPER_ADMIN);

        // Si le backend ne renvoie pas le compte connecté dans la liste, on le réinjecte
        // pour qu'il puisse se voir et se modifier lui-même.
        if (currentUser && !users.some(u => u.id === currentUser.id)) {
          users = [currentUser, ...users];
        }

        this.users = users;
        this.dataSource.data = this.users;
        this.appliquerFiltres();
      },
      error: (error) => {
        console.error('Erreur chargement utilisateurs:', error);
      }
    });
  }

  appliquerFiltres(): void {
    let filteredData = this.users;

    if (this.filtreUsername) {
      filteredData = filteredData.filter(user =>
        user.username.toLowerCase().includes(this.filtreUsername.toLowerCase())
      );
    }

    if (this.filtreEmail) {
      filteredData = filteredData.filter(user =>
        user.email.toLowerCase().includes(this.filtreEmail.toLowerCase())
      );
    }

    if (this.filtreRole) {
      filteredData = filteredData.filter(user => user.role === this.filtreRole);
    }

    if (this.filtreStatut) {
      const isActive = this.filtreStatut === 'actif';
      filteredData = filteredData.filter(user => user.isActive === isActive);
    }

    this.dataSource.data = filteredData;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

    this.dataSource._updateChangeSubscription();
  }

  reinitialiserFiltres(): void {
    this.filtreUsername = '';
    this.filtreEmail = '';
    this.filtreRole = '';
    this.filtreStatut = '';
    this.appliquerFiltres();
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;

    if (!this.isEditMode && !this.userForm.value.password) {
      this.userForm.get('password')?.setErrors({ required: true });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: {
        title: this.isEditMode ? 'Modifier l\'utilisateur' : 'Ajouter un nouvel utilisateur',
        message: this.isEditMode
          ? 'Êtes-vous sûr de vouloir modifier cet utilisateur ?'
          : 'Êtes-vous sûr de vouloir ajouter cet utilisateur ?',
        confirmText: 'Confirmer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.saveUser();
      }
    });
  }

  private saveUser(): void {
    this.isLoading = true;

    const formValue = { ...this.userForm.value };
    delete formValue.confirmPassword;

    // En édition, ne pas envoyer le mot de passe s'il n'a pas été renseigné (on garde l'ancien)
    if (this.isEditMode && !formValue.password) {
      delete formValue.password;
    }

    if (!this.isEditMode) {
      // Tout nouveau compte est créé désactivé ; seul un ADMIN ou SUPER_ADMIN peut l'activer.
      formValue.isActive = false;
    }

    const operation$ = this.isEditMode
      ? this.dataService.updateUser(this.currentUserId!, formValue)
      : this.dataService.saveUser(formValue);

    operation$.pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (savedUser) => {
        const operationType = this.isEditMode ? OperationType.UPDATE : OperationType.CREATE;
        this.logOperation(
          operationType,
          savedUser.id!,
          `${operationType} utilisateur "${savedUser.username}"`,
          this.isEditMode ? this.users.find(u => u.id === this.currentUserId) : null,
          savedUser
        );

        this.showSuccessMessage(
          this.isEditMode
            ? 'Utilisateur modifié avec succès'
            : 'Utilisateur ajouté avec succès. Le compte est désactivé par défaut, un administrateur doit l\'activer.'
        );
        this.resetForm();
        this.eventBusService.emit(Event.AJOUTER_USER);
      },
      error: (error) => {
        this.showErrorMessage(`Erreur: ${error.message}`);
      }
    });
  }

  editUser(user: User): void {
    if (!this.canEditUser(user)) {
      this.showErrorMessage(this.editTooltip(user));
      return;
    }

    this.isEditMode = true;
    this.currentUserId = user.id;

    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      password: '',
      confirmPassword: ''
    });

    this.scrollToForm();
  }

  toggleStatut(user: User): void {
    if (!this.canToggleStatus(user)) {
      this.showErrorMessage(this.toggleTooltip(user));
      return;
    }

    const activer = !user.isActive;
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: {
        title: activer ? 'Activer l\'utilisateur' : 'Désactiver l\'utilisateur',
        message: activer
          ? `Voulez-vous activer le compte de "${user.username}" ?`
          : `Voulez-vous désactiver le compte de "${user.username}" ? Il ne pourra plus se connecter.`,
        confirmText: 'Confirmer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.isLoading = true;
      const operation$ = activer
        ? this.dataService.activateUser(user.id)
        : this.dataService.deactivateUser(user.id);

      operation$.pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          this.logOperation(
            OperationType.STATUS_CHANGE,
            user.id,
            `${activer ? 'Activation' : 'Désactivation'} de l'utilisateur "${user.username}"`,
            { isActive: user.isActive },
            { isActive: activer }
          );
          this.showSuccessMessage(`Utilisateur ${activer ? 'activé' : 'désactivé'} avec succès`);
          this.loadUsers();
        },
        error: (error) => {
          this.showErrorMessage(`Erreur: ${error.message}`);
        }
      });
    });
  }

  deleteUser(user: User): void {
    if (!this.canManageUser(user)) {
      this.showErrorMessage(this.deleteTooltip(user));
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l\'utilisateur',
        message: `Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur "${user.username}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        isDelete: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.dataService.deleteUser(user.id).pipe(
          finalize(() => this.isLoading = false)
        ).subscribe({
          next: () => {
            this.logOperation(
              OperationType.DELETE,
              user.id,
              `Suppression utilisateur "${user.username}"`,
              user,
              null
            );

            this.showSuccessMessage('Utilisateur supprimé avec succès');
            this.eventBusService.emit(Event.AJOUTER_USER);
          },
          error: () => {
            // Géré globalement par apiErrorInterceptor → ErrorDialogComponent
          }
        });
      }
    });
  }

  resetForm(): void {
    this.userForm.reset();
    this.isEditMode = false;
    this.currentUserId = null;
  }

  private scrollToForm(): void {
    const formElement = document.querySelector('.cardWithShadow');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private showSuccessMessage(message: string): void {
    this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: {
        title: 'Succès',
        message: message,
        isSuccess: true,
        confirmText: 'OK'
      }
    });
  }

  private showErrorMessage(message: string): void {
    this.dialog.open(ConfirmationModalComponent, {
      width: '400px',
      data: {
        title: 'Erreur',
        message: message,
        isError: true,
        confirmText: 'OK'
      }
    });
  }
}
