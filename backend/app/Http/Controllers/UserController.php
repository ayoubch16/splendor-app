<?php
// app/Http/Controllers/UserController.php
namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // READ - Liste tous les utilisateurs
    public function index()
    {
        return UserResource::collection(User::all());
    }

    // READ - Afficher un utilisateur spécifique
    public function show($id)
    {
        return new UserResource(User::findOrFail($id));
    }

    // CREATE - Créer un utilisateur
    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|unique:users',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'role' => 'required|in:ROLE_USER,ROLE_ADMIN,ROLE_SUPER_ADMIN,ROLE_CLIENT,ROLE_VENDEUR,ROLE_COMPTABLE,ROLE_COMMERCIAL',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = false;
        $user = User::create($validated);

        return new UserResource($user);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'username' => 'sometimes|string|unique:users,username,'.$user->id,
            'email' => 'sometimes|email|unique:users,email,'.$user->id,
            'password' => 'sometimes|string|min:8',
            'first_name' => 'string',
            'last_name' => 'string',
            'is_active' => 'boolean',
            'role' => 'in:ROLE_USER,ROLE_ADMIN,ROLE_SUPER_ADMIN,ROLE_CLIENT,ROLE_VENDEUR,ROLE_COMPTABLE,ROLE_COMMERCIAL',
        ]);

        if ($request->has('password')) {
            $validated['password'] = Hash::make($request->password);
        }

        $user->update($validated);
        return new UserResource($user);
    }

    // PATCH - Activer / désactiver un utilisateur
    public function updateStatut(Request $request, $id, $statut)
    {
        if (!in_array($statut, ['activate', 'deactivate'])) {
            return response()->json([
                'success' => false,
                'message' => 'Statut invalide. Valeurs acceptées : activate, deactivate.',
            ], 422);
        }

        $user = User::findOrFail($id);
        $user->is_active = $statut === 'activate';
        $user->save();

        return new UserResource($user);
    }

    // DELETE - Supprimer un utilisateur
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['success' => true, 'message' => 'Utilisateur supprimé avec succès']);
    }
}
