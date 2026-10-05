# CLAUDE.md — SplendorApp / MaterialM

## 1. Description du projet

**SplendorApp** est une application de gestion commerciale et documentaire développée avec **Angular 19**. Elle permet de gérer :

- **Devis** — création, suivi et modification de devis clients
- **Factures** — facturation, statuts de paiement, génération PDF
- **Bons de Livraison (BL)** — suivi des livraisons
- **Clients** — gestion du portefeuille clients
- **Articles** — catalogue produits avec catégories
- **Traçabilité** — journal d'audit de toutes les opérations (CREATE, UPDATE, DELETE, STATUS_CHANGE, EMAIL_SENT, PDF_GENERATED)
- **Authentification & Autorisation** — RBAC avec 7 rôles distincts

L'application est un SPA Angular déployée via **Netlify** avec un backend séparé (API REST **Laravel**, dossier `backend/`).

---

## 2. Architecture et structure des dossiers

```
materialm/
├── main/                          # Application Angular principale
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/        # Composants réutilisables
│   │   │   │   ├── change-status/
│   │   │   │   ├── compteur-file/
│   │   │   │   ├── confirmation-modal/
│   │   │   │   ├── derniers-fichiers/
│   │   │   │   ├── download-pdf/
│   │   │   │   ├── error-dialog/
│   │   │   │   ├── pdf-viewer-modal/
│   │   │   │   └── send-email/
│   │   │   ├── const/
│   │   │   │   └── endpoints.ts   # Définitions des endpoints API
│   │   │   ├── interfaces/
│   │   │   │   ├── entites.ts     # Modèles de données & interfaces TypeScript
│   │   │   │   ├── EmitEvent.ts
│   │   │   │   └── enum/          # Enums (StatutFacture, StatutDevis, StatutBL, ERole)
│   │   │   ├── layouts/
│   │   │   │   ├── blank/         # Layout pages auth
│   │   │   │   └── full/          # Layout principal (header + sidebar)
│   │   │   ├── pages/
│   │   │   │   ├── articles/
│   │   │   │   ├── authentication/
│   │   │   │   ├── bl/
│   │   │   │   ├── clients/
│   │   │   │   ├── devis/
│   │   │   │   ├── factures/
│   │   │   │   ├── profil/
│   │   │   │   ├── starter/       # Dashboard
│   │   │   │   ├── traceability/
│   │   │   │   └── users/         # Gestion des utilisateurs (ADMIN / SUPER_ADMIN)
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.guard.ts, already-auth.guard.ts & role.guard.ts
│   │   │   │   ├── http.service.ts       # Intercepteur HTTP centralisé
│   │   │   │   ├── data.service.ts       # Opérations CRUD principales
│   │   │   │   ├── pdf.service.ts & pdfV2.service.ts
│   │   │   │   ├── traceability.service.ts
│   │   │   │   ├── error.service.ts & error-handler.service.ts
│   │   │   │   ├── core.service.ts
│   │   │   │   ├── event-bus.service.ts
│   │   │   │   └── nav.service.ts
│   │   │   ├── app.component.ts
│   │   │   ├── app.routes.ts      # Routing principal
│   │   │   ├── app.config.ts      # Configuration application
│   │   │   └── config.ts
│   │   ├── assets/
│   │   ├── styles.scss
│   │   └── main.ts
│   ├── angular.json
│   ├── tsconfig.json
│   ├── package.json
│   └── eslint.config.js
├── netlify.toml                   # Config déploiement Netlify
└── CLAUDE.md                      # Ce fichier
```

### Architecture en couches

```
UI (Components / Pages)
        ↓
Feature Services (pdf, traceability...)
        ↓
Data Service (CRUD générique)
        ↓
HTTP Service (intercepteur, auth token)
        ↓
Backend REST API
```

---

## 3. Technologies et dépendances

| Catégorie | Technologie | Version |
|-----------|-------------|---------|
| Framework | Angular | 19.0.5 |
| Langage | TypeScript | 5.6.3 |
| Réactivité | RxJS | 7.5.0 |
| UI | Angular Material | 19.0.4 |
| CDK | Angular CDK | 19.0.4 |
| Styles | SCSS / SASS | 1.57.1 |
| Icônes | Angular Tabler Icons + Iconify | — |
| Charts | ApexCharts + ng-apexcharts | 3.40.0 |
| Scrollbar | ngx-scrollbar | 11.0.0 |
| i18n | @ngx-translate/core | 14.0.0 |
| Extensions Material | @ng-matero/extensions | 17.0.0 |
| Linting | ESLint + Angular ESLint | 9.23.0 / 19.3.0 |
| Tests | Karma + Jasmine | 6.4.0 / 4.5.0 |
| Déploiement | Netlify | — |

**Scripts disponibles :**
```bash
ng serve                    # Serveur de développement
ng build --base-href ./     # Build production
ng test                     # Tests unitaires
ng lint                     # Linting
```

---

## 4. Conventions de code

### Composants (Standalone)
- Tous les composants utilisent **`standalone: true`**
- Sélecteurs en **kebab-case** avec préfixe `app-` (ex: `app-confirmation-modal`)
- Fichiers séparés : `.ts`, `.html`, `.scss`
- Classes en **PascalCase** (ex: `ConfirmationModalComponent`)

```typescript
@Component({
  selector: 'app-mon-composant',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './mon-composant.component.html',
  styleUrl: './mon-composant.component.scss'
})
export class MonComposantComponent { ... }
```

### Services
- Tous injectables via **`providedIn: 'root'`**
- Suffixe `-service` pour les fichiers (ex: `auth.service.ts`)
- Appels HTTP centralisés via `HttpService`

### Nommage des fichiers
| Type | Convention | Exemple |
|------|------------|---------|
| Composants | kebab-case | `mon-composant.component.ts` |
| Services | kebab-case | `mon-service.service.ts` |
| Guards | kebab-case | `auth.guard.ts` |
| Interfaces | PascalCase dans `entites.ts` | `interface Article {}` |
| Enums | PascalCase dans `enum/` | `enum StatutFacture {}` |

### Modèles de données
- Interfaces TypeScript centralisées dans `interfaces/entites.ts`
- Séparation entre modèles API et modèles table UI (ex: `Article` vs `ArticleTable`)
- Enums pour les valeurs de statut

### Routing
- Hash-based routing (`withHashLocation`)
- Lazy loading des modules par page
- Guards sur toutes les routes protégées

### Rôles disponibles
```typescript
enum ERole {
  ROLE_USER, ROLE_ADMIN, ROLE_SUPER_ADMIN,
  ROLE_CLIENT, ROLE_VENDEUR, ROLE_COMPTABLE, ROLE_COMMERCIAL
}
```

---

## 5. Tâches en cours et état d'avancement

> Dernière mise à jour : 11/03/2026 (commit `c94743d`)

### Module Factures (en développement actif)
- Les commits récents indiquent un travail centré sur le module **FactApp** (factures)
- Commits datés : 11/03/2026, 22/02/2026, 17/08/2025, 05/05/2025

### État général des modules
| Module | État estimé |
|--------|-------------|
| Authentication | Stable |
| Articles | Stable |
| Clients | Stable |
| Devis | Stable |
| Factures | En développement actif |
| BL (Bons de Livraison) | Stable |
| Traçabilité | Stable |
| Profil utilisateur | Stable |

### Fonctionnalités transverses
- [x] Génération PDF (pdf.service.ts + pdfV2.service.ts)
- [x] Envoi d'emails avec PJ PDF
- [x] Gestion des statuts de documents
- [x] Audit trail / Traçabilité
- [x] Modals de confirmation
- [x] Visualiseur PDF

---

## 6. Décisions techniques importantes

### Angular 19 Standalone Components
**Décision** : Utilisation exclusive des composants standalone (sans NgModules).
**Raison** : Meilleure tree-shaking, imports explicites, alignement avec la direction Angular.

### Hash-based Routing (`withHashLocation`)
**Décision** : Routing basé sur le hash (`#`) plutôt que le routing HTML5.
**Raison** : Compatibilité avec le déploiement Netlify sans configuration serveur complexe pour le fallback.

### HTTP Service centralisé
**Décision** : Toutes les requêtes HTTP passent par `HttpService`.
**Raison** : Centralisation de la gestion du token, des headers, et de la gestion des erreurs.

### Deux services PDF (pdf.service.ts + pdfV2.service.ts)
**Décision** : Coexistence de deux versions du service PDF.
**Raison** : Migration progressive vers une nouvelle implémentation (V2) sans casser l'existant.

### Bundle size élevé autorisé
**Décision** : `maximumWarning` et `maximumError` configurés à **12 MB**.
**Raison** : ApexCharts et les librairies de génération PDF sont volumineux — compromis accepté.

### CommonJS dependencies allowlisted
**Décision** : `allowedCommonJsDependencies` inclut `apexcharts`, `bezier-easing`, `core-js`, `canvg`.
**Raison** : Ces librairies ne fournissent pas de builds ESM ; supprime les warnings de build.

### Authentification par token localStorage
**Décision** : Le token JWT est stocké dans `localStorage`.
**Raison** : Persistance de session entre les onglets ; acceptable pour le contexte applicatif interne.

### Traçabilité applicative
**Décision** : Toutes les opérations (CRUD, email, PDF) génèrent une entrée de traçabilité via `traceability.service.ts`.
**Raison** : Audit trail pour conformité et support client.
