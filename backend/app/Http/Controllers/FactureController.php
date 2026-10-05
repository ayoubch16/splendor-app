<?php

// app/Http/Controllers/FactureController.php
namespace App\Http\Controllers;

use App\Models\Facture;
use App\Models\ArticleTableFacture;
use App\Models\Devis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FactureController extends Controller
{
    public function index()
    {
          return Facture::with(['client', 'articles', 'devis'])
                        ->orderBy('id', 'desc')
                        ->get();
    }

    public function latest()
    {
        return Facture::with(['client', 'articles'])
                      ->orderBy('id', 'desc')
                      ->limit(5)
                      ->get();
    }

    public function createFromDevis($devisId)
    {
        // 1. Vérifier que le devis existe
        $devis = Devis::with(['client', 'articles'])->find($devisId);

        if (!$devis) {
            return response()->json([
                'success'   => false,
                'message'   => 'Devis non trouvé.',
                'errorCode' => 'DEVIS_NOT_FOUND'
            ], 404);
        }

        // 2. Vérifier qu'une facture n'existe pas déjà
        if ($devis->factureExistante) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de créer une facture : ce devis en possède déjà une.',
                'errorCode' => 'DEVIS_ALREADY_HAS_FACTURE'
            ], 400);
        }

        $facture = Facture::create([
            'numFacture' => str_replace('DEV', 'FACT', $devis->numDevis),
            'client_id' => $devis->client_id,
            'montant' => $devis->montant,
            'statut' => 'NON_PAYEE',
            'date' => now()->format('Y-m-d'),
            'devis_id' => $devis->id,
            'numBC' => null
        ]);

        foreach ($devis->articles as $article) {
            ArticleTableFacture::create([
                'designation' => $article->designation,
                'description' => $article->description,
                'quantite' => $article->quantite,
                'prixUnitaire' => $article->prixUnitaire,
                'prixTotal' => $article->prixTotal,
                'facture_id' => $facture->id,
            ]);
        }

        $devis->update(['factureExistante' => true]);

        return $facture->load(['client', 'articles', 'devis']);
    }

    public function update(Request $request, $id)
    {
        $factures = Facture::find($id);

        if (!$factures) {
            return response()->json([
                'success'   => false,
                'message'   => 'Facture non trouvée.',
                'errorCode' => 'FACTURE_NOT_FOUND'
            ], 404);
        }

        DB::beginTransaction();

        try {
            // Préparation des données pour la validation
            $requestData = $request->all();

            // Gérer le cas où montant est "NaN" ou invalide
            if (isset($requestData['montant']) && ($requestData['montant'] === 'NaN' || !is_numeric($requestData['montant']))) {
                // Calculer le montant total à partir des articles si disponibles
                if (isset($requestData['articles']) && is_array($requestData['articles'])) {
                    $montantTotal = 0;
                    foreach ($requestData['articles'] as $article) {
                        $montantTotal += floatval($article['prixTotal'] ?? 0);
                    }
                    $requestData['montant'] = $montantTotal;
                } else {
                    unset($requestData['montant']); // Ne pas mettre à jour le montant si invalide
                }
            }

            $validated = validator($requestData, [
                'numFacture' => 'sometimes|string|unique:factures,numFacture,'.$id,
                'client_id' => 'sometimes|exists:clients,id',
                'montant' => 'sometimes|numeric',
                'statut' => 'sometimes|in:NON_PAYEE,PAYEE,PARTIELLEMENT_PAYEE',
                'date' => 'sometimes|date',
                'numBC' => 'sometimes|nullable|string',
                'articles' => 'sometimes|array',
                'articles.*.designation' => 'required_with:articles|string',
                'articles.*.description' => 'nullable|string',
                'articles.*.quantite' => 'required_with:articles|integer|min:1',
                'articles.*.prixUnitaire' => 'required_with:articles|numeric|min:0',
                'articles.*.prixTotal' => 'required_with:articles|numeric|min:0',
            ])->validate();

            // Mise à jour de la facture (sans les articles)
            $factureData = collect($validated)->except('articles')->toArray();
            $factures->update($factureData);

            // Mise à jour des articles si fournis
            if (isset($validated['articles'])) {
                // Supprimer tous les anciens articles
                ArticleTableFacture::where('facture_id', $id)->delete();

                // Créer les nouveaux articles
                foreach ($validated['articles'] as $articleData) {
                    $articleData['facture_id'] = $factures->id;

                    // S'assurer que les valeurs numériques sont correctement formatées
                    $articleData['quantite'] = intval($articleData['quantite']);
                    $articleData['prixUnitaire'] = floatval($articleData['prixUnitaire']);
                    $articleData['prixTotal'] = floatval($articleData['prixTotal']);

                    ArticleTableFacture::create($articleData);
                }
            }

            DB::commit();

            return $factures->load(['client', 'articles']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur mise à jour facture: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            // 1. Vérifier l'existence de la facture
            $facture = Facture::with(['articles'])->find($id);

            if (!$facture) {
                return response()->json([
                    'success' => false,
                    'message' => 'Facture non trouvée'
                ], 404);
            }

            // 2. Vérifier le statut
            if ($facture->statut === 'PAYEE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer cette facture : elle est marquée comme payée.',
                    'errorCode' => 'FACTURE_ALREADY_PAID'
                ], 422);
            }

            // 3. Suppression en cascade
            ArticleTableFacture::where('facture_id', $id)->delete();

            // 4. Mettre à jour le devis associé si existe
            if ($facture->devis_id) {
                Devis::where('id', $facture->devis_id)
                    ->update(['factureExistante' => false]);
            }

            $facture->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Facture et articles associés supprimés avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur suppression facture: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateStatut(Request $request, $id, $statut)
    {
        $facture = Facture::find($id);

        if (!$facture) {
            return response()->json([
                'success'   => false,
                'message'   => 'Facture non trouvée.',
                'errorCode' => 'FACTURE_NOT_FOUND'
            ], 404);
        }

        if (!in_array($statut, ['NON_PAYEE', 'PAYEE', 'PARTIELLEMENT_PAYEE'])) {
            return response()->json([
                'success'   => false,
                'message'   => 'Statut invalide. Valeurs autorisées : NON_PAYEE, PARTIELLEMENT_PAYEE, PAYEE.',
                'errorCode' => 'INVALID_STATUT'
            ], 400);
        }

        $facture->update(['statut' => $statut]);

        return $facture;
    }
}
