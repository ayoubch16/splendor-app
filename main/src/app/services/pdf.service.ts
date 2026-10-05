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
  private readonly BOTTOM_CONTENT_MARGIN = 35;
  private readonly CONTINUATION_START_Y = this.HEADER_HEIGHT + 10;
  private readonly TABLE_HEADER_HEIGHT = 10;
  private readonly ROW_HEIGHT = 15;
  private readonly TABLE_TOTALS_GAP = 5;
  private readonly TOTALS_SIGNATURE_GAP = 10;

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

    const articles = this.getArticlesFromDocument(document) || [];
    const startY = 40 + this.HEADER_HEIGHT;
    const pageHeight = doc.internal.pageSize.getHeight();

    // La remise est resolue avant la mise en page : elle determine la hauteur du bloc totaux.
    const remise = options.type !== 'BL' ? this.resolveRemisePercent(document, articles) : 0;
    const tailHeight = this.getTailHeight(options, remise);

    // Repartition des lignes page par page en reservant la place du bloc final,
    // pour ne jamais produire une page qui ne contiendrait que les totaux.
    const rowsPerPage = this.planTablePagination(articles.length, startY, tailHeight, pageHeight);

    const tableEndY = await this.generateArticlesTable(
      doc, articles, margin, startY, options.type === 'BL', rowsPerPage
    );
    let yPosition = tableEndY + this.TABLE_TOTALS_GAP;

    // Filet de securite : la pagination reserve deja la place, ceci ne devrait pas se declencher.
    if (yPosition + tailHeight > pageHeight - this.BOTTOM_CONTENT_MARGIN) {
      doc.addPage();
      await this.addHeaderImage(doc);
      yPosition = this.CONTINUATION_START_Y;
    }

    if (options.type !== 'BL') {
      this.addTotalsSection(doc, articles, pageWidth, margin, yPosition, remise);

      if (options.withSignature) {
        const signatureY = yPosition + this.getTotalsBoxHeight(remise) + this.TOTALS_SIGNATURE_GAP;
        await this.addSignature(doc, pageWidth, margin, signatureY);
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
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      this.addFooterText(doc);
    }
  }

  private async addSignature(doc: jsPDF, pageWidth: number, margin: number, signatureY: number): Promise<void> {
    try {
      await this.addImageToPdf(
        doc,
        this.SIGNATURE_IMAGE,
        pageWidth - margin - this.SIGNATURE_WIDTH - 10,
        signatureY,
        this.SIGNATURE_WIDTH,
        this.SIGNATURE_HEIGHT
      );
    } catch (error) {
      console.error('Erreur lors du chargement de l\'image de signature:', error);
      this.addTextSignature(doc, pageWidth, margin, signatureY);
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
    // Couleur dorée/olive des labels (identique à l'image footer)
    const gold: [number, number, number] = [139, 118, 54];
    const dark: [number, number, number] = [50, 50, 50];
    const cx = pageWidth / 2;
    let y = pageHeight - 28;

    // Ligne 1 : SPLENDOR ART (SPLENDOR en gras, ART en normal, même couleur dorée)
    doc.setFontSize(9);
    doc.setTextColor(...gold);
    const splendorBold = 'SPLENDOR';
    const artNormal = ' ART';
    doc.setFont('helvetica', 'bold');
    const splendorW = doc.getTextWidth(splendorBold);
    doc.setFont('helvetica', 'normal');
    const artW = doc.getTextWidth(artNormal);
    let x1 = cx - (splendorW + artW) / 2;
    doc.setFont('helvetica', 'bold');
    doc.text(splendorBold, x1, y); x1 += splendorW;
    doc.setFont('helvetica', 'normal');
    doc.text(artNormal, x1, y);

    y += 5;
    // Ligne 2 : Tél / E-mail
    doc.setFontSize(8);
    const telLabel = 'Tél:';
    const telValue = ' 0663 681 902 \u2022 0660 399 921 \u2022 ';
    const emailLabel = 'E-mail:';
    const emailValue = ' contact@splendorart.ma';
    doc.setFont('helvetica', 'bold');
    const telLabelW = doc.getTextWidth(telLabel);
    const emailLabelW = doc.getTextWidth(emailLabel);
    doc.setFont('helvetica', 'normal');
    const telValueW = doc.getTextWidth(telValue);
    const emailValueW = doc.getTextWidth(emailValue);
    let x2 = cx - (telLabelW + telValueW + emailLabelW + emailValueW) / 2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gold);
    doc.text(telLabel, x2, y); x2 += telLabelW;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...dark);
    doc.text(telValue, x2, y); x2 += telValueW;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gold);
    doc.text(emailLabel, x2, y); x2 += emailLabelW;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...dark);
    doc.text(emailValue, x2, y);

    y += 5;
    // Ligne 3 : Adresse
    const addrLabel = 'Adresse:';
    const addrValue = ' 05 Appt 1, rue Dakar, Ocean, Rabat-Maroc';
    doc.setFont('helvetica', 'bold');
    const addrLabelW = doc.getTextWidth(addrLabel);
    doc.setFont('helvetica', 'normal');
    const addrValueW = doc.getTextWidth(addrValue);
    let x3 = cx - (addrLabelW + addrValueW) / 2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gold);
    doc.text(addrLabel, x3, y); x3 += addrLabelW;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...dark);
    doc.text(addrValue, x3, y);

    y += 3;
    // Séparateur
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.3);
    doc.line(cx - 25, y, cx + 25, y);

    y += 5;
    // Ligne 4 : identifiants fiscaux
    const fiscals: { label: string; value: string; labelW?: number; valueW?: number }[] = [
      { label: 'ICE:', value: ' 003538492000090' },
      { label: ' \u2022 PATTENTE:', value: ' 26307670' },
      { label: ' \u2022 RC:', value: ' 179247' },
      { label: ' \u2022 IF:', value: ' 66001622' },
      { label: ' \u2022 CNSS:', value: ' 5798332' },
    ];
    // Mesure des largeurs avec le bon font
    let line4Width = 0;
    for (const f of fiscals) {
      doc.setFont('helvetica', 'bold');
      f.labelW = doc.getTextWidth(f.label);
      doc.setFont('helvetica', 'normal');
      f.valueW = doc.getTextWidth(f.value);
      line4Width += f.labelW + f.valueW;
    }
    let x4 = cx - line4Width / 2;
    for (const f of fiscals) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...gold);
      doc.text(f.label, x4, y); x4 += f.labelW!;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...dark);
      doc.text(f.value, x4, y); x4 += f.valueW!;
    }

    // Réinitialiser la couleur de texte
    doc.setTextColor(0, 0, 0);
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
    if (document.numBC != null && type !== TypeDocument.DEVIS) {
      doc.text(`BON DE COMMANDE: N° ${document.numBC}`, pageWidth - margin, 17 + this.HEADER_HEIGHT, { align: 'right' });
      doc.text(`DATE: ${new Date(document.date).toLocaleDateString('fr-FR')}`, pageWidth - margin, 24 + this.HEADER_HEIGHT, { align: 'right' });
    } else {
      doc.text(`DATE: ${new Date(document.date).toLocaleDateString('fr-FR')}`, pageWidth - margin, 17 + this.HEADER_HEIGHT, { align: 'right' });
    }
  }

  private resolveRemisePercent(document: any, articles: ArticleTableFacture[]): number {
    const explicit = Number(document?.remiseDevis);
    if (!isNaN(explicit) && explicit > 0) {
      return explicit;
    }
    const montantStocke = Number(document?.montant);
    if (!montantStocke || isNaN(montantStocke)) return 0;
    const totalHT = articles.reduce((sum, a) => sum + Number(a.prixTotal || 0), 0);
    const totalCalculeTTC = totalHT * 1.2;
    if (totalCalculeTTC <= 0) return 0;
    const ratio = montantStocke / totalCalculeTTC;
    if (ratio >= 0.9999) return 0;
    return Math.round((1 - ratio) * 10000) / 100;
  }

  /** Hauteur de l'encadre des totaux : une ligne supplementaire quand une remise est affichee. */
  private getTotalsBoxHeight(remisePercent: number): number {
    return remisePercent > 0 ? 40 : 30;
  }

  /**
   * Hauteur reelle du bloc qui suit le tableau (totaux + signature), mesuree depuis
   * la premiere ligne de ce bloc. Sert a reserver la place pendant la pagination.
   */
  private getTailHeight(options: GeneratePdfOptions, remisePercent: number): number {
    if (options.type === 'BL') {
      return options.withSignature ? 80 : 10;
    }
    const boxHeight = this.getTotalsBoxHeight(remisePercent);
    return options.withSignature
      ? boxHeight + this.TOTALS_SIGNATURE_GAP + this.SIGNATURE_HEIGHT
      : boxHeight;
  }

  /**
   * Nombre de lignes d'articles a poser sur chaque page.
   * La place du bloc final est reservee sur la derniere page, et au moins une ligne
   * d'article y est conservee : les totaux ne se retrouvent jamais seuls sur une page.
   */
  private planTablePagination(
    articleCount: number,
    firstPageStartY: number,
    tailHeight: number,
    pageHeight: number
  ): number[] {
    const bottomLimit = pageHeight - this.BOTTOM_CONTENT_MARGIN;
    const rowCapacity = (tableStartY: number, reserve: number): number =>
      Math.floor((bottomLimit - tableStartY - this.TABLE_HEADER_HEIGHT - reserve) / this.ROW_HEIGHT);

    if (articleCount <= 0) return [0];

    const plan: number[] = [];
    let remaining = articleCount;
    let startY = firstPageStartY;

    while (remaining > 0) {
      const capacityFull = Math.max(1, rowCapacity(startY, 0));
      const capacityWithTail = Math.max(1, rowCapacity(startY, tailHeight + this.TABLE_TOTALS_GAP));

      if (remaining <= capacityWithTail) {
        plan.push(remaining);
        break;
      }

      // Cette page ne sera pas la derniere : on la remplit sans descendre sous
      // la capacite « avec totaux », et on laisse au moins une ligne a la page suivante.
      const take = Math.min(capacityFull, Math.max(capacityWithTail, remaining - 1));
      plan.push(take);
      remaining -= take;
      startY = this.CONTINUATION_START_Y;
    }

    return plan;
  }

  private addTotalsSection(
    doc: jsPDF,
    articles: ArticleTableFacture[],
    pageWidth: number,
    margin: number,
    yPosition: number,
    remiseDevis: number = 0
  ): void {
    const totalHT = articles.reduce((sum, article) => sum + Number(article.prixTotal || 0), 0);
    const tva = totalHT * 0.2;
    const totalAvantRemise = totalHT + tva;
    const montantRemise = totalAvantRemise * (remiseDevis / 100);
    const totalTTC = totalAvantRemise - montantRemise;

    const boxHeight = this.getTotalsBoxHeight(remiseDevis);

    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth / 2, yPosition, pageWidth / 2 - margin, boxHeight, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Total H.T', pageWidth / 2 + 5, yPosition + 7);
    doc.text('T.V.A (20%)', pageWidth / 2 + 5, yPosition + 17);

    doc.setFont('helvetica', 'bold');
    doc.text(`${Number(totalHT).toFixed(2)} DH`, pageWidth - margin - 5, yPosition + 7, { align: 'right' });
    doc.text(`${tva.toFixed(2)} DH`, pageWidth - margin - 5, yPosition + 17, { align: 'right' });

    if (remiseDevis > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 0, 0);
      doc.text(`Remise (${remiseDevis}%)`, pageWidth / 2 + 5, yPosition + 27);
      doc.setFont('helvetica', 'bold');
      doc.text(`-${montantRemise.toFixed(2)} DH`, pageWidth - margin - 5, yPosition + 27, { align: 'right' });
      doc.setTextColor(0, 0, 0);

      doc.setFont('helvetica', 'normal');
      doc.text('Total T.T.C', pageWidth / 2 + 5, yPosition + 37);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalTTC.toFixed(2)} DH`, pageWidth - margin - 5, yPosition + 37, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Total T.T.C', pageWidth / 2 + 5, yPosition + 27);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalTTC.toFixed(2)} DH`, pageWidth - margin - 5, yPosition + 27, { align: 'right' });
    }
  }

  private addTextSignature(doc: jsPDF, pageWidth: number, margin: number, signatureY: number): void {
    doc.setFont('helvetica', 'italic');
    doc.text('SPLENDOR ART', pageWidth - margin - 40, signatureY + 20);
    doc.text('05 Apr 1, Rue Dakar', pageWidth - margin - 40, signatureY + 27);
    doc.text('Océan - Rabat', pageWidth - margin - 40, signatureY + 34);
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

  private async generateArticlesTable(
    doc: jsPDF,
    articles: ArticleTableFacture[],
    x: number,
    y: number,
    hidePrices: boolean = false,
    rowsPerPage: number[] = []
  ): Promise<number> {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const tableWidth = pageWidth - 2 * margin;
    const lineHeight = this.ROW_HEIGHT;

    // Vérifier si au moins un article a une remise > 0
    const hasRemise = articles.some(a => Number((a as any).remise) > 0);

    // Largeurs colonnes dynamiques
    const colDesignationWidth = hasRemise ? tableWidth * 0.55 : tableWidth * 0.65;
    const colQtyWidth         = tableWidth * 0.10;
    const colUnitPriceWidth   = tableWidth * 0.10;
    const colRemiseWidth      = hasRemise ? tableWidth * 0.10 : 0;
    const colTotalWidth       = tableWidth * 0.15;

    const drawHeaderRow = (yStart: number): number => {
      doc.setFillColor(50, 50, 50);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.rect(x, yStart, tableWidth, this.TABLE_HEADER_HEIGHT, 'F');

      if (hidePrices) {
        doc.text('Désignation', x + 5, yStart + 6);
        doc.text('Quantité', x + colDesignationWidth + 5, yStart + 6);
      } else {
        doc.text('Désignation', x + 5, yStart + 6);
        doc.text('Quantité', x + colDesignationWidth + 5, yStart + 6);
        doc.text('P.U.H.T', x + colDesignationWidth + colQtyWidth + 5, yStart + 6);
        if (hasRemise) {
          doc.text('Remise', x + colDesignationWidth + colQtyWidth + colUnitPriceWidth + 5, yStart + 6);
        }
        doc.text('Coût Total', x + colDesignationWidth + colQtyWidth + colUnitPriceWidth + colRemiseWidth + 5, yStart + 6);
      }

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      return yStart + this.TABLE_HEADER_HEIGHT;
    };

    let currentY = drawHeaderRow(y);
    let pageIndex = 0;
    let rowsDrawnOnPage = 0;

    for (let index = 0; index < articles.length; index++) {
      const article = articles[index];
      const maxRowsOnPage = Math.max(1, rowsPerPage[pageIndex] ?? articles.length);

      if (rowsDrawnOnPage >= maxRowsOnPage) {
        doc.addPage();
        await this.addHeaderImage(doc);
        currentY = drawHeaderRow(this.CONTINUATION_START_Y);
        pageIndex++;
        rowsDrawnOnPage = 0;
      }

      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(x, currentY, tableWidth, lineHeight, 'F');
      }

      const designationLines = doc.splitTextToSize(article.designation, colDesignationWidth - 10);
      const rowHeight = lineHeight;

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      doc.text(designationLines, x + 5, currentY + 6, {
        maxWidth: colDesignationWidth - 10,
        lineHeightFactor: 1.5
      });

      if (hidePrices) {
        doc.text(article.quantite.toString(), x + colDesignationWidth + 5, currentY + 6);
      } else {
        doc.text(article.quantite.toString(), x + colDesignationWidth + 5, currentY + 6);
        doc.text(
          `${Number(article.prixUnitaire).toFixed(2)} DH`,
          x + colDesignationWidth + colQtyWidth + 5,
          currentY + 6
        );

        if (hasRemise) {
          const remise = Number((article as any).remise || 0);
          if (remise > 0) {
            doc.setTextColor(200, 0, 0);
            doc.text(
              `${remise}%`,
              x + colDesignationWidth + colQtyWidth + colUnitPriceWidth + 5,
              currentY + 6
            );
            doc.setTextColor(0, 0, 0);
          } else {
            doc.text(
              '-',
              x + colDesignationWidth + colQtyWidth + colUnitPriceWidth + 5,
              currentY + 6
            );
          }
        }

        doc.text(
          `${Number(article.prixTotal).toFixed(2)} DH`,
          x + colDesignationWidth + colQtyWidth + colUnitPriceWidth + colRemiseWidth + 5,
          currentY + 6
        );
      }

      currentY += rowHeight;
      rowsDrawnOnPage++;
    }

    return currentY;
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
