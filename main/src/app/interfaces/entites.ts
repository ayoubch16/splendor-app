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
}

export interface ArticleTableBl {
  id?: number;
  designation: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
  bl?: Bl;
}

export interface ArticleTableDevis {
  id?: number;
  designation: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
  devis?: Devis;
}

export interface ArticleTableFacture {
  id?: number;
  designation: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
  facture?: Facture;
}

export interface Bl {
  id: number;
  numBl: string;
  client: Client;
  statut: StatutBL;
  date: string;
  articles: ArticleTableBl[];
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
}

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
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

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
  };
}

export interface InfromationPdf {
  type:string,
  id:number
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

export interface PdfDocument {
  id: number;
  reference: string;
  client:Client
}

export interface EmailPayload {
  email: string;
  subject: string;
  message: string;
  imprimable: boolean;
  pdfBase64?: string; // PDF encodé en base64
  fileName?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
}
