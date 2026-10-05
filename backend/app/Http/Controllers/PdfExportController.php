<?php
namespace App\Http\Controllers;

use App\Models\Devis;
use App\Models\Facture;
use App\Models\Bl;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class PdfExportController extends Controller
{
    public function downloadPdf(Request $request)
    {
        $request->validate([
            'type' => 'required|in:devis,facture,bl',
            'id' => 'required|integer',
            'imprimable' => 'required|boolean' 
        ]);

        // Récupération du document
        switch ($request->type) {
            case 'devis':
                $document = Devis::with(['client', 'articles'])->findOrFail($request->id);
                break;
            case 'facture':
                $document = Facture::with(['client', 'articles'])->findOrFail($request->id);
                break;
            case 'bl':
                $document = Bl::with(['client', 'articles'])->findOrFail($request->id);
                break;
            default:
                abort(400, 'Type de document invalide');
        }

        // Données pour l'en-tête Splendor
        $headerData = [
            'logo' => public_path('images/entete_splendor.pdf'), // ou le chemin où vous avez stocké le fichier
            'tel1' => '0663 681 902',
            'tel2' => '0660 399 921',
            'email' => 'contact@splendorart.ma',
            'adresse' => '05 Appt 1, rue Dakar, Ocean, Rabat-Maroc',
            'ice' => '001721620000018',
            'patente' => '26307670',
            'rc' => '17824585',
            'if' => '3371415',
            'cnss' => '4146628'
        ];

        // Génération du PDF
        $pdf = Pdf::loadView('pdf.template', [
            'document' => $document,
            'type' => $request->type,
            'imprimable' => $request->boolean('imprimable', false),
            'header' => $headerData
        ]);

        // Nom du fichier
        $filename = sprintf('%s_%s_%s.pdf', 
            strtoupper($request->type),
            $document->numDevis ?? $document->numFacture ?? $document->numBl,
            now()->format('Ymd')
        );

        return $pdf->download($filename);
    }
}

