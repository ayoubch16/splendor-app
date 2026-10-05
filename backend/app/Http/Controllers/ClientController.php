<?php

// app/Http/Controllers/ClientController.php
namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index()
    {
        return response()->json(Client::orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'raisonSociale' => 'required|string',
            'adresse' => 'required|string',
            'ville_id' => 'required|numeric',
            'ice' => 'required|string',
            'telephone' => 'required|string',
            'email' => 'required|email',
        ]);
        return Client::create($validated);
    }

    public function update(Request $request, $id)
    {
        $client = Client::findOrFail($id);

        $validated = $request->validate([
            'raisonSociale' => 'string',
            'adresse' => 'string',
            'ville_id' => 'numeric',
            'ice' => 'string',
            'telephone' => 'string',
            'email' => 'email',
        ]);

        $client->update($validated);
        return $client;
    }

    public function destroy($id)
    {
        $client = Client::findOrFail($id);

        // Vérifier si le client a des relations liées
        $hasDevis    = $client->devis()->count() > 0;
        $hasFactures = $client->factures()->count() > 0;
        $hasBls      = $client->bls()->count() > 0;

        if ($hasDevis || $hasFactures || $hasBls) {
            $documents = array_filter([
                $hasDevis    ? 'devis'    : null,
                $hasFactures ? 'factures' : null,
                $hasBls      ? 'bons de livraison' : null,
            ]);

            return response()->json([
                'success'   => false,
                'message'   => 'Impossible de supprimer ce client : il possède des ' . implode(', ', $documents) . ' associés.',
                'errorCode' => 'CLIENT_HAS_DOCUMENTS'
            ], 422);
        }

        $client->delete();

        return response()->json([
            'success' => true,
            'message' => 'Client supprimé avec succès.'
        ]);
    }
}