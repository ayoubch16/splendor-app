# CLAUDE.md — Gestion Devis & Factures (Backend)

## 1. Description du projet

API REST Laravel pour la gestion commerciale de **Splendor Art** (Rabat, Maroc). L'application couvre l'ensemble du cycle de vie des documents commerciaux :

- Création et gestion de **devis** (citations)
- Conversion d'un devis en **facture** ou en **bon de livraison (BL)**
- Gestion du catalogue **articles** et du fichier **clients**
- Export **PDF** des documents (devis, factures, BL) via DomPDF
- Envoi d'**emails** avec pièces jointes PDF
- Système de **traçabilité** de toutes les opérations (audit log)
- Gestion des **utilisateurs** avec rôles et statut actif/inactif

Le frontend consommateur de cette API est une application **Angular** hébergée séparément.

---

## 2. Architecture et structure des dossiers

```
gestion-devis-facture-backend-v1/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── ArticleController.php       # CRUD articles du catalogue
│   │   │   ├── AuthController.php          # Login / Logout (Sanctum)
│   │   │   ├── BlController.php            # CRUD bons de livraison
│   │   │   ├── ClientController.php        # CRUD clients + villes
│   │   │   ├── DevisController.php         # CRUD devis + changement statut
│   │   │   ├── FactureController.php       # CRUD factures + changement statut
│   │   │   ├── PdfExportController.php     # Export PDF (DomPDF)
│   │   │   ├── SharedController.php        # Compteurs dashboard + envoi email (PDF en pièce jointe)
│   │   │   ├── TraceabilityController.php  # Audit log des opérations
│   │   │   └── UserController.php          # CRUD utilisateurs
│   │   ├── Kernel.php
│   │   ├── Middleware/
│   │   │   ├── CheckRole.php               # Middleware 'role' (enregistré, pas encore appliqué aux routes)
│   │   │   └── VerifyCsrfToken.php
│   │   └── Resources/
│   │       └── UserResource.php            # Format JSON d'un utilisateur (isActive en camelCase)
│   ├── Mail/
│   │   └── GenericEmailWithAttachment.php  # Email générique avec PDF en pièce jointe
│   ├── Models/
│   │   ├── Article.php                     # Catalogue articles
│   │   ├── ArticleTableBl.php              # Lignes articles d'un BL
│   │   ├── ArticleTableDevis.php           # Lignes articles d'un devis
│   │   ├── ArticleTableFacture.php         # Lignes articles d'une facture
│   │   ├── Bl.php                          # Bon de livraison
│   │   ├── Client.php                      # Client
│   │   ├── Devis.php                       # Devis
│   │   ├── Facture.php                     # Facture
│   │   ├── TraceOperation.php              # Entrée d'audit log
│   │   └── User.php                        # Utilisateur
│   └── Providers/
│       ├── AppServiceProvider.php
│       ├── AuthServiceProvider.php
│       ├── DocumentNumberServiceProvider.php  # Générateur de numéros de documents
│       ├── EventServiceProvider.php
│       └── RouteServiceProvider.php
├── config/
│   ├── cors.php                            # CORS ouvert + domaines autorisés
│   └── sanctum.php                         # Auth token Laravel Sanctum
├── database/
│   ├── migrations/
│   │   ├── 2025_05_29_002_create_articles_table.php
│   │   ├── 2025_05_29_004_create_clients_table.php
│   │   ├── 2025_05_29_005_create_devis_table.php
│   │   ├── 2025_05_29_006_create_article_table_devis_table.php
│   │   ├── 2025_05_29_007_create_factures_table.php
│   │   ├── 2025_05_29_008_create_article_table_factures_table.php
│   │   ├── 2025_05_29_009_create_bls_table.php
│   │   ├── 2025_05_29_010_create_article_table_bls_table.php
│   │   └── 2025_08_21_225000_create_trace_operations_table.php  # INCOMPLET
│   └── seeders/
├── resources/
│   ├── images/                             # Entête Splendor Art pour PDF
│   └── views/pdf/                          # Templates Blade pour PDF
├── routes/
│   └── api.php                             # Toutes les routes API
└── public/
    └── .htaccess                           # Réécriture URL Apache (AppServ)
```

### Schéma des relations principales

```
Client ──< Devis ──> Facture
              └──> BL (Bon de Livraison)

Devis      ──< ArticleTableDevis
Facture    ──< ArticleTableFacture
BL         ──< ArticleTableBl
```

---

## 3. Technologies et dépendances

| Composant | Version / Détail |
|---|---|
| PHP | ^7.3 \| ^8.0 |
| Laravel | ^8.75 |
| Laravel Sanctum | * (token-based auth) |
| barryvdh/laravel-dompdf | ^2.2 (génération PDF) |
| fruitcake/laravel-cors | ^2.2 (CORS middleware) |
| guzzlehttp/guzzle | ^7.0.1 |
| Base de données | MySQL (environnement AppServ/WAMP Windows) |
| Serveur | Apache via AppServ (Windows 11) |
| Frontend consommateur | Angular (repo séparé) |

**Dev dependencies** : PHPUnit 9, Faker, Mockery, Laravel Sail, Ignition.

---

## 4. Conventions de code

### Nommage
- **Base de données** : `snake_case` (ex: `client_id`, `operation_type`)
- **API JSON** (réponses vers Angular) : `camelCase` (ex: `operationType`, `entityId`)
- **Champs de modèles** : mixte selon origine (certains en camelCase natif : `numDevis`, `prixUnitaire`, `raisonSociale`)
- **Classes** : `PascalCase` (PSR-4)
- **Méthodes** : `camelCase`

### Numérotation automatique des documents
Le service `DocumentNumberServiceProvider` (singleton `app('documentNumber')`) génère :
- Devis : `DEV-YY-XXXXX` (ex: `DEV-26-00001`)

Les numéros de facture et de BL sont dérivés du numéro du devis d'origine (`DEV` remplacé par `FACT` / `BL`).

### Transactions DB
Les opérations qui modifient plusieurs tables (create/update/delete avec cascade) utilisent systématiquement `DB::beginTransaction()` / `DB::commit()` / `DB::rollBack()`.

### Validation
- `store()` : utilise `$request->validate([...])` (règles strictes `required`)
- `update()` : utilise `validator($requestData, [...])` avec règles `sometimes` pour les PATCH partiels

### Réponses HTTP
- Succès liste/show : retour direct du modèle Eloquent (pas d'enveloppe JSON)
- Erreurs : `response()->json(['success' => false, 'message' => '...'], code)`
- Suppression réussie : `response()->json(['success' => true, 'message' => '...'])`

---

## 5. Routes API

Toutes les routes sont sous le préfixe `/api/` (défini dans `RouteServiceProvider`).
**Aucune authentification middleware n'est appliquée globalement** (sauf `/users/logout` et l'envoi d'email, protégés par `auth:sanctum`).

Ce tableau correspond exactement aux endpoints déclarés côté Angular dans `src/app/const/endpoints.ts` : toute route ajoutée ou retirée doit l'être des deux côtés.

| Méthode | URL | Action |
|---|---|---|
| POST | `/users/login` | Authentification |
| POST | `/users/logout` | Déconnexion (auth:sanctum requis) |
| GET/POST | `/users` | Liste / création utilisateur |
| GET/PUT/DELETE | `/users/{id}` | Lecture / modification / suppression utilisateur |
| PATCH (ou PUT) | `/users/{id}/{activate\|deactivate}` | Activation / désactivation |
| GET/POST | `/articles` | Liste / création article |
| PUT/DELETE | `/articles/{id}` | Modification / suppression article |
| GET/POST | `/clients` | Liste / création client |
| PUT/DELETE | `/clients/{id}` | Modification / suppression client |
| GET/POST | `/devis` | Liste / création devis |
| PUT/DELETE | `/devis/{id}` | Modification / suppression devis |
| PUT | `/devis/{id}/{statut}` | Changement statut devis |
| POST | `/factures/{id}` | Créer facture depuis devis |
| GET | `/factures` | Liste factures |
| PUT/DELETE | `/factures/{id}` | Modification / suppression facture |
| PUT | `/factures/{id}/{statut}` | Changement statut facture |
| POST | `/bls/{id}` | Créer BL depuis devis |
| GET | `/bls` | Liste BL |
| PUT/DELETE | `/bls/{id}` | Modification / suppression BL |
| PUT | `/bls/{id}/{statut}` | Changement statut BL |
| GET | `/last-devis`, `/last-factures`, `/last-bls` | 5 derniers documents (dashboard) |
| GET | `/shared/cptfacture`, `/shared/cptdevis`, `/shared/cptbl` | Compteurs dashboard |
| POST | `/shared/emails/send-with-attachment` | Envoi email avec PDF en base64 (auth:sanctum requis) |
| POST | `/download-pdf` | Export PDF (devis/facture/bl) |
| POST/GET | `/traceability` | Audit log |

### Statuts métier

| Document | Statuts possibles |
|---|---|
| Devis | `EN_ATTENTE`, `ACCEPTE`, `REFUSE` |
| Facture | `NON_PAYEE`, `PARTIELLEMENT_PAYEE`, `PAYEE` |
| BL | `NON_LIVRE`, `LIVRE` |

---

## 6. Tâches en cours et état d'avancement

### Fonctionnalités récemment ajoutées (non commitées)

| Fichier | État | Notes |
|---|---|---|
| `PdfExportController.php` | Fonctionnel | Export PDF via DomPDF pour devis/facture/BL |
| `TraceabilityController.php` | Fonctionnel | Audit log complet (CRUD + stats) |
| `TraceOperation.php` (model) | Fonctionnel | Casts JSON pour `previous_state`/`new_state` |
| `2025_08_21_225000_create_trace_operations_table.php` | **INCOMPLET** | La migration ne crée que `id` + `timestamps` — les colonnes métier sont absentes |
| `resources/views/pdf/` | En cours | Templates Blade pour PDF (contenu à vérifier) |
| `resources/images/` | En cours | Images entête Splendor Art pour PDF |

### Problème critique identifié

La migration `2025_08_21_225000_create_trace_operations_table.php` est **incomplète** : elle ne définit pas les colonnes nécessaires au modèle `TraceOperation` (`timestamp`, `operation_type`, `entity_type`, `entity_id`, `user_id`, `user_name`, `details`, `previous_state`, `new_state`). La table en base doit avoir été créée manuellement ou via une version antérieure.

### Fichiers supprimés (ancienne version)
- `app/Models/CategoryArticle.php` — supprimé (catégories intégrées différemment)
- `database/migrations/2025_05_29_001_create_category_articles_table.php` — supprimé
- `database/migrations/2025_05_29_003_create_villes_table.php` — supprimé

---

## 7. Décisions techniques importantes

### 1. Articles en tables pivot dédiées
Les lignes d'articles dans les documents (devis, factures, BL) sont stockées dans des tables séparées (`article_table_devis`, `article_table_factures`, `article_table_bls`) avec snapshot des données au moment de la création. Cela préserve l'historique même si le catalogue `articles` est modifié ultérieurement.

### 2. Conversion Devis → Facture / BL
- Un devis possède deux flags booléens : `factureExistante` et `blExistante`
- La création d'une facture depuis un devis copie les articles et met `factureExistante = true`
- La suppression d'une facture remet ce flag à `false`
- Un devis avec facture ou BL existant ne peut pas être supprimé

### 3. Authentification sans protection globale des routes
Actuellement, seules les routes `logout` et `shared/emails/send-with-attachment` sont protégées par `auth:sanctum`. Toutes les autres routes sont publiques. C'est un choix délibéré (probablement pour simplifier le développement), mais représente un risque de sécurité en production.

### 4. Correspondance camelCase ↔ snake_case
Le frontend Angular envoie et attend du `camelCase`. La base de données utilise `snake_case`. La conversion est faite manuellement dans `TraceabilityController` (mapping explicite champ par champ).

### 5. CORS ouvert
`config/cors.php` autorise toutes les origines (`'*'`) en plus des domaines spécifiques `devchoukri.com` et `splendorart.ma`. En production, restreindre à ces domaines uniquement.

### 6. Données entreprise codées en dur
Les coordonnées de Splendor Art (téléphones, email, ICE, patente, RC, IF, CNSS) sont codées en dur dans `PdfExportController`. Une migration vers la config ou la base de données serait préférable.

### 7. Environnement de développement
Le projet tourne sur **AppServ** (Windows), avec `.htaccess` à la racine et dans `public/` pour la réécriture d'URL Apache. Le fichier `index.php` à la racine est un redirecteur vers `public/index.php` (déploiement sans virtual host).
