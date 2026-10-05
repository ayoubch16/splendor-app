// Interfaces
export interface Article {
  id: number;
  unite: string;
  categoryArticle:CategoryArticle
  categoryId: number;
  nameArticle: string;
  descriptionArticle: string;
  priceArticle: number;
}

export interface ArticleTable {
  id?: number;
  designation: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
  remise?: number;
}

export interface ArticleTableBl {
  id?: number;
  designation: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
  bl?: Bl;
  remise?: number;
}

export interface ArticleTableDevis {
  id?: number;
  designation: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
  devis?: Devis;
  remise?: number;
}

export interface ArticleTableFacture {
  id?: number;
  designation: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
  facture?: Facture;
  remise?: number;
}

export interface Bl {
  id: number;
  numBl: string;
  client: Client;
  statut: StatutBL;
  date: string;
  articles: ArticleTableBl[];
  numBC?:string;
  client_id?: number;
}

export interface CategoryArticle {
  id: number;
  category: string;
}

export interface CategoriesData {
  categories: CategoryArticle[];
}

export interface Client {
  id: number;
  raisonSociale: string;
  adresse: string;
  ville_id: number;
  ville?:Ville
  ice: string;
  telephone: string;
  email: string;
}

export interface Devis {
  id?: number;
  numDevis: string;
  client: Client;
  client_id?: number;
  montant: string;
  statut: StatutDevis;
  date: string;
  articles: ArticleTableDevis[];
  factureExistante?:boolean
  blExistante?:boolean
  remiseDevis?:number
}

export interface Facture {
  id?: number;
  numFacture?: string;
  client: Client;
  client_id?: number;
  montant: string;
  statut: StatutFacture;
  date: string;
  articles: ArticleTableFacture[];
  numBC?:string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  // Optionnel : jamais renvoyé par le backend, et laissé vide en édition pour ne pas changer le mot de passe
  password?: string;
  first_name: string;
  last_name: string;
  isActive: boolean;
  role: string;
}

export interface Ville {
  id: number;
  nom: string;
  codePostal: string;
  region: string;
}

export interface VillesData {
  villes: Ville[];
}

// Enums
export enum TypeDocument {
  DEVIS = 'DEVIS',
  FACTURE = 'FACTURE',
  BL = 'BL'
}

export enum StatutFacture {
  NON_PAYEE = 'NON_PAYEE',
  PARTIELLEMENT_PAYEE = 'PARTIELLEMENT_PAYEE',
  PAYEE = 'PAYEE',
}

export enum StatutDevis {
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
}

export enum StatutBL {
  LIVRE = 'LIVRE',
  NON_LIVRE = 'NON_LIVRE',
}

export enum ERole {
  ROLE_USER = 'ROLE_USER',
  ROLE_ADMIN = 'ROLE_ADMIN',
  ROLE_SUPER_ADMIN = 'ROLE_SUPER_ADMIN',
  ROLE_CLIENT = 'ROLE_CLIENT',
  ROLE_VENDEUR = 'ROLE_VENDEUR',
  ROLE_COMPTABLE = 'ROLE_COMPTABLE',
  ROLE_COMMERCIAL = 'ROLE_COMMERCIAL'
}

export interface TraceOperation {
  id?: number;
  timestamp: Date;
  operationType: OperationType;
  entityType: EntityType;
  entityId: number;
  userId: number;
  userName: string;
  details: string;
  previousState?: any;
  newState?: any;
}

export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  READ = 'READ',
  STATUS_CHANGE = 'STATUS_CHANGE',
  EMAIL_SENT = 'EMAIL_SENT',
  PDF_GENERATED = 'PDF_GENERATED'
}

export enum EntityType {
  DEVIS = 'DEVIS',
  CLIENT = 'CLIENT',
  ARTICLE = 'ARTICLE',
  FACTURE = 'FACTURE',
  BON_LIVRAISON = 'BON_LIVRAISON',
  USER = 'USER'
}
