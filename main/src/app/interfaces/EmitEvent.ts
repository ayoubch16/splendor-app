export interface EmitEvent {
  event: Event,
  data: any
}


export enum Event {
  AJOUTER_ARTICLE = 'AjoutArticle',
  MODIFIER_ARTICLE = 'ModifierArticle',
  SUPPRIMER_ARTICLE = 'SupprimerArticle',
  AJOUTER_BL = 'AjoutBL',
  MODIFIER_BL = 'ModifierBL',
  SUPPRIMER_BL = 'SupprimerBL',
  AJOUTER_DEVIS = 'AjoutDevis',
  MODIFIER_DEVIS = 'ModifierDevis',
  SUPPRIMER_DEVIS = 'SupprimerDevis',
  AJOUTER_FACTURE = 'AjoutFacture',
  MODIFIER_FACTURE = 'ModifierFacture',
  SUPPRIMER_FACTURE = 'SupprimerFacture',
  AJOUTER_CLIENT = 'AjoutClient',
  MODIFIER_CLIENT = 'ModifierClient',
  SUPPRIMER_CLIENT = 'SupprimerClient',
  AJOUTER_USER = 'AjoutUSER',
  MODIFIER_USER = 'ModifierUSER',
  SUPPRIMER_USER = 'SupprimerUSER',



}
