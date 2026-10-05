<?php
// app/Http/Controllers/BlController.php
namespace App\Http\Controllers;

use App\Models\Bl;
use App\Models\ArticleTableBl;
use App\Models\Devis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BlController extends Controller
{
    public function index()
    {
        return Bl::with(['client', 'articles', 'devis'])
                        ->orderBy('id', 'desc')
                        ->get();
    }

    public function latest()
    {
        return Bl::with(['client', 'articles', 'devis'])
                      ->orderBy('id', 'desc')
                      ->limit(5)
                      ->get();
    }

    public function createFromDevis($devisId)
    {
        DB::beginTransaction();
        try {
            Log::info("Tentative création BL pour devis: $devisId");

            // Validation explicite
            if (!is_numeric($devisId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID du devis invalide.',
                    'errorCode' => 'INVALID_DEVIS_ID'
                ], 400);
            }

            $devis = Devis::with(['client', 'articles'])->find($devisId);

            if (!$devis) {
                Log::error("Devis $devisId non trouvé");
                return response()->json([
                    'success' => false,
                    'message' => 'Devis non trouvé.',
                    'errorCode' => 'DEVIS_NOT_FOUND'
                ], 404);
            }

            if ($devis->blExistante) {
                Log::warning("BL existe déjà pour devis $devisId");
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de créer un BL : ce devis en possède déjà un.',
                    'errorCode' => 'DEVIS_ALREADY_HAS_BL'
                ], 409);
            }

            // Création du BL
            $bl = Bl::create([
                'numBl' => str_replace('DEV', 'BL', $devis->numDevis),
                'client_id' => $devis->client_id,
                'devis_id' => $devis->id,
                'statut' => 'NON_LIVRE',
                'date' => now()->format('Y-m-d'),
                'numBC' => null
            ]);

            Log::info("BL créé avec ID: ".$bl->id);

            // Copie des articles
            foreach ($devis->articles as $article) {
                ArticleTableBl::create([
                    'bl_id' => $bl->id,
                    'designation' => $article->designation,
                    'description' => $article->description,
                    'quantite' => $article->quantite,
                    'prixUnitaire' => $article->prixUnitaire,
                    'prixTotal' => $article->prixTotal
                ]);
            }

            // Mise à jour du devis
            $devis->update(['blExistante' => true]);

            DB::commit();

            Log::info("BL $bl->id créé avec succès pour devis $devisId");

            return response()->json([
                'success' => true,
                'data' => $bl->load(['client', 'articles']),
                'message' => 'BL créé avec succès'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur création BL: ".$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du BL',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $bl = Bl::find($id);

        if (!$bl) {
            return response()->json([
                'success' => false,
                'message' => 'Bon de livraison non trouvé.',
                'errorCode' => 'BL_NOT_FOUND'
            ], 404);
        }

        DB::beginTransaction();

        try {
            // Préparation des données pour la validation
            $requestData = $request->all();

            $validated = validator($requestData, [
                'numBl' => 'sometimes|string|unique:bls,numBl,'.$id,
                'client_id' => 'sometimes|exists:clients,id',
                'statut' => 'sometimes|in:LIVRE,NON_LIVRE',
                'date' => 'sometimes|date',
                'numBC' => 'sometimes|nullable|string',
                'articles' => 'sometimes|array',
                'articles.*.designation' => 'required_with:articles|string',
                'articles.*.description' => 'nullable|string',
                'articles.*.quantite' => 'required_with:articles|integer|min:1',
                'articles.*.prixUnitaire' => 'required_with:articles|numeric|min:0',
                'articles.*.prixTotal' => 'required_with:articles|numeric|min:0',
            ])->validate();

            // Mise à jour du BL (sans les articles)
            $blData = collect($validated)->except('articles')->toArray();
            $bl->update($blData);

            // Mise à jour des articles si fournis
            if (isset($validated['articles'])) {
                // Supprimer tous les anciens articles
                ArticleTableBl::where('bl_id', $id)->delete();

                // Créer les nouveaux articles
                foreach ($validated['articles'] as $articleData) {
                    $articleData['bl_id'] = $bl->id;

                    // S'assurer que les valeurs numériques sont correctement formatées
                    $articleData['quantite'] = intval($articleData['quantite']);
                    $articleData['prixUnitaire'] = floatval($articleData['prixUnitaire']);
                    $articleData['prixTotal'] = floatval($articleData['prixTotal']);

                    ArticleTableBl::create($articleData);
                }
            }

            DB::commit();

            return $bl->load(['client', 'articles']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur mise à jour bls: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        if (!is_numeric($id)) {
            return response()->json([
                'success' => false,
                'message' => 'ID du BL invalide.',
                'errorCode' => 'INVALID_BL_ID'
            ], 400);
        }

        $bl = Bl::find($id);

        if (!$bl) {
            return response()->json([
                'success' => false,
                'message' => 'Bon de livraison non trouvé.',
                'errorCode' => 'BL_NOT_FOUND'
            ], 404);
        }

        DB::beginTransaction();
        try {
            // Suppression des articles associés
            ArticleTableBl::where('bl_id', $id)->delete();

            // Mettre à jour le devis associé si existe
            if ($bl->devis_id) {
                Devis::where('id', $bl->devis_id)
                    ->update(['blExistante' => false]);
            }

            // Suppression du BL
            $bl->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'BL supprimé avec succès'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur suppression BL : " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression'
            ], 500);
        }
    }

    public function updateStatut($blId, $statut)
    {
        Log::info("BL ID: $blId, Statut: $statut");

        // Validation explicite
        if (!in_array($statut, ['LIVRE', 'NON_LIVRE'])) {
            return response()->json([
                'success' => false,
                'message' => 'Statut invalide. Valeurs autorisées : LIVRE, NON_LIVRE.',
                'errorCode' => 'INVALID_STATUT'
            ], 400);
        }

        $bl = Bl::find($blId);

        if (!$bl) {
            return response()->json([
                'success' => false,
                'message' => 'Bon de livraison non trouvé.',
                'errorCode' => 'BL_NOT_FOUND'
            ], 404);
        }

        $bl->update(['statut' => $statut]);

        return response()->json([
            'success' => true,
            'data' => $bl,
            'message' => 'Statut mis à jour avec succès'
        ]);
    }
}