import { Injectable } from '@angular/core';
import { ArticleTableFacture, Bl, Client, Devis, Facture, TypeDocument } from '../interfaces/entites';
import jsPDF from 'jspdf';
import { PdfDocument, PdfOptions } from "../components/download-pdf/download-pdf.component";
import villesData from '../../assets/data/villes.json';

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
  private readonly HEADER_IMAGE = 'assets/images/header-entete-splendor.png';
  private readonly FOOTER_IMAGE = 'assets/images/footer-entete-splendor.png';
  private readonly SIGNATURE_IMAGE = 'assets/images/sig-splendort.png';
  private readonly HEADER_HEIGHT = 40;
  private readonly FOOTER_HEIGHT = 30;
  private readonly SIGNATURE_HEIGHT = 30;
  private readonly SIGNATURE_WIDTH = 80;

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

  async generatePdf(
    document: Facture | Devis | Bl,
    options: GeneratePdfOptions = { type: TypeDocument.FACTURE, withSignature: true }
  ): Promise<Blob> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    await this.addHeaderImage(doc);

    this.addClientInfo(doc, this.getClientFromDocument(document), margin);
    this.addDocumentInfo(doc, document, options.type, pageWidth, margin);

    const articles = this.getArticlesFromDocument(document);
    const startY = 40 + this.HEADER_HEIGHT;
    const tableEndY = this.generateArticlesTable(doc, articles, margin, startY, options.type === 'BL');
    const yPosition = tableEndY + 5; // Réduit la marge après le tableau

    if (options.type !== 'BL') {
      this.addTotalsSection(doc, articles, pageWidth, margin, yPosition);

      if (options.withSignature) {
        await this.addSignature(doc, pageWidth, margin, yPosition);
      }
    } else {
      if (options.withSignature) {
        await this.addBlSignatureSection(doc, pageWidth, margin, yPosition);
      }
    }

    await this.addFooterImage(doc);
    return doc.output('blob');
  }

  private async addHeaderImage(doc: jsPDF): Promise<void> {
    try {
      await this.addImageToPdf(
        doc,
        this.HEADER_IMAGE,
        0,
        0,
        doc.internal.pageSize.getWidth(),
        this.HEADER_HEIGHT
      );
    } catch (error) {
      console.error('Erreur lors du chargement de l\'image d\'en-tête:', error);
      this.addHeader(doc, doc.internal.pageSize.getWidth());
    }
  }

  private async addFooterImage(doc: jsPDF): Promise<void> {
    try {
      const pageHeight = doc.internal.pageSize.getHeight();
      await this.addImageToPdf(
        doc,
        this.FOOTER_IMAGE,
        0,
        pageHeight - this.FOOTER_HEIGHT,
        doc.internal.pageSize.getWidth(),
        this.FOOTER_HEIGHT
      );
    } catch (error) {
      console.error('Erreur lors du chargement de l\'image de pied de page:', error);
      this.addFooterText(doc);
    }
  }

  private async addSignature(doc: jsPDF, pageWidth: number, margin: number, yPosition: number): Promise<void> {
    try {
      await this.addImageToPdf(
        doc,
        this.SIGNATURE_IMAGE,
        pageWidth - margin - this.SIGNATURE_WIDTH - 10,
        yPosition + 40,
        this.SIGNATURE_WIDTH,
        this.SIGNATURE_HEIGHT
      );
    } catch (error) {
      console.error('Erreur lors du chargement de l\'image de signature:', error);
      this.addTextSignature(doc, pageWidth, margin, yPosition);
    }
  }

  private async addBlSignatureSection(doc: jsPDF, pageWidth: number, margin: number, yPosition: number): Promise<void> {
    try {
      await this.addImageToPdf(
        doc,
        this.SIGNATURE_IMAGE,
        margin,
        yPosition + 40,
        this.SIGNATURE_WIDTH,
        this.SIGNATURE_HEIGHT
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Signature et Cachet Fournisseur:', margin, yPosition + 40 + this.SIGNATURE_HEIGHT + 5);

      doc.text('Signature et Cachet Réception:', pageWidth - margin - 60, yPosition + 40);
      doc.rect(pageWidth - margin - 70, yPosition + 45, 60, 30);

    } catch (error) {
      console.error('Erreur lors du chargement de l\'image de signature:', error);
      doc.text('Signature et Cachet Fournisseur:', margin, yPosition + 40);
      doc.text('SPLENDOR ART', margin + 10, yPosition + 50);
      doc.text('Signature et Cachet Réception:', pageWidth - margin - 60, yPosition + 40);
      doc.rect(pageWidth - margin - 70, yPosition + 45, 60, 30);
    }
  }

  private addFooterText(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('SPLENDOR ART - 05 Apr 1, Rue Dakar - Océan, Rabat', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('Tél: +212 5 37 73 53 53 - Email: contact@splendorart.ma', pageWidth / 2, pageHeight - 5, { align: 'center' });
  }

  private addHeader(doc: jsPDF, pageWidth: number): void {
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SPLENDOR ART', pageWidth / 2, 20, { align: 'center' });
  }

  private addClientInfo(doc: jsPDF, client: Client, margin: number): void {
    const ville = villesData.villes.find((v: { id: number; }) => v.id === client.ville_id);
    const villeNom = ville ? ville.nom : '';
    const codePostal = ville ? ville.codePostal : '';
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`CLIENT: ${client.raisonSociale}`, margin, 10 + this.HEADER_HEIGHT);
    doc.text(`ADRESSE: ${client.adresse || ''}, ${villeNom} ${codePostal}`, margin, 17 + this.HEADER_HEIGHT);
    doc.text(`ICE: ${client.ice || ''}`, margin, 24 + this.HEADER_HEIGHT);
  }

  private addDocumentInfo(doc: jsPDF, document: any, type: TypeDocument, pageWidth: number, margin: number): void {
    doc.setFont('helvetica', 'bold');
    const documentLabel = this.getDocumentLabel(type);
    const documentNumber = this.getDocumentNumber(document, type);

    doc.text(`${documentLabel}: N° ${documentNumber}`, pageWidth - margin, 10 + this.HEADER_HEIGHT, { align: 'right' });
    doc.text(`DATE: ${new Date(document.date).toLocaleDateString('fr-FR')}`, pageWidth - margin, 17 + this.HEADER_HEIGHT, { align: 'right' });
  }

  private addTotalsSection(doc: jsPDF, articles: ArticleTableFacture[], pageWidth: number, margin: number, yPosition: number): void {
    const totalHT = articles.reduce((sum, article) => sum + Number(article.prixTotal || 0), 0);
    const tva = totalHT * 0.2;
    const totalTTC = totalHT + tva;

    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth / 2, yPosition, pageWidth / 2 - margin, 30, 'F');

    doc.setFont('helvetica', 'normal');
    doc.text('Total H.T', pageWidth / 2 + 5, yPosition + 7);
    doc.text('T.V.A', pageWidth / 2 + 5, yPosition + 17);
    doc.text('Total T.T.C', pageWidth / 2 + 5, yPosition + 27);

    doc.setFont('helvetica', 'bold');
    doc.text(`${Number(totalHT).toFixed(2)} DH`, pageWidth - margin - 5, yPosition + 7, { align: 'right' });
    doc.text(`${tva.toFixed(2)} DH`, pageWidth - margin - 5, yPosition + 17, { align: 'right' });
    doc.text(`${totalTTC.toFixed(2)} DH`, pageWidth - margin - 5, yPosition + 27, { align: 'right' });
  }

  private addTextSignature(doc: jsPDF, pageWidth: number, margin: number, yPosition: number): void {
    doc.setFont('helvetica', 'italic');
    doc.text('SPLENDOR ART', pageWidth - margin - 40, yPosition + 60);
    doc.text('05 Apr 1, Rue Dakar', pageWidth - margin - 40, yPosition + 67);
    doc.text('Océan - Rabat', pageWidth - margin - 40, yPosition + 74);
  }

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

  private generateArticlesTable(doc: jsPDF, articles: ArticleTableFacture[], x: number, y: number, hidePrices: boolean = false): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const tableWidth = pageWidth - 2 * margin;

    // Définir les largeurs de colonnes
    const colDesignationWidth = tableWidth * 0.65;
    const colQtyWidth = tableWidth * 0.10;
    const colUnitPriceWidth = tableWidth * 0.10;
    const colTotalWidth = tableWidth * 0.15;

    // En-têtes de colonnes
    doc.setFillColor(50, 50, 50);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.rect(x, y, tableWidth, 10, 'F');

    if (hidePrices) {
      doc.text('Désignation', x + 5, y + 6);
      doc.text('Quantité', x + colDesignationWidth + 5, y + 6);
    } else {
      doc.text('Désignation', x + 5, y + 6);
      doc.text('Quantité', x + colDesignationWidth + 5, y + 6);
      doc.text('P.U.H.T', x + colDesignationWidth + colQtyWidth + 5, y + 6);
      doc.text('Coût Total', x + colDesignationWidth + colQtyWidth + colUnitPriceWidth + 5, y + 6);
    }

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    let currentY = y + 10;
    const lineHeight = 15;
    const maxDesignationHeight = 15;

    articles.forEach((article, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(x, currentY, tableWidth, lineHeight, 'F');
      }

      const designationLines = doc.splitTextToSize(article.designation, colDesignationWidth - 10);
      const designationHeight = Math.min(designationLines.length * lineHeight, maxDesignationHeight);
      const rowHeight = Math.max(lineHeight, designationHeight);

      doc.text(designationLines, x + 5, currentY + 6, {
        maxWidth: colDesignationWidth - 10,
        lineHeightFactor: 1.5
      });

      if (hidePrices) {
        doc.text(article.quantite.toString(), x + colDesignationWidth + 5, currentY + 6);
      } else {
        doc.text(article.quantite.toString(), x + colDesignationWidth + 5, currentY + 6);
        doc.text(`${Number(article.prixUnitaire).toFixed(2)} DH`,
          x + colDesignationWidth + colQtyWidth + 5, currentY + 6);
        doc.text(`${Number(article.prixTotal).toFixed(2)} DH`,
          x + colDesignationWidth + colQtyWidth + colUnitPriceWidth + 5, currentY + 6);
      }

      currentY += rowHeight;
    });

    return currentY; // Retourne la position Y finale
  }

  downloadPdf(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private getDocumentLabel(type: TypeDocument): string {
    return type === 'FACTURE' ? 'FACTURE' :
      type === 'DEVIS' ? 'DEVIS' : 'BON DE LIVRAISON';
  }

  private getDocumentNumber(document: any, type: TypeDocument): string {
    if (type === 'FACTURE') return document?.numFacture;
    if (type === 'DEVIS') return document?.numDevis;
    return document.numBl;
  }

  private getClientFromDocument(document: any): Client {
    return document.client;
  }

  private getArticlesFromDocument(document: any): ArticleTableFacture[] {
    return document.articles;
  }
}
