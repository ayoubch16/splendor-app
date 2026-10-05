<?php
// app/Http/Controllers/SharedController.php
namespace App\Http\Controllers;

use App\Mail\GenericEmailWithAttachment;
use App\Models\Facture;
use App\Models\Devis;
use App\Models\Bl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SharedController extends Controller
{
    public function getCptFacture()
    {
        return Facture::count();
    }

    public function getCptDevis()
    {
        return Devis::count();
    }

    public function getCptBl()
    {
        return Bl::count();
    }

    /**
     * Envoie par email un document dont le PDF est généré côté Angular
     * et transmis encodé en base64.
     */
    public function sendEmail(Request $request)
    {
        $validated = $request->validate([
            'to' => 'required|email',
            'subject' => 'required|string|max:255',
            'message' => 'nullable|string',
            'pdfBase64' => 'required|string',
            'pdfFileName' => 'required|string|max:255',
        ]);

        $pdfContent = base64_decode($validated['pdfBase64'], true);

        if ($pdfContent === false || strpos($pdfContent, '%PDF') !== 0) {
            return response()->json([
                'success' => false,
                'message' => 'La pièce jointe n\'est pas un PDF valide.',
                'errorCode' => 'INVALID_PDF'
            ], 422);
        }

        try {
            Mail::to($validated['to'])->send(new GenericEmailWithAttachment(
                $validated['subject'],
                $validated['message'] ?? '',
                $pdfContent,
                basename($validated['pdfFileName'])
            ));
        } catch (\Exception $e) {
            Log::error("Erreur envoi email: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi de l\'email',
                'errorCode' => 'EMAIL_SEND_FAILED'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Email envoyé avec succès'
        ]);
    }
}