import {Injectable} from '@angular/core';
import {ArticleTableFacture, Bl, Client, Devis, Facture, TypeDocument} from '../interfaces/entites';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {PdfDocument, PdfOptions} from "../components/download-pdf/download-pdf.component";


interface GeneratePdfOptions {
  type: TypeDocument;
  withSignature: boolean;
  printVersion?: boolean;
  signatureImageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  /**
   * Point d'entrée principal pour générer n'importe quel type de document PDF
   */
  generateDocumentPdf(document: PdfDocument, options: PdfOptions): Promise<Blob> {
    switch(options.type) {
      case 'FACTURE':
        return this.generatePdf(document as unknown as Facture, options);
      case 'DEVIS':
        return this.generatePdf(document as unknown as Devis, options);
      case 'BL':
        return this.generatePdf(document as unknown as Bl, options);
      default:
        return Promise.reject('Type de document non supporté');
    }
  }

  /**
   * Fonction unifiée pour générer des PDFs (factures, devis, BL)
   */
  async generatePdf(
    document: Facture | Devis | Bl,
    options: GeneratePdfOptions = { type: TypeDocument.FACTURE, withSignature: true }
  ): Promise<Blob> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    // Génération du PDF en plusieurs étapes
    this.addHeader(doc, pageWidth);
    this.addClientInfo(doc, this.getClientFromDocument(document), margin);
    this.addDocumentInfo(doc, document, options.type, pageWidth, margin);

    const articles = this.getArticlesFromDocument(document);
    this.generateArticlesTable(doc, articles, margin, 70, options.type === 'BL');

    const yPosition = 70 + articles.length * 10 + 20;

    if (options.type !== 'BL') {
      this.addTotalsSection(doc, articles, pageWidth, margin, yPosition);

      if (options.withSignature) {
        this.addSignature(doc, pageWidth, margin, yPosition, options.signatureImageUrl);
      }
    } else {
      if (options.withSignature) {
        this.addBlSignatureSection(doc, pageWidth, margin, yPosition, options.signatureImageUrl);
      }
    }

    return doc.output('blob');
  }

  /**
   * Ajoute l'en-tête du document avec le nom de l'entreprise
   */
  private addHeader(doc: jsPDF, pageWidth: number): void {
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SPLENDOR ART', pageWidth / 2, 20, { align: 'center' });
  }

  /**
   * Ajoute les informations du client
   */
  private addClientInfo(doc: jsPDF, client: Client, margin: number): void {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`CLIENT: ${client.raisonSociale}`, margin, 40);
    doc.text(`ADRESSE: ${client.ville?.nom + ' ' + client.adresse || ''}`, margin, 47);
    doc.text(`ICE: ${client.ice || ''}`, margin, 54);
  }

  /**
   * Ajoute les informations spécifiques au document (numéro et date)
   */
  private addDocumentInfo(doc: jsPDF, document: any, type: TypeDocument, pageWidth: number, margin: number): void {
    doc.setFont('helvetica', 'bold');

    const documentLabel = this.getDocumentLabel(type);
    const documentNumber = this.getDocumentNumber(document, type);

    doc.text(`${documentLabel}: N° ${documentNumber}`, pageWidth - margin, 40, { align: 'right' });
    doc.text(`DATE: ${new Date(document.date).toLocaleDateString('fr-FR')}`, pageWidth - margin, 47, { align: 'right' });
  }

  /**
   * Ajoute la section des totaux pour factures et devis
   */
  private addTotalsSection(doc: jsPDF, articles: ArticleTableFacture[], pageWidth: number, margin: number, yPosition: number): void {
    const totalHT = articles.reduce((sum, article) => sum + article.prixTotal, 0);
    const tva = totalHT * 0.2;
    const totalTTC = totalHT + tva;

    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth / 2, yPosition, pageWidth / 2 - margin, 30, 'F');

    doc.setFont('helvetica', 'normal');
    doc.text('Total H.T', pageWidth / 2 + 5, yPosition + 7);
    doc.text('T.V.A', pageWidth / 2 + 5, yPosition + 17);
    doc.text('Total T.T.C', pageWidth / 2 + 5, yPosition + 27);

    doc.setFont('helvetica', 'bold');
    doc.text(`${totalHT.toFixed(2)} DH`, pageWidth - margin - 5, yPosition + 7, { align: 'right' });
    doc.text(`${tva.toFixed(2)} DH`, pageWidth - margin - 5, yPosition + 17, { align: 'right' });
    doc.text(`${totalTTC.toFixed(2)} DH`, pageWidth - margin - 5, yPosition + 27, { align: 'right' });
  }

  /**
   * Ajoute la signature et les informations de l'entreprise
   */
  private async addSignature(doc: jsPDF, pageWidth: number, margin: number, yPosition: number, signatureImageUrl?: string): Promise<void> {
    if (signatureImageUrl) {
      try {
        await this.addImageToPdf(
          doc,
          signatureImageUrl,
          140,
          yPosition + 50,
          60,
          30
        );
      } catch (error) {
        console.error('Erreur lors du chargement de l\'image de signature:', error);
        this.addTextSignature(doc, pageWidth, margin, yPosition);
      }
    } else {
      this.addTextSignature(doc, pageWidth, margin, yPosition);
    }

    // Ligne de signature
    doc.setLineWidth(0.5);
    doc.line(pageWidth - margin - 60, yPosition + 80, pageWidth - margin, yPosition + 65);
  }

  /**
   * Ajoute la signature texte (fallback)
   */
  private addTextSignature(doc: jsPDF, pageWidth: number, margin: number, yPosition: number): void {
    doc.setFont('helvetica', 'italic');
    doc.text('SPLENDOR ART', pageWidth - margin - 40, yPosition + 60);
    doc.text('05 Apr 1, Rue Dakar', pageWidth - margin - 40, yPosition + 67);
    doc.text('Océan - Rabat', pageWidth - margin - 40, yPosition + 74);
  }

  /**
   * Ajoute la section de signature pour les bons de livraison
   */
  private async addBlSignatureSection(doc: jsPDF, pageWidth: number, margin: number, yPosition: number, signatureImageUrl?: string): Promise<void> {
    doc.setFont('helvetica', 'normal');

    if (signatureImageUrl) {
      try {
        // Image du fournisseur à gauche
        await this.addImageToPdf(doc, signatureImageUrl, margin, yPosition + 40, 60, 30);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'image de signature:', error);
        doc.text('Signature et Cachet Fournisseur:', margin, yPosition + 40);
        doc.text('SPLENDOR ART', margin + 10, yPosition + 50);
      }
    } else {
      doc.text('Signature et Cachet Fournisseur:', margin, yPosition + 40);
      doc.text('SPLENDOR ART', margin + 10, yPosition + 50);
    }

    // Signature côté réception
    doc.text('Signature et Cachet Réception:', pageWidth - margin - 60, yPosition + 40);
    doc.rect(pageWidth - margin - 70, yPosition + 45, 60, 30);
  }

  /**
   * Méthode helper pour ajouter une image au PDF
   */
  private async addImageToPdf(doc: jsPDF, imageUrl: string, x: number, y: number, width: number, height: number): Promise<void> {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const reader = new FileReader();
    return new Promise<void>((resolve, reject) => {
      reader.onload = () => {
        const base64data = reader.result as string;
        doc.addImage(base64data, 'PNG', x, y, width, height);
        resolve();
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Génère le tableau des articles
   */
  private generateArticlesTable(doc: jsPDF, articles: ArticleTableFacture[], x: number, y: number, hidePrices: boolean = false): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const tableWidth = pageWidth - 2 * margin;

    // En-têtes de colonnes
    doc.setFillColor(50, 50, 50);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.rect(x, y, tableWidth, 10, 'F');

    if (hidePrices) {
      // Version BL - sans prix
      doc.text('Désignation', x + 5, y + 6);
      doc.text('Quantité', x + tableWidth * 0.8, y + 6);
    } else {
      // Version Facture/Devis - avec prix
      doc.text('Désignation', x + 5, y + 6);
      doc.text('Quantité', x + tableWidth * 0.5, y + 6);
      doc.text('P.U.H.T', x + tableWidth * 0.65, y + 6);
      doc.text('Coût Total', x + tableWidth * 0.85, y + 6);
    }

    // Lignes des articles
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    articles.forEach((article, index) => {
      const yPos = y + 10 + index * 10;

      // Fond alterné pour les lignes
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(x, yPos, tableWidth, 10, 'F');
      }

      if (hidePrices) {
        // Version BL - sans prix
        doc.text(article.designation, x + 5, yPos + 6);
        doc.text(article.quantite.toString(), x + tableWidth * 0.8, yPos + 6);
      } else {
        // Version Facture/Devis - avec prix
        doc.text(article.designation, x + 5, yPos + 6);
        doc.text(article.quantite.toString(), x + tableWidth * 0.5, yPos + 6);
        doc.text(`${article.prixUnitaire.toFixed(2)} DH`, x + tableWidth * 0.65, yPos + 6);
        doc.text(`${article.prixTotal.toFixed(2)} DH`, x + tableWidth * 0.85, yPos + 6);
      }
    });
  }


  /**
   * Télécharge un PDF
   */
  downloadPdf(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Fonctions utilitaires pour obtenir des informations du document
   */
  private getDocumentLabel(type: TypeDocument): string {
    return type === 'FACTURE' ? 'FACTURE' :
      type === 'DEVIS' ? 'DEVIS' : 'BON DE LIVRAISON';
  }

  private getDocumentNumber(document: any, type: TypeDocument): string {
    if (type === 'FACTURE') return document.numFacture;
    if (type === 'DEVIS') return document.numDevis;
    return document.numBl;
  }

  private getClientFromDocument(document: any): Client {
    return document.client;
  }

  private getArticlesFromDocument(document: any): ArticleTableFacture[] {
    return document.articles;
  }
}
