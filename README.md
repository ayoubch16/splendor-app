# SplendorApp

Application de gestion commerciale de Splendor Art (devis, factures, bons de livraison, clients, articles, traçabilité).

| Dossier | Contenu |
|---|---|
| `backend/` | API REST Laravel 8 |
| `front/` | Application Angular 19, dans `front/main` |

## Démarrage

```bash
# Back
cd backend
composer install
cp .env.example .env   # puis renseigner la base de données et le SMTP
php artisan key:generate
php artisan serve      # http://localhost:8000

# Front
cd front/main
npm install
npm start              # http://localhost:4200
```

L'URL de l'API utilisée par le front se règle dans `front/main/src/app/config.ts` (`BASE_URL`).
