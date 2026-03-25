import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

const ERROR_CODE_MESSAGES: Record<string, string> = {
  // AUTH
  INVALID_CREDENTIALS: 'Nom d\'utilisateur ou mot de passe incorrect',
  ACCOUNT_DISABLED: 'Compte désactivé',

  // DEVIS
  DEVIS_NOT_FOUND: 'Devis introuvable',
  DEVIS_HAS_FACTURE: 'Suppression impossible : une facture est liée à ce devis',
  DEVIS_HAS_BL: 'Suppression impossible : un bon de livraison est lié à ce devis',
  DEVIS_HAS_FACTURE_AND_BL: 'Suppression impossible : une facture et un bon de livraison sont liés à ce devis',

  // FACTURE
  FACTURE_NOT_FOUND: 'Facture introuvable',
  FACTURE_ALREADY_PAID: 'Suppression impossible : la facture est déjà payée',
  DEVIS_ALREADY_HAS_FACTURE: 'Création impossible : une facture existe déjà pour ce devis',

  // BL
  BL_NOT_FOUND: 'Bon de livraison introuvable',
  DEVIS_ALREADY_HAS_BL: 'Création impossible : un bon de livraison existe déjà pour ce devis',
  INVALID_BL_ID: 'Identifiant du bon de livraison invalide',
  INVALID_DEVIS_ID: 'Identifiant du devis invalide',

  // ARTICLE
  ARTICLE_NOT_FOUND: 'Article introuvable',

  // Partagé (DEVIS / FACTURE / BL)
  INVALID_STATUT: 'Statut invalide pour cette opération',
};

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Requête invalide',
  401: 'Non autorisé',
  403: 'Accès refusé',
  404: 'Ressource introuvable',
  422: 'Opération impossible',
  500: 'Erreur serveur, réessayez plus tard',
};

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {

  /**
   * Résout le message d'erreur à afficher pour une réponse HTTP en erreur.
   *
   * Priorité :
   * 1. `error.error.errorCode`  → message métier mappé (table ci-dessus)
   *    Cas spécial CLIENT_HAS_DOCUMENTS : utilise directement `error.error.message`
   *    car l'API liste précisément les documents associés.
   * 2. `error.error.message`    → message brut retourné par l'API
   * 3. Code HTTP               → message générique par statut
   */
  getErrorMessage(error: HttpErrorResponse): string {
    try {
      const body = typeof error.error === 'string'
        ? JSON.parse(error.error)
        : error.error;

      const errorCode: string | undefined = body?.errorCode;
      const apiMessage: string | undefined = body?.message;

      if (errorCode) {
        // CLIENT_HAS_DOCUMENTS : le champ "message" de l'API liste exactement
        // les documents concernés — on l'affiche directement.
        if (errorCode === 'CLIENT_HAS_DOCUMENTS' && apiMessage) {
          return apiMessage;
        }

        const mapped = ERROR_CODE_MESSAGES[errorCode];
        if (mapped) return mapped;
      }

      if (apiMessage) return apiMessage;
    } catch {
      // Le corps n'est pas du JSON valide
    }

    return HTTP_STATUS_MESSAGES[error.status]
      ?? 'Une erreur inattendue est survenue. Veuillez réessayer.';
  }
}
