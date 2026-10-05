<?php

// app/Http/Controllers/DevisController.php
namespace App\Http\Controllers;

use App\Models\Devis;
use App\Models\ArticleTableDevis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DevisController extends Controller
{
    public function index()
    {
        return Devis::with(['client', 'articles'])
                    ->orderBy('id', 'desc')
                    ->get();
    }

    public function latest()
    {
        return Devis::with(['client', 'articles'])
                      ->orderBy('id', 'desc')
                      ->limit(5)
                      ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'montant' => 'required|numeric',
            'statut' => 'required|in:EN_ATTENTE,ACCEPTE,REFUSE',
            'remiseDevis' => 'nullable|numeric|min:0|max:100',
            'date' => 'required|date',
            'articles' => 'required|array',
            'articles.*.designation' => 'required|string',
            'articles.*.description' => 'nullable|string',
            'articles.*.quantite' => 'required|integer|min:1',
            'articles.*.prixUnitaire' => 'required|numeric|min:0',
            'articles.*.prixTotal' => 'required|numeric|min:0',
        ]);

        // Ajoutez le numéro de devis généré automatiquement
        $validated['numDevis'] = app('documentNumber')->generateDevisNumber();

        $devis = Devis::create($validated);

        foreach ($request->articles as $article) {
            $article['devis_id'] = $devis->id;
            $article['description'] = $article['description'] ?? '';
            ArticleTableDevis::create($article);
        }

        return $devis->load(['client', 'articles']);
    }

    public function update(Request $request, $id)
    {
        $devis = Devis::find($id);

        if (!$devis) {
            return response()->json([
                'success'   => false,
                'message'   => 'Devis non trouvé.',
                'errorCode' => 'DEVIS_NOT_FOUND'
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
                'numDevis' => 'sometimes|string|unique:devis,numDevis,'.$id,
                'client_id' => 'sometimes|exists:clients,id',
                'montant' => 'sometimes|numeric',
                'remiseDevis' => 'nullable|numeric|min:0|max:100',
                'statut' => 'sometimes|in:EN_ATTENTE,ACCEPTE,REFUSE',
                'date' => 'sometimes|date',
                'articles' => 'sometimes|array',
                'articles.*.designation' => 'required_with:articles|string',
                'articles.*.description' => 'nullable|string',
                'articles.*.quantite' => 'required_with:articles|integer|min:1',
                'articles.*.prixUnitaire' => 'required_with:articles|numeric|min:0',
                'articles.*.prixTotal' => 'required_with:articles|numeric|min:0',
            ])->validate();

            // Mise à jour du devis (sans les articles)
            $devisData = collect($validated)->except('articles')->toArray();
            $devis->update($devisData);

            // Mise à jour des articles si fournis
            if (isset($validated['articles'])) {
                // Supprimer tous les anciens articles
                ArticleTableDevis::where('devis_id', $id)->delete();

                // Créer les nouveaux articles
                foreach ($validated['articles'] as $articleData) {
                    $articleData['devis_id'] = $devis->id;

                    // S'assurer que les valeurs numériques sont correctement formatées
                    $articleData['quantite'] = intval($articleData['quantite']);
                    $articleData['prixUnitaire'] = floatval($articleData['prixUnitaire']);
                    $articleData['prixTotal'] = floatval($articleData['prixTotal']);
                    $articleData['remise']    = floatval($articleData['remise'] ?? 0);
                    $articleData['description'] = $articleData['description'] ?? '';
                    ArticleTableDevis::create($articleData);
                }
            }

            DB::commit();

            return $devis->load(['client', 'articles']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur mise à jour devis: " . $e->getMessage());

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
            // 1. Vérifier l'existence du devis
            $devis = Devis::with(['articles'])->find($id);

            if (!$devis) {
                return response()->json([
                    'success' => false,
                    'message' => 'Devis non trouvé'
                ], 404);
            }

            // 2. Vérifier les dépendances
            if ($devis->factureExistante && $devis->blExistante) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer ce devis : une facture et un bon de livraison y sont associés.',
                    'errorCode' => 'DEVIS_HAS_FACTURE_AND_BL'
                ], 422);
            }

            if ($devis->factureExistante) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer ce devis : une facture y est associée. Supprimez d\'abord la facture.',
                    'errorCode' => 'DEVIS_HAS_FACTURE'
                ], 422);
            }

            if ($devis->blExistante) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer ce devis : un bon de livraison y est associé. Supprimez d\'abord le BL.',
                    'errorCode' => 'DEVIS_HAS_BL'
                ], 422);
            }

            // 3. Suppression en cascade
            ArticleTableDevis::where('devis_id', $id)->delete();
            $devis->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Devis et articles associés supprimés avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur suppression devis: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateStatut(Request $request, $id, $statut)
    {
        $devis = Devis::find($id);

        if (!$devis) {
            return response()->json([
                'success'   => false,
                'message'   => 'Devis non trouvé.',
                'errorCode' => 'DEVIS_NOT_FOUND'
            ], 404);
        }

        if (!in_array($statut, ['EN_ATTENTE', 'ACCEPTE', 'REFUSE'])) {
            return response()->json([
                'success'   => false,
                'message'   => 'Statut invalide. Valeurs autorisées : EN_ATTENTE, ACCEPTE, REFUSE.',
                'errorCode' => 'INVALID_STATUT'
            ], 400);
        }

        $devis->update(['statut' => $statut]);

        return $devis;
    }
}