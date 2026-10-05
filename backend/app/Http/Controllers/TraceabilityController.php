<?php
// app/Http/Controllers/TraceabilityController.php

namespace App\Http\Controllers;

use App\Models\TraceOperation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TraceabilityController extends Controller
{
    /**
     * Enregistrer une opération de traçabilité
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'timestamp' => 'required|date',
            'operationType' => 'required|in:' . implode(',', TraceOperation::OPERATION_TYPES),
            'entityType' => 'required|in:' . implode(',', TraceOperation::ENTITY_TYPES),
            'entityId' => 'required|integer|min:1',
            'userId' => 'required|integer|min:1',
            'userName' => 'required|string|max:255',
            'details' => 'required|string',
            'previousState' => 'nullable|array',
            'newState' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Convertir les noms de champ camelCase vers snake_case pour la base
            $operation = TraceOperation::create([
                'timestamp' => $request->timestamp,
                'operation_type' => $request->operationType,
                'entity_type' => $request->entityType,
                'entity_id' => $request->entityId,
                'user_id' => $request->userId,
                'user_name' => $request->userName,
                'details' => $request->details,
                'previous_state' => $request->previousState,
                'new_state' => $request->newState
            ]);

            return response()->json($this->formatOperation($operation), 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement de l\'opération',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer toutes les opérations
     */
    public function index(): JsonResponse
    {
        try {
            $operations = TraceOperation::orderBy('timestamp', 'desc')->get();

            return response()->json($operations->map(function ($operation) {
                return $this->formatOperation($operation);
            }));

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des opérations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Convertir une opération en camelCase pour Angular
     */
    private function formatOperation(TraceOperation $operation): array
    {
        return [
            'id' => $operation->id,
            'timestamp' => $operation->timestamp,
            'operationType' => $operation->operation_type,
            'entityType' => $operation->entity_type,
            'entityId' => $operation->entity_id,
            'userId' => $operation->user_id,
            'userName' => $operation->user_name,
            'details' => $operation->details,
            'previousState' => $operation->previous_state,
            'newState' => $operation->new_state,
            'createdAt' => $operation->created_at,
            'updatedAt' => $operation->updated_at
        ];
    }
}